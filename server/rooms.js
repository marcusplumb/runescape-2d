'use strict';
const jwt = require('jsonwebtoken');
const db  = require('./db');

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

  const online       = new Map(); // socketId  → snapshot
  const onlineByUser = new Map(); // username  → socketId

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
      id:        socket.id,
      username,
      name:      save.name      || username,
      col:       save.col       ?? 512,
      row:       save.row       ?? 389,
      dir:       0,
      style:     save.style     || {},
      equipment: save.equipment || {},
    };
    online.set(socket.id, snapshot);
    onlineByUser.set(username, socket.id);

    // Send this player the current world state (everyone else online)
    const others = [...online.values()].filter(p => p.id !== socket.id);
    socket.emit('world_state', others);

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
