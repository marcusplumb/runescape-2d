'use strict';
/**
 * In-memory rate limiter for authentication endpoints.
 *
 * Security-critical design notes:
 *   - Tracks failed attempts per IP address.
 *   - After MAX_FAILURES attempts within WINDOW_MS, the IP is locked out.
 *   - A production deployment should also use a reverse proxy (nginx / Cloudflare)
 *     rate limiter as a first line of defence — this is the application-layer backstop.
 *   - Records are cleaned up after their window expires to avoid memory leaks.
 */

const MAX_FAILURES = 10;              // attempts before lockout
const WINDOW_MS    = 15 * 60 * 1000; // failure counting window: 15 minutes
const LOCKOUT_MS   = 30 * 60 * 1000; // lockout duration after hitting the limit

// ipKey → { failures, windowStart, lockedUntil }
const records = new Map();

function _get(ip) {
  if (!records.has(ip)) {
    records.set(ip, { failures: 0, windowStart: Date.now(), lockedUntil: 0 });
  }
  return records.get(ip);
}

/**
 * Check whether this IP is currently allowed to attempt a login.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
function check(ip) {
  const r   = _get(ip);
  const now = Date.now();

  // IP is explicitly locked out
  if (r.lockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((r.lockedUntil - now) / 1000) };
  }

  // Slide the window if it has expired — start fresh
  if (now - r.windowStart > WINDOW_MS) {
    r.failures    = 0;
    r.windowStart = now;
  }

  // Hit the limit — apply lockout
  if (r.failures >= MAX_FAILURES) {
    r.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, retryAfter: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { allowed: true };
}

/** Record one failed attempt. Call this after any failed login/register. */
function recordFailure(ip) {
  const r   = _get(ip);
  const now = Date.now();
  if (now - r.windowStart > WINDOW_MS) {
    r.failures    = 0;
    r.windowStart = now;
  }
  r.failures++;
}

/** Clear failure record after a successful login — reset the window for this IP. */
function recordSuccess(ip) {
  records.delete(ip);
}

// Remove stale records every hour so the Map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [ip, r] of records) {
    if (now - r.windowStart > WINDOW_MS && r.lockedUntil < now) records.delete(ip);
  }
}, 60 * 60 * 1000).unref();

module.exports = { check, recordFailure, recordSuccess };
