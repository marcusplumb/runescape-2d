'use strict';
/**
 * Server-managed session store.
 *
 * Security-critical design notes:
 *   - Session IDs are 32 cryptographically random bytes (64-char hex) — unpredictable.
 *   - Sessions are stored server-side only; the client only holds an opaque ID in an
 *     HttpOnly cookie that JS cannot read or steal via XSS.
 *   - By default only one active session per account (ALLOW_MULTI_SESSION env opt-out).
 *   - Expired sessions are rejected before any data is returned.
 *   - Sessions are persisted to disk so they survive server restarts.
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Allow multiple simultaneous sessions per account by setting this env var.
// Default: false — logging in from a new device invalidates the previous session.
const ALLOW_MULTI = process.env.ALLOW_MULTI_SESSION === 'true';

const SESSION_FILE = path.join(
  process.env.DATA_DIR ?? path.join(__dirname, '..', 'data'),
  'sessions.json'
);

// In-memory store: sessionId (hex string) → session object
const store = new Map();

// ── Persistence ───────────────────────────────────────────────────────────────

function _load() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    const now = Date.now();
    let loaded = 0;
    for (const [id, s] of Object.entries(raw)) {
      if (s.expiresAt > now) { store.set(id, s); loaded++; }
    }
    if (loaded > 0) console.log(`[Sessions] restored ${loaded} active session(s)`);
  } catch (e) {
    console.warn('[Sessions] could not load sessions.json:', e.message);
  }
}

let _saveTimer = null;
function _scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_persist, 2000); // debounce — avoid thrashing disk on rapid logins
}

function _persist() {
  try {
    const dir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = {};
    for (const [id, s] of store) obj[id] = s;
    fs.writeFileSync(SESSION_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {
    console.warn('[Sessions] persist failed:', e.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new session for the given username.
 * If ALLOW_MULTI is false (default), any existing session for this user is
 * invalidated first — enforces single-session-per-account.
 * Returns the new session ID (stored in the cookie).
 */
function createSession(username, req) {
  if (!ALLOW_MULTI) {
    // Invalidate all existing sessions for this user before creating a new one
    for (const [id, s] of store) {
      if (s.username === username) store.delete(id);
    }
  }

  // Security-critical: 32 random bytes = 256 bits of entropy. Unguessable.
  const id  = crypto.randomBytes(32).toString('hex');
  const now = Date.now();

  store.set(id, {
    username,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip:        req.ip ?? null,
    userAgent: (req.headers?.['user-agent'] ?? '').slice(0, 200),
  });

  _scheduleSave();
  return id;
}

/**
 * Look up and validate a session by ID.
 * Returns the session object if valid, or null if missing/expired.
 */
function getSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const s = store.get(sessionId);
  if (!s) return null;

  if (Date.now() > s.expiresAt) {
    store.delete(sessionId);
    _scheduleSave();
    return null;
  }

  return s;
}

/**
 * Extend a session's TTL (called on each authenticated request).
 * Keeps active players logged in without requiring periodic re-login.
 */
function renewSession(sessionId) {
  const s = store.get(sessionId);
  if (!s) return;
  s.expiresAt = Date.now() + SESSION_TTL_MS;
  _scheduleSave();
}

/** Invalidate one session (logout). */
function invalidateSession(sessionId) {
  if (store.delete(sessionId)) _scheduleSave();
}

/**
 * Invalidate ALL sessions for a user.
 * Called after a password change so any stolen sessions are immediately revoked.
 */
function invalidateAllForUser(username) {
  let changed = false;
  for (const [id, s] of store) {
    if (s.username === username) { store.delete(id); changed = true; }
  }
  if (changed) _scheduleSave();
}

/**
 * Find the active session ID for a given username.
 * Used by rooms.js to check if a user already has an active WebSocket session.
 */
function getSessionIdForUser(username) {
  const now = Date.now();
  for (const [id, s] of store) {
    if (s.username === username && s.expiresAt > now) return id;
  }
  return null;
}

// Purge expired sessions once per hour to keep memory clean
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [id, s] of store) {
    if (s.expiresAt <= now) { store.delete(id); removed++; }
  }
  if (removed > 0) { console.log(`[Sessions] purged ${removed} expired session(s)`); _persist(); }
}, 60 * 60 * 1000).unref(); // .unref() so this timer doesn't keep the process alive

_load(); // restore persisted sessions on startup

module.exports = {
  SESSION_TTL_MS,
  createSession,
  getSession,
  renewSession,
  invalidateSession,
  invalidateAllForUser,
  getSessionIdForUser,
};
