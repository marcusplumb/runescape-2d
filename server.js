'use strict';
try { require('dotenv').config(); } catch {} // optional — only needed if dotenv is installed

const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cookieParser = require('cookie-parser');
const path         = require('path');
const db           = require('./server/db');
const { router: authRouter, requireSession } = require('./server/auth');
const { attachRooms } = require('./server/rooms');

// ── Secrets ────────────────────────────────────────────────────────────────
// Security-critical: SESSION_SECRET is used to sign the session cookie name
// lookup. Must be set in production via environment variable.
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET env var is not set. Set it before deploying.');
    process.exit(1);
  }
  // Dev fallback — not secret, not for production
  process.env.SESSION_SECRET = 'dev-only-secret-change-in-production';
  console.warn('⚠  SESSION_SECRET not set — using insecure dev default.');
}

// ── CORS origin list ────────────────────────────────────────────────────────
// Security-critical: do NOT use '*' (wildcard) once credentials (cookies) are
// involved — browsers reject credentialed requests to wildcard CORS origins.
// In production set ALLOWED_ORIGINS=https://yourdomain.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

function originAllowed(origin) {
  // Same-origin requests (e.g. game fetch calls) have no Origin header — always allow.
  return !origin || ALLOWED_ORIGINS.includes(origin);
}

// ── App setup ───────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ── Socket.io ───────────────────────────────────────────────────────────────
// Security-critical: credentials:true is required for the browser to send
// the session cookie with the WebSocket upgrade request.
const io = new Server(server, {
  cors: {
    origin:      (origin, cb) => originAllowed(origin) ? cb(null, true) : cb(new Error('CORS denied')),
    credentials: true,
  },
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // trust the first proxy so req.ip is the real client IP

app.use((req, res, next) => {
  // Security-critical: restrict CORS to known origins; allow credentials.
  const origin = req.headers.origin;
  if (originAllowed(origin)) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Security-critical: cookie-parser must be added so req.cookies is populated
// before any route or middleware that reads the session cookie.
app.use(cookieParser());
app.use(express.json({ limit: '512kb' })); // cap body size to prevent memory abuse

// Serve game files statically
app.use(express.static(path.join(__dirname, '.')));

// ── Auth routes ─────────────────────────────────────────────────────────────
app.use('/auth', authRouter);

// ── Save routes (session-protected) ─────────────────────────────────────────
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
    console.error('[Save] write failed for', req.username, ':', e);
    res.status(500).json({ error: 'Save failed.' });
  }
});

// ── Real-time multiplayer ────────────────────────────────────────────────────
attachRooms(io);

// ── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`RuneWorld server running at http://localhost:${PORT}`);
});
