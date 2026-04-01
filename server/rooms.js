'use strict';

const db = require('./db');
const mobSim = require('./mobSim');
const sessions = require('./sessions');
const { COOKIE_NAME } = require('./auth');
const presence = require('./presenceStore');

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function attachRooms(io, { redis = null } = {}) {
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const sessionId = parseCookie(cookieHeader, COOKIE_NAME);
    const session = sessions.getSession(sessionId);

    if (!session) return next(new Error('Authentication required. Please log in.'));

    sessions.renewSession(sessionId);
    socket.username = session.username;
    socket.sessionId = sessionId;
    next();
  });

  // Local fallback for dev/no-Redis mode.
  const online = new Map();         // socketId -> snapshot
  const onlineByUser = new Map();   // username -> socketId
  const worldOverrides = new Map(); // "col,row" -> tile

  // Local sockets on this process only.
  const localPlayers = new Map();   // socketId -> snapshot

  function persistPlayer(snapshot) {
    if (!redis) return;
    presence.upsertPlayer(redis, snapshot).catch((err) => {
      console.error('[Presence] upsert failed:', err);
    });
  }

  function persistWorldOverride(col, row, tile) {
    if (!redis) return;
    presence.setWorldOverride(redis, col, row, tile).catch((err) => {
      console.error('[Presence] setWorldOverride failed:', err);
    });
  }

  async function kickExistingSocket(socketId, reason) {
    try {
      io.to(socketId).emit('force_logout', { reason });
      io.in(socketId).disconnectSockets(true);
    } catch (err) {
      console.error('[Socket] kickExistingSocket failed:', err);
    }
  }

  // ── Start mob simulation ────────────────────────────────────────────────
  mobSim.init().then(() => {
    setInterval(() => {
      mobSim.update(0.1);
      if (localPlayers.size > 0) io.emit('mob_state', mobSim.getSnapshot());
    }, 100);

    for (const [sid] of localPlayers) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.emit('mob_state', mobSim.getSnapshot());
    }
  }).catch((err) => {
    console.error('[mobSim] init failed:', err);
  });

  io.on('connection', async (socket) => {
    const username = socket.username;
    let heartbeat = null;

    try {
      if (redis) {
        const existingId = await presence.getSocketForUser(redis, username);
        const existingPlayer = await presence.getPlayer(redis, username);
        const isReconnect = existingPlayer?.sessionId === socket.sessionId;

        if (existingId && existingId !== socket.id && !isReconnect) {
          await kickExistingSocket(existingId, 'You logged in from another location.');
        }
      } else {
        const existingId = onlineByUser.get(username);
        if (existingId) {
          const existingSnap = online.get(existingId);
          const isReconnect = existingSnap?.sessionId === socket.sessionId;

          if (!isReconnect) {
            const existingSock = io.sockets.sockets.get(existingId);
            if (existingSock) {
              existingSock.emit('force_logout', { reason: 'You logged in from another location.' });
              existingSock.disconnect(true);
            }
          }
          online.delete(existingId);
        }
      }

      const save = db.loadSave(username) || {};
      const snapshot = {
        id: socket.id,
        sessionId: socket.sessionId,
        username,
        name: save.name || username,
        col: save.col ?? 512,
        row: save.row ?? 389,
        dir: 0,
        style: save.style || {},
        equipment: save.equipment || {},
        combatLevel: 1,
        hp: 10,
        maxHp: 10,
        currentAction: 'idle',
        actionTarget: null,
      };

      localPlayers.set(socket.id, snapshot);

      if (redis) {
        await presence.upsertPlayer(redis, snapshot);

        heartbeat = setInterval(() => {
          const current = localPlayers.get(socket.id);
          if (current) persistPlayer(current);
        }, 15000);
      } else {
        online.set(socket.id, snapshot);
        onlineByUser.set(username, socket.id);
      }

      mobSim.setPlayerPos(socket.id, snapshot.col, snapshot.row);

      const worldPlayers = redis
        ? (await presence.getAllPlayers(redis)).filter((p) => p.id !== socket.id)
        : [...online.values()].filter((p) => p.id !== socket.id);

      socket.emit('world_state', worldPlayers);

      if (redis) {
        const overrides = await presence.getAllWorldOverrides(redis);
        if (overrides.length > 0) {
          socket.emit('world_overrides', overrides);
        }
      } else if (worldOverrides.size > 0) {
        const overrides = [];
        for (const [key, tile] of worldOverrides) {
          const comma = key.indexOf(',');
          overrides.push({
            col: +key.slice(0, comma),
            row: +key.slice(comma + 1),
            tile,
          });
        }
        socket.emit('world_overrides', overrides);
      }

      if (mobSim.ready) socket.emit('mob_state', mobSim.getSnapshot());

      socket.broadcast.emit('player_joined', snapshot);

      // ── Incoming events ────────────────────────────────────────────────

      socket.on('move', ({ col, row, dir }) => {
        const p = localPlayers.get(socket.id);
        if (!p) return;
        if (typeof col !== 'number' || typeof row !== 'number') return;

        p.col = col;
        p.row = row;
        p.dir = dir ?? p.dir;

        mobSim.setPlayerPos(socket.id, col, row);
        persistPlayer(p);

        socket.broadcast.emit('player_moved', { id: socket.id, col, row, dir: p.dir });
      });

      socket.on('equip', ({ equipment, style, name, combatLevel }) => {
        const p = localPlayers.get(socket.id);
        if (!p) return;

        if (equipment) p.equipment = equipment;
        if (style) p.style = style;
        if (name) p.name = name;
        if (typeof combatLevel === 'number') p.combatLevel = combatLevel;

        persistPlayer(p);

        socket.broadcast.emit('player_updated', {
          id: socket.id,
          equipment: p.equipment,
          style: p.style,
          name: p.name,
          combatLevel: p.combatLevel,
        });
      });

      socket.on('action', ({ currentAction, actionTarget }) => {
        const p = localPlayers.get(socket.id);
        if (!p) return;

        const allowed = ['idle', 'chop', 'mine', 'fish', 'cook', 'fight'];
        if (!allowed.includes(currentAction)) return;

        p.currentAction = currentAction;
        p.actionTarget = actionTarget || null;

        persistPlayer(p);

        socket.broadcast.emit('player_action', {
          id: socket.id,
          currentAction,
          actionTarget: p.actionTarget,
        });
      });

      socket.on('player_hp', ({ hp, maxHp }) => {
        if (typeof hp !== 'number' || typeof maxHp !== 'number') return;

        const p = localPlayers.get(socket.id);
        if (!p) return;

        p.hp = Math.max(0, hp);
        p.maxHp = Math.max(1, maxHp);

        persistPlayer(p);

        socket.broadcast.emit('player_hp', { id: socket.id, hp: p.hp, maxHp: p.maxHp });
      });

      socket.on('player_splat', ({ damage, wx, wy }) => {
        if (typeof damage !== 'number' || typeof wx !== 'number' || typeof wy !== 'number') return;
        if (damage < 0 || damage > 500) return;
        socket.broadcast.emit('player_splat', { id: socket.id, damage, wx, wy });
      });

      socket.on('player_attack', () => {
        socket.broadcast.emit('player_attack', { id: socket.id });
      });

      socket.on('tile_change', ({ col, row, tile }) => {
        if (typeof col !== 'number' || typeof row !== 'number' || typeof tile !== 'number') return;
        if (col < 0 || col > 4096 || row < 0 || row > 4096) return;

        if (redis) persistWorldOverride(col, row, tile);
        else worldOverrides.set(`${col},${row}`, tile);

        mobSim.setTile(col, row, tile);
        socket.broadcast.emit('tile_change', { col, row, tile });
      });

      socket.on('start_combat', ({ mobId }) => {
        if (typeof mobId !== 'number') return;
        mobSim.startCombat(socket.id, mobId);
      });

      socket.on('stop_combat', ({ mobId }) => {
        if (typeof mobId !== 'number') return;
        mobSim.stopCombat(socket.id, mobId);
      });

      socket.on('mob_hit', ({ mobId, damage }) => {
        if (typeof mobId !== 'number' || typeof damage !== 'number') return;
        if (damage < 0 || damage > 500) return;

        const result = mobSim.applyDamage(mobId, damage);
        if (result) {
          io.emit('mob_damage', { id: result.id, hp: result.hp, dead: result.dead });
          socket.broadcast.emit('mob_splat', {
            id: result.id,
            damage,
            wx: result.wx,
            wy: result.wy,
          });
        }
      });

      let lastChatTime = 0;
      socket.on('chat', ({ message }) => {
        if (typeof message !== 'string') return;

        const text = message.trim().slice(0, 120);
        if (!text) return;

        const now = Date.now();
        if (now - lastChatTime < 1000) return;
        lastChatTime = now;

        const p = localPlayers.get(socket.id);
        const name = p ? (p.name || username) : username;
        io.emit('chat_message', { name, message: text });
      });

      socket.on('disconnect', async () => {
        if (heartbeat) clearInterval(heartbeat);

        mobSim.removePlayer(socket.id);
        localPlayers.delete(socket.id);

        if (redis) {
          try {
            await presence.removeSocket(redis, socket.id);
          } catch (err) {
            console.error('[Presence] removeSocket failed:', err);
          }
        } else {
          online.delete(socket.id);
          if (onlineByUser.get(username) === socket.id) {
            onlineByUser.delete(username);
          }
        }

        io.emit('player_left', { id: socket.id });
      });
    } catch (err) {
      if (heartbeat) clearInterval(heartbeat);
      console.error('[Socket] connection setup failed:', err);
      socket.disconnect(true);
    }
  });
}

module.exports = { attachRooms };