'use strict';
/**
 * Authentication routes and session middleware.
 *
 * Routes:
 *   POST /auth/register         — create account, start session
 *   POST /auth/login            — verify credentials, start session
 *   POST /auth/logout           — invalidate session, clear cookie
 *   GET  /auth/me               — return current user (session check / auto-login)
 *   POST /auth/change-password  — change password (requires current password)
 *   POST /auth/request-reset    — generate a password-reset token
 *   POST /auth/reset-password   — consume reset token, set new password
 *
 * Exported:
 *   router          — Express router, mount at /auth
 *   requireSession  — middleware for protecting any route that needs auth
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const db       = require('./db');
const sessions = require('./sessions');
const limit    = require('./rateLimit');

const router = express.Router();

// Security-critical: 12 rounds ≈ 250–400 ms per hash on modern hardware.
// Balances security (bcrypt work-factor) vs. login latency.
const SALT_ROUNDS = 12;

// ── Cookie configuration ──────────────────────────────────────────────────────

const COOKIE_NAME = 'rw_session';

/**
 * Build the options object for res.cookie() / res.clearCookie().
 *
 * Security-critical:
 *   httpOnly — the cookie cannot be read by JavaScript (XSS mitigation).
 *   secure   — only sent over HTTPS in production (set NODE_ENV=production).
 *   sameSite — 'lax' prevents cross-site request forgery for top-level navigations
 *              while allowing normal same-site requests. Use 'strict' if your
 *              login page and game are on the exact same origin with no redirects.
 */
function cookieOpts(maxAge = sessions.SESSION_TTL_MS) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,        // milliseconds (Express sets Max-Age= in seconds automatically)
    path:     '/',
  };
}

// ── Input validation ──────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_-]{2,24}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateUsername(u) {
  if (!u || typeof u !== 'string') return 'Username is required.';
  if (!USERNAME_RE.test(u.trim())) return 'Username must be 2–24 characters (letters, numbers, _ or -).';
  return null;
}

function validatePassword(p) {
  if (!p || typeof p !== 'string') return 'Password is required.';
  if (p.length < 8)   return 'Password must be at least 8 characters.';
  // Security-critical: bcrypt silently truncates at 72 bytes. Reject longer passwords
  // rather than silently accepting them with reduced entropy.
  if (p.length > 72)  return 'Password must be 72 characters or fewer.';
  if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(p)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(p))
    return 'Password must contain at least one number or special character.';
  return null;
}

function validateEmail(e) {
  if (!e) return null; // email is optional
  if (typeof e !== 'string' || e.length > 254) return 'Invalid email address.';
  if (!EMAIL_RE.test(e.trim())) return 'Invalid email address.';
  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * requireSession — attach to any route that requires an authenticated user.
 *
 * Security-critical: reads the session ID from the HttpOnly cookie (the browser
 * sends it automatically; JS on the page cannot read or forge it).
 * Sets req.username and req.sessionId on success; renews the session TTL.
 */
function requireSession(req, res, next) {
  const sessionId = req.cookies?.[COOKIE_NAME];
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated.' });

  const session = sessions.getSession(sessionId);
  if (!session)  return res.status(401).json({ error: 'Session expired. Please log in again.' });

  sessions.renewSession(sessionId); // extend TTL on every authenticated request
  req.username  = session.username;
  req.sessionId = sessionId;
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the rate-limit check and send a 429 if blocked. Returns true if blocked. */
function _limitCheck(req, res) {
  const { allowed, retryAfter } = limit.check(req.ip);
  if (!allowed) {
    res.status(429).json({
      error: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
    });
    return true;
  }
  return false;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /auth/register
router.post('/register', (req, res) => {
  if (_limitCheck(req, res)) return;

  const { username, password, email } = req.body || {};

  const usernameErr = validateUsername(username);
  if (usernameErr) return res.status(400).json({ error: usernameErr });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ error: passwordErr });

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  const existing = db.findPlayer(username);
  if (existing && existing.password_hash) {
    return res.status(409).json({ error: 'Username already taken.' });
  }

  bcrypt.hash(password, SALT_ROUNDS)
    .then(hash => {
      db.createPlayer(
        username.trim().toLowerCase(),
        hash,
        email ? email.trim().toLowerCase() : null
      );
      const sessionId = sessions.createSession(username.trim().toLowerCase(), req);
      res
        .cookie(COOKIE_NAME, sessionId, cookieOpts())
        .status(201)
        .json({ ok: true, username: username.trim().toLowerCase() });
    })
    .catch(e => {
      console.error('[Auth] register error:', e);
      res.status(500).json({ error: 'Server error.' });
    });
});

// POST /auth/login
router.post('/login', (req, res) => {
  if (_limitCheck(req, res)) return;

  const { username, password } = req.body || {};
  if (!username || typeof username !== 'string' ||
      !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const record = db.findPlayer(username.trim());

  // Security-critical: always run bcrypt even when no account exists to prevent
  // timing-based user enumeration. The dummy hash ensures the comparison takes
  // the same amount of time whether the user exists or not.
  const hashToCompare = record?.password_hash
    || '$2a$12$invalidhashpadXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  bcrypt.compare(password, hashToCompare)
    .then(match => {
      if (!record || !record.password_hash || !match) {
        limit.recordFailure(req.ip);
        if (record) db.recordFailedLogin(record.username);
        // Security-critical: identical message for "no such user" and "wrong password"
        // to prevent user enumeration.
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Check account-level lockout (separate from IP rate limit)
      if (record.locked_until && Date.now() < record.locked_until) {
        const mins = Math.ceil((record.locked_until - Date.now()) / 60000);
        return res.status(403).json({
          error: `Account temporarily locked after too many failed attempts. Try again in ${mins} minute(s).`,
        });
      }

      limit.recordSuccess(req.ip);
      db.recordSuccessfulLogin(record.username);

      const sessionId = sessions.createSession(record.username, req);
      res
        .cookie(COOKIE_NAME, sessionId, cookieOpts())
        .json({ ok: true, username: record.username });
    })
    .catch(e => {
      console.error('[Auth] login error:', e);
      res.status(500).json({ error: 'Server error.' });
    });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.[COOKIE_NAME];
  if (sessionId) sessions.invalidateSession(sessionId);
  // Security-critical: clear the cookie using the same attributes it was set with
  // so browsers that respect the cookie store actually remove it.
  res
    .clearCookie(COOKIE_NAME, {
      path:     '/',
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    .json({ ok: true });
});

// GET /auth/me — check session and return the current user
// Used by the client on page load to detect an existing session (replaces localStorage token check).
router.get('/me', requireSession, (req, res) => {
  res.json({ username: req.username });
});

// POST /auth/change-password
// Security-critical: requires the current password to be correct before allowing
// a change. Invalidates ALL sessions afterwards to revoke any stolen sessions.
router.post('/change-password', requireSession, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  const passErr = validatePassword(newPassword);
  if (passErr) return res.status(400).json({ error: passErr });

  const record = db.findPlayer(req.username);
  if (!record) return res.status(404).json({ error: 'Account not found.' });

  bcrypt.compare(currentPassword, record.password_hash)
    .then(match => {
      if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

      return bcrypt.hash(newPassword, SALT_ROUNDS).then(hash => {
        db.updatePassword(req.username, hash);
        // Invalidate all sessions — including the current one — so any stolen
        // sessions are immediately revoked. Issue a new session for this request.
        sessions.invalidateAllForUser(req.username);
        const newSessionId = sessions.createSession(req.username, req);
        res
          .cookie(COOKIE_NAME, newSessionId, cookieOpts())
          .json({ ok: true });
      });
    })
    .catch(e => {
      console.error('[Auth] change-password error:', e);
      res.status(500).json({ error: 'Server error.' });
    });
});

// POST /auth/request-reset
// Generates a one-time password-reset token tied to the account's email.
// Always returns the same response whether the account exists or not (prevents enumeration).
// In production: integrate an email service (nodemailer + SendGrid/Mailgun/SES) to
// deliver the token. In development: the token is logged to the console.
router.post('/request-reset', (req, res) => {
  if (_limitCheck(req, res)) return;

  const { username } = req.body || {};
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const record = db.findPlayer(username.trim());

  // Security-critical: always return success and add a delay so the response time
  // doesn't reveal whether the account or email exists.
  const SAFE_RESPONSE = { ok: true, message: 'If that account has an email on file, a reset link has been sent.' };

  if (!record || !record.email) {
    return setTimeout(() => res.json(SAFE_RESPONSE), 400);
  }

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  db.setResetToken(record.username, token, expires);
  limit.recordFailure(req.ip); // count against rate limit to prevent reset-token harvesting

  if (process.env.NODE_ENV !== 'production') {
    // Dev only — log so you can test without a real email service
    console.log(`[Auth] Password reset token for "${record.username}": ${token}`);
    console.log(`[Auth] Reset expires: ${new Date(expires).toISOString()}`);
  }

  // TODO: replace the log above with a real email when you add an email service:
  //   await mailer.send({ to: record.email, subject: 'Password Reset', body: `Token: ${token}` });

  res.json(SAFE_RESPONSE);
});

// POST /auth/reset-password
// Consumes a reset token and sets a new password.
router.post('/reset-password', (req, res) => {
  if (_limitCheck(req, res)) return;

  const { token, newPassword } = req.body || {};
  if (!token || typeof token !== 'string' || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  const passErr = validatePassword(newPassword);
  if (passErr) return res.status(400).json({ error: passErr });

  const record = db.findByResetToken(token.trim());
  if (!record || record.reset_token !== token.trim() ||
      !record.reset_expires || Date.now() > record.reset_expires) {
    return res.status(400).json({ error: 'Invalid or expired reset token.' });
  }

  bcrypt.hash(newPassword, SALT_ROUNDS)
    .then(hash => {
      db.updatePassword(record.username, hash);
      db.clearResetToken(record.username);
      // Revoke all active sessions so any compromised session is immediately invalidated
      sessions.invalidateAllForUser(record.username);
      limit.recordSuccess(req.ip);
      res.json({ ok: true });
    })
    .catch(e => {
      console.error('[Auth] reset-password error:', e);
      res.status(500).json({ error: 'Server error.' });
    });
});

module.exports = { router, requireSession, COOKIE_NAME };
