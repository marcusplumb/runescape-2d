'use strict';
const jwt    = require('jsonwebtoken');
const db     = require('./db');
const mobSim = require('./mobSim');

/**
 * Manages the set of connected players and broadcasts real-time position/
 * equipment updates to all other clients.
 *
 * Each entry in `online` maps  socketId → PlayerSnapshot:
 *   { id, username, name, col, row, dir, style, equipment }
 */
function attachRooms(io) {
  // Require valid JWT in Socket.io handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required.'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.username = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token.'));
    }
  });

  const online         = new Map(); // socketId  → snapshot
  const onlineByUser   = new Map(); // username  → socketId
  const worldOverrides = new Map(); // "col,row" → tile — shared world state for late joiners

  // ── Start mob simulation (async; connections accepted immediately) ──
  mobSim.init().then(() => {
    // Tick mob AI + broadcast positions every 100 ms
    setInterval(() => {
      mobSim.update(0.1);
      if (online.size > 0) {
        io.emit('mob_state', mobSim.getSnapshot());
      }
    }, 100);

    // Send current mob state to any players already connected during init
    for (const [sid] of online) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.emit('mob_state', mobSim.getSnapshot());
    }
  });

  io.on('connection', (socket) => {
    const username = socket.username;

    // Kick any existing session for this username
    const existingId = onlineByUser.get(username);
    if (existingId) {
      const existingSocket = io.sockets.sockets.get(existingId);
      if (existingSocket) {
        existingSocket.emit('force_logout', { reason: 'Logged in from another location.' });
        existingSocket.disconnect(true);
      }
      online.delete(existingId);
    }

    // Build initial snapshot from saved data (style/equipment preserved from save)
    const save = db.loadSave(username) || {};
    const snapshot = {
      id:            socket.id,
      username,
      name:          username,
      col:           save.col       ?? 512,
      row:           save.row       ?? 389,
      dir:           0,
      style:         save.style     || {},
      equipment:     save.equipment || {},
      combatLevel:   1,
      currentAction: 'idle',
      actionTarget:  null,
    };
    online.set(socket.id, snapshot);
    onlineByUser.set(username, socket.id);

    // Send this player the current world state (everyone else online)
    const others = [...online.values()].filter(p => p.id !== socket.id);
    socket.emit('world_state', others);

    // Send accumulated tile changes so the new player sees the shared world
    if (worldOverrides.size > 0) {
      const overrides = [];
      for (const [key, tile] of worldOverrides) {
        const comma = key.indexOf(',');
        overrides.push({ col: +key.slice(0, comma), row: +key.slice(comma + 1), tile });
      }
      socket.emit('world_overrides', overrides);
    }

    // Send current mob state if simulation is already ready
    if (mobSim.ready) {
      socket.emit('mob_state', mobSim.getSnapshot());
    }

    // Tell everyone else this player joined
    socket.broadcast.emit('player_joined', snapshot);

    // ── Incoming events ──────────────────────────────────

    socket.on('move', ({ col, row, dir }) => {
      const p = online.get(socket.id);
      if (!p) return;
      p.col = col;
      p.row = row;
      p.dir = dir ?? p.dir;
      socket.broadcast.emit('player_moved', { id: socket.id, col, row, dir: p.dir });
    });

    socket.on('equip', ({ equipment, style, name }) => {
      const p = online.get(socket.id);
      if (!p) return;
      if (equipment) p.equipment = equipment;
      if (style)     p.style     = style;
      if (name)      p.name      = name;
      socket.broadcast.emit('player_updated', {
        id: socket.id,
        equipment: p.equipment,
        style:     p.style,
        name:      p.name,
      });
    });

    socket.on('action', ({ currentAction, actionTarget }) => {
      const p = online.get(socket.id);
      if (!p) return;
      const allowed = ['idle','chop','mine','fish','cook','fight'];
      if (!allowed.includes(currentAction)) return;
      p.currentAction = currentAction;
      p.actionTarget  = actionTarget || null;
      socket.broadcast.emit('player_action', { id: socket.id, currentAction, actionTarget: p.actionTarget });
    });

    socket.on('tile_change', ({ col, row, tile }) => {
      if (typeof col !== 'number' || typeof row !== 'number' || typeof tile !== 'number') return;
      if (col < 0 || col > 4096 || row < 0 || row > 4096) return;
      worldOverrides.set(`${col},${row}`, tile);
      mobSim.setTile(col, row, tile); // keep mob pathfinding world in sync
      socket.broadcast.emit('tile_change', { col, row, tile });
    });

    socket.on('mob_hit', ({ mobId, damage }) => {
      if (typeof mobId !== 'number' || typeof damage !== 'number') return;
      if (damage < 0 || damage > 500) return; // sanity cap
      const result = mobSim.applyDamage(mobId, damage);
      if (result) {
        io.emit('mob_damage', { id: result.id, hp: result.hp, dead: result.dead });
        // Send hit splat to all OTHER clients (sender already shows their own)
        socket.broadcast.emit('mob_splat', { id: result.id, damage, wx: result.wx, wy: result.wy });
      }
    });

    // Chat rate-limit: 1 message per second
    let lastChatTime = 0;
    socket.on('chat', ({ message }) => {
      if (typeof message !== 'string') return;
      const text = message.trim().slice(0, 120);
      if (!text) return;
      const now = Date.now();
      if (now - lastChatTime < 1000) return; // rate limit
      lastChatTime = now;
      const p = online.get(socket.id);
      const name = p ? (p.name || username) : username;
      io.emit('chat_message', { name, message: text });
    });

    socket.on('disconnect', () => {
      online.delete(socket.id);
      // Only remove from onlineByUser if this socket is still the current session
      if (onlineByUser.get(username) === socket.id) {
        onlineByUser.delete(username);
      }
      io.emit('player_left', { id: socket.id });
    });
  });
}

module.exports = { attachRooms };
