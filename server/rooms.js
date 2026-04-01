'use strict';
const db       = require('./db');
const mobSim   = require('./mobSim');
const sessions = require('./sessions');
const { COOKIE_NAME } = require('./auth');

/**
 * Parse a single named cookie from a raw Cookie header string.
 * Used to extract the session ID from Socket.io handshake headers.
 * We parse manually here because cookie-parser is Express middleware and
 * does not run on WebSocket upgrade requests.
 */
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq  = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) {
      try { return decodeURIComponent(part.slice(eq + 1).trim()); }
      catch { return null; }
    }
  }
  return null;
}

/**
 * Manages the set of connected players and broadcasts real-time updates.
 *
 * Each entry in `online` maps socketId → PlayerSnapshot:
 *   { id, username, name, col, row, dir, style, equipment, combatLevel,
 *     hp, maxHp, currentAction, actionTarget }
 */
function attachRooms(io) {
  // Security-critical: validate the session cookie on every WebSocket connection.
  // Rejects connections with missing, invalid, or expired sessions.
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const sessionId    = parseCookie(cookieHeader, COOKIE_NAME);
    const session      = sessions.getSession(sessionId);

    if (!session) return next(new Error('Authentication required. Please log in.'));

    sessions.renewSession(sessionId); // keep session alive while playing
    socket.username  = session.username;
    socket.sessionId = sessionId;
    next();
  });

  const online         = new Map(); // socketId  → snapshot
  const onlineByUser   = new Map(); // username  → socketId
  const worldOverrides = new Map(); // "col,row" → tile

  // ── Start mob simulation ──────────────────────────────────────────────────
  mobSim.init().then(() => {
    setInterval(() => {
      mobSim.update(0.1);
      if (online.size > 0) io.emit('mob_state', mobSim.getSnapshot());
    }, 100);

    for (const [sid] of online) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.emit('mob_state', mobSim.getSnapshot());
    }
  });

  io.on('connection', (socket) => {
    const username = socket.username;

    // Single-session enforcement: kick any existing socket for this username,
    // BUT only if it belongs to a different HTTP session (genuine new login from
    // another device/browser). A reconnect from the same session (e.g. Socket.io
    // dropping and re-establishing the transport) must NOT trigger force_logout —
    // that would cause a logout→session-invalidated→"session expired" cascade.
    const existingId = onlineByUser.get(username);
    if (existingId) {
      const existingSnap = online.get(existingId);
      const isReconnect  = existingSnap?.sessionId === socket.sessionId;
      if (!isReconnect) {
        // Genuinely a different login — kick the old session.
        const existingSock = io.sockets.sockets.get(existingId);
        if (existingSock) {
          existingSock.emit('force_logout', { reason: 'You logged in from another location.' });
          existingSock.disconnect(true);
        }
      }
      online.delete(existingId);
    }

    const save = db.loadSave(username) || {};
    const snapshot = {
      id:            socket.id,
      sessionId:     socket.sessionId, // used above to detect reconnects vs new logins
      username,
      name:          save.name      || username,
      col:           save.col       ?? 512,
      row:           save.row       ?? 389,
      dir:           0,
      style:         save.style     || {},
      equipment:     save.equipment || {},
      combatLevel:   1,
      hp:            10,
      maxHp:         10,
      currentAction: 'idle',
      actionTarget:  null,
    };
    online.set(socket.id, snapshot);
    onlineByUser.set(username, socket.id);
    mobSim.setPlayerPos(socket.id, snapshot.col, snapshot.row);

    // Send this player the current world (everyone else online)
    socket.emit('world_state', [...online.values()].filter(p => p.id !== socket.id));

    // Send accumulated world tile changes
    if (worldOverrides.size > 0) {
      const overrides = [];
      for (const [key, tile] of worldOverrides) {
        const comma = key.indexOf(',');
        overrides.push({ col: +key.slice(0, comma), row: +key.slice(comma + 1), tile });
      }
      socket.emit('world_overrides', overrides);
    }

    if (mobSim.ready) socket.emit('mob_state', mobSim.getSnapshot());

    socket.broadcast.emit('player_joined', snapshot);

    // ── Incoming events ───────────────────────────────────────────────────

    socket.on('move', ({ col, row, dir }) => {
      const p = online.get(socket.id);
      if (!p) return;
      p.col = col;
      p.row = row;
      p.dir = dir ?? p.dir;
      mobSim.setPlayerPos(socket.id, col, row);
      socket.broadcast.emit('player_moved', { id: socket.id, col, row, dir: p.dir });
    });

    socket.on('equip', ({ equipment, style, name, combatLevel }) => {
      const p = online.get(socket.id);
      if (!p) return;
      if (equipment)                       p.equipment    = equipment;
      if (style)                           p.style        = style;
      if (name)                            p.name         = name;
      if (typeof combatLevel === 'number') p.combatLevel  = combatLevel;
      socket.broadcast.emit('player_updated', {
        id:          socket.id,
        equipment:   p.equipment,
        style:       p.style,
        name:        p.name,
        combatLevel: p.combatLevel,
      });
    });

    socket.on('action', ({ currentAction, actionTarget }) => {
      const p = online.get(socket.id);
      if (!p) return;
      const allowed = ['idle', 'chop', 'mine', 'fish', 'cook', 'fight'];
      if (!allowed.includes(currentAction)) return;
      p.currentAction = currentAction;
      p.actionTarget  = actionTarget || null;
      socket.broadcast.emit('player_action', {
        id: socket.id, currentAction, actionTarget: p.actionTarget,
      });
    });

    socket.on('player_hp', ({ hp, maxHp }) => {
      if (typeof hp !== 'number' || typeof maxHp !== 'number') return;
      const p = online.get(socket.id);
      if (!p) return;
      p.hp    = Math.max(0, hp);
      p.maxHp = Math.max(1, maxHp);
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
      worldOverrides.set(`${col},${row}`, tile);
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
        socket.broadcast.emit('mob_splat', { id: result.id, damage, wx: result.wx, wy: result.wy });
      }
    });

    // Chat rate-limit: 1 message per second per connection
    let lastChatTime = 0;
    socket.on('chat', ({ message }) => {
      if (typeof message !== 'string') return;
      const text = message.trim().slice(0, 120);
      if (!text) return;
      const now = Date.now();
      if (now - lastChatTime < 1000) return;
      lastChatTime = now;
      const p    = online.get(socket.id);
      const name = p ? (p.name || username) : username;
      io.emit('chat_message', { name, message: text });
    });

    socket.on('disconnect', () => {
      mobSim.removePlayer(socket.id);
      online.delete(socket.id);
      if (onlineByUser.get(username) === socket.id) onlineByUser.delete(username);
      io.emit('player_left', { id: socket.id });
    });
  });
}

module.exports = { attachRooms };
