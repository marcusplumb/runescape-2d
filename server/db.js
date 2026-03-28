'use strict';
/**
 * Flat-file JSON database.
 * Each player is stored as data/players/<username>.json
 * Format: { password_hash: string, save: object|null }
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'players')
  : path.join(__dirname, '..', 'data', 'players');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
console.log('[DB] player data directory:', DATA_DIR);

function _file(username) {
  // Sanitise to prevent path traversal
  const safe = username.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

function findPlayer(username) {
  const file = _file(username);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function createPlayer(username, passwordHash) {
  const file = _file(username);
  // Preserve any existing save data when overwriting a corrupted record
  const existing = findPlayer(username);
  if (existing && existing.password_hash) throw new Error('Username already taken.');
  const record = {
    username:      username.toLowerCase(),
    password_hash: passwordHash,
    save:          existing ? existing.save : null,
  };
  fs.writeFileSync(file, JSON.stringify(record), 'utf8');
  return record;
}

function loadSave(username) {
  const record = findPlayer(username);
  return record ? record.save : null;
}

function writeSave(username, saveData) {
  const record = findPlayer(username);
  if (!record) {
    console.warn('[DB] writeSave: no player file found for', username);
    return;
  }
  record.save = saveData;
  fs.writeFileSync(_file(username), JSON.stringify(record), 'utf8');
  console.log('[DB] saved:', username);
}

module.exports = { findPlayer, createPlayer, loadSave, writeSave };
