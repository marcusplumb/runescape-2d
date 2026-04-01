'use strict';

const express        = require('express');
const http           = require('http');
const { Server }     = require('socket.io');
const cookieParser   = require('cookie-parser');
const path           = require('path');
const db             = require('./server/db');
const { router: authRouter, requireSession } = require('./server/auth');
const { attachRooms } = require('./server/rooms');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', credentials: true },
});
const PORT   = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());

// Serve game files statically
app.use(express.static(path.join(__dirname, '.')));

// ── Auth routes (/auth/register, /auth/login, /auth/logout, /auth/me) ──
app.use('/auth', authRouter);

// ── Save routes ────────────────────────────────────────
app.get('/save', requireSession, (req, res) => {
  const save = db.loadSave(req.username);
  if (!save) return res.status(404).json({ error: 'No save found.' });
  res.json(save);
});

app.post('/save', requireSession, (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
    return res.status(400).json({ error: 'Invalid save data.' });
  try {
    db.writeSave(req.username, req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Save route] write failed for', req.username, ':', e);
    res.status(500).json({ error: 'Save failed.' });
  }
});

// ── Real-time multiplayer ──────────────────────────────
attachRooms(io);

// ── Start ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`RuneWorld server running at http://localhost:${PORT}`);
});
