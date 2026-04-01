'use strict';
try { require('dotenv').config(); } catch {}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./server/db');
const { router: authRouter, requireSession } = require('./server/auth');
const { attachRooms } = require('./server/rooms');

// ── Secrets ────────────────────────────────────────────────────────────────
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET env var is not set. Set it before deploying.');
    process.exit(1);
  }
  process.env.SESSION_SECRET = 'dev-only-secret-change-in-production';
  console.warn('⚠ SESSION_SECRET not set — using insecure dev default.');
}

// ── CORS origin list ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

function originAllowed(origin) {
  return !origin || ALLOWED_ORIGINS.includes(origin);
}

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 3000;

  const io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (originAllowed(origin)) return cb(null, true);
        return cb(new Error('CORS denied'));
      },
      credentials: true,
    },
  });

  let redis = null;

  // Optional in dev, strongly recommended in production.
  // If REDIS_URL is missing, Socket.IO stays single-process only.
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    redis = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('[Redis pub] error:', err));
    subClient.on('error', (err) => console.error('[Redis sub] error:', err));
    redis.on('error', (err) => console.error('[Redis app] error:', err));

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      redis.connect(),
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter enabled.');
  } else {
    console.warn('[Socket.IO] REDIS_URL not set. Multiplayer is single-instance only.');
  }

  app.set('trust proxy', 1);

  app.use((req, res, next) => {
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

  app.use(cookieParser());
  app.use(express.json({ limit: '512kb' }));

  app.use(express.static(path.join(__dirname, '.')));

  app.use('/auth', authRouter);

  app.get('/save', requireSession, (req, res) => {
    const save = db.loadSave(req.username);
    if (!save) return res.status(404).json({ error: 'No save found.' });
    res.json(save);
  });

  app.post('/save', requireSession, (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid save data.' });
    }
    try {
      db.writeSave(req.username, req.body);
      res.json({ ok: true });
    } catch (e) {
      console.error('[Save] write failed for', req.username, ':', e);
      res.status(500).json({ error: 'Save failed.' });
    }
  });

  attachRooms(io, { redis });

  server.listen(PORT, () => {
    console.log(`RuneWorld server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('FATAL startup error:', err);
  process.exit(1);
});