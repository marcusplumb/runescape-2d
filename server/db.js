'use strict';
/**
 * Flat-file player database.
 *
 * Each player lives in data/players/<safe_username>.json with this shape:
 *
 *   {
 *     username:      string    — canonical lowercase username
 *     password_hash: string    — bcrypt hash (never log or expose)
 *     email:         string|null — optional, stored lowercase
 *     created_at:    number    — unix ms timestamp
 *     last_login:    number|null
 *     failed_logins: number    — consecutive failures since last success
 *     locked_until:  number|null — ms timestamp; null = not locked
 *     reset_token:   string|null — one-time password-reset token
 *     reset_expires: number|null — expiry of reset_token (ms timestamp)
 *     save:          object|null — game save data blob
 *   }
 *
 * Security notes:
 *   - Path traversal is prevented by stripping everything except [a-z0-9_-].
 *   - password_hash is never returned from public-facing helpers.
 *   - File writes are synchronous to avoid partial-write corruption.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'players')
  : path.join(__dirname, '..', 'data', 'players');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
console.log('[DB] player data directory:', DATA_DIR);

// Account-level lockout: after this many consecutive failures, lock the account
const ACCOUNT_LOCKOUT_FAILURES = 10;
const ACCOUNT_LOCKOUT_MS       = 30 * 60 * 1000; // 30 minutes

// In-memory index of active reset tokens → username (cleared on server restart, 1-hour TTL)
// This avoids scanning every player file to validate a reset token.
const _resetIndex = new Map(); // token (hex) → username

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Build a safe file path for a username. Prevents path traversal. */
function _file(username) {
  const safe = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

/** Read and parse a player record, or return null on any error. */
function _read(username) {
  const file = _file(username);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

/** Write a player record atomically (write to temp then rename). */
function _write(record) {
  const file = _file(record.username);
  const tmp  = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(record), 'utf8');
  fs.renameSync(tmp, file); // atomic on same filesystem
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Find a player record by username. Returns null if not found. */
function findPlayer(username) {
  return _read(username);
}

/** Find a player by reset token. Returns null if not found or token expired. */
function findByResetToken(token) {
  const username = _resetIndex.get(token);
  if (!username) return null;
  const record = _read(username);
  if (!record || record.reset_token !== token) return null;
  return record;
}

/**
 * Create a new player account.
 * Throws if the username is already taken (with a valid hash).
 */
function createPlayer(username, passwordHash, email = null) {
  const existing = _read(username);
  if (existing && existing.password_hash) throw new Error('Username already taken.');

  const record = {
    username:      username.toLowerCase(),
    password_hash: passwordHash,
    email:         email ? email.toLowerCase() : null,
    created_at:    Date.now(),
    last_login:    null,
    failed_logins: 0,
    locked_until:  null,
    reset_token:   null,
    reset_expires: null,
    // Preserve any save data from a corrupted record being re-registered
    save:          existing?.save ?? null,
  };

  _write(record);
  return record;
}

/** Record a failed login attempt; apply account-level lockout if threshold reached. */
function recordFailedLogin(username) {
  const record = _read(username);
  if (!record) return;
  record.failed_logins = (record.failed_logins || 0) + 1;
  if (record.failed_logins >= ACCOUNT_LOCKOUT_FAILURES) {
    record.locked_until = Date.now() + ACCOUNT_LOCKOUT_MS;
    console.warn(`[DB] account locked: ${username} (${record.failed_logins} failures)`);
  }
  _write(record);
}

/** Reset the failure counter and lockout on a successful login. */
function recordSuccessfulLogin(username) {
  const record = _read(username);
  if (!record) return;
  record.failed_logins = 0;
  record.locked_until  = null;
  record.last_login    = Date.now();
  _write(record);
}

/** Replace the password hash (called after change-password and reset-password). */
function updatePassword(username, newHash) {
  const record = _read(username);
  if (!record) throw new Error('Player not found.');
  record.password_hash = newHash;
  record.failed_logins = 0;
  record.locked_until  = null;
  _write(record);
}

/** Update the email address on an account. */
function updateEmail(username, email) {
  const record = _read(username);
  if (!record) throw new Error('Player not found.');
  record.email = email ? email.toLowerCase() : null;
  _write(record);
}

/** Store a password-reset token and its expiry. */
function setResetToken(username, token, expires) {
  const record = _read(username);
  if (!record) return;
  // Remove old token from index if present
  if (record.reset_token) _resetIndex.delete(record.reset_token);
  record.reset_token   = token;
  record.reset_expires = expires;
  _write(record);
  _resetIndex.set(token, username);
}

/** Clear the reset token after it has been consumed. */
function clearResetToken(username) {
  const record = _read(username);
  if (!record) return;
  if (record.reset_token) _resetIndex.delete(record.reset_token);
  record.reset_token   = null;
  record.reset_expires = null;
  _write(record);
}

/** Return the game save data for a player, or null if none. */
function loadSave(username) {
  const record = _read(username);
  return record ? (record.save ?? null) : null;
}

/** Persist the game save data for a player. */
function writeSave(username, saveData) {
  const record = _read(username);
  if (!record) {
    console.warn('[DB] writeSave: no player file for', username);
    return;
  }
  record.save = saveData;
  _write(record);
  console.log('[DB] saved:', username);
}

module.exports = {
  findPlayer,
  findByResetToken,
  createPlayer,
  recordFailedLogin,
  recordSuccessfulLogin,
  updatePassword,
  updateEmail,
  setResetToken,
  clearResetToken,
  loadSave,
  writeSave,
};
