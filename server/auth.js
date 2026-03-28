'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('./db');

const router = express.Router();
const SALT_ROUNDS = 10;

function makeToken(username) {
  return jwt.sign({ sub: username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });
  if (username.length < 2 || username.length > 24)
    return res.status(400).json({ error: 'Username must be 2–24 characters.' });
  if (password.length < 4)
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  try {
    if (db.findPlayer(username))
      return res.status(409).json({ error: 'Username already taken.' });
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.createPlayer(username, hash);
    const token = makeToken(username.toLowerCase());
    res.json({ token, username: username.toLowerCase() });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const record = db.findPlayer(username);
    if (!record)
      return res.status(401).json({ error: 'Invalid username or password.' });
    const match = await bcrypt.compare(password, record.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid username or password.' });
    const token = makeToken(record.username);
    res.json({ token, username: record.username });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
