import { Game } from './game.js';
import { showLoginScreen, tryAutoLogin } from './loginScreen.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game');

  // ── 1. Auth: try stored token first, otherwise show login screen ──
  let session = await tryAutoLogin();
  if (!session) {
    session = await showLoginScreen(canvas);
  }
  const { token, username } = session;

  // ── 2. Load saved state from server ──────────────────────────────
  let savedState = null;
  try {
    const resp = await fetch('/save', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) savedState = await resp.json();
  } catch {
    // No save yet or server unreachable — start fresh
  }

  // ── 3. Start game ─────────────────────────────────────────────────
  const game = new Game(canvas, savedState, token, username);
  game.run();
});
