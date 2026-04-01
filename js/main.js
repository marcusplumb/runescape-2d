import { Game } from './game.js';
import { showLoginScreen, tryAutoLogin } from './loginScreen.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game');

  // ── 1. Auth: check for an active session, otherwise show login screen ──
  // tryAutoLogin() hits GET /auth/me — the browser automatically sends the
  // HttpOnly session cookie; no token in localStorage needed.
  let session = await tryAutoLogin();
  if (!session) {
    session = await showLoginScreen();
  }
  const { username } = session;

  // ── 2. Load saved game state from server ──────────────────────────────
  let savedState = null;
  try {
    // credentials: 'include' sends the session cookie automatically
    const resp = await fetch('/save', { credentials: 'include' });
    if (resp.ok) savedState = await resp.json();
  } catch {
    // No save yet or server unreachable — start fresh
  }

  // ── 3. Start game ──────────────────────────────────────────────────────
  // Token is no longer passed — auth is handled by the session cookie.
  const game = new Game(canvas, savedState, username);
  game.run();
});
