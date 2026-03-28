'use strict';
try { require('dotenv').config(); } catch {} // optional — only needed if dotenv is installed

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const db         = require('./server/db');
const authRouter = require('./server/auth');
const { attachRooms } = require('./server/rooms');

// ── Setup ──────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  // Dev fallback — warn so it's obvious in production
  process.env.JWT_SECRET = 'e23f17744982f7ea87b7b91150aa74cc';
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  JWT_SECRET env var is not set! Set it before deploying.');
    process.exit(1);
  }
}

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' },
});
const PORT   = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve game files statically
app.use(express.static(path.join(__dirname, '.')));

// ── Auth routes (/auth/register, /auth/login) ──────────
app.use('/auth', authRouter);

// ── JWT middleware for protected routes ────────────────
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  // Accept token from Authorization header OR query string (for sendBeacon)
  const token  = header.startsWith('Bearer ') ? header.slice(7)
               : (req.query.token || null);
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.username = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ── Save routes ────────────────────────────────────────
app.get('/save', requireAuth, (req, res) => {
  const save = db.loadSave(req.username);
  if (!save) return res.status(404).json({ error: 'No save found.' });
  res.json(save);
});

app.post('/save', requireAuth, (req, res) => {
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
