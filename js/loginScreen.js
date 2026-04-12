/**
 * Login / Register screen and account management dialogs.
 *
 * Exports:
 *   showLoginScreen()         — full-screen overlay; resolves to { username }
 *   tryAutoLogin()            — silently check GET /auth/me for an active session
 *   showChangePasswordDialog() — in-game overlay for changing password
 */

// ── Shared style constants ──────────────────────────────────────────────────
const S = {
  bg:          '#1c1208',
  border:      '#5a3c1c',
  gold:        '#f0d060',
  goldDim:     '#c0a860',
  goldMuted:   '#6a5030',
  inputBg:     '#0d0804',
  inputBorder: '#2a1a08',
  red:         '#c0392b',
  green:       '#27ae60',
};

function _applyBase(el, styles) {
  Object.assign(el.style, styles);
  return el;
}

function _overlay() {
  return _applyBase(document.createElement('div'), {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.85)',
    zIndex: '200',
    fontFamily: 'monospace',
  });
}

function _panel(width = '340px') {
  return _applyBase(document.createElement('div'), {
    background: S.bg,
    border: `2px solid ${S.border}`,
    outline: '2px solid #080503',
    padding: '28px 32px',
    width,
    maxWidth: '95vw',
    color: S.goldDim,
    boxShadow: '0 0 40px rgba(0,0,0,0.9)',
    boxSizing: 'border-box',
  });
}

function _input(placeholder, type = 'text') {
  const el = _applyBase(document.createElement('input'), {
    display: 'block', width: '100%', boxSizing: 'border-box',
    background: S.inputBg,
    border: `1px solid ${S.inputBorder}`,
    color: S.gold,
    fontFamily: 'monospace', fontSize: '13px',
    padding: '8px 10px', marginBottom: '10px',
    outline: 'none',
  });
  el.type        = type;
  el.placeholder = placeholder;
  el.autocomplete = type === 'password' ? 'current-password' : 'username';
  el.addEventListener('focus', () => { el.style.borderColor = '#c89030'; });
  el.addEventListener('blur',  () => { el.style.borderColor = S.inputBorder; });
  return el;
}

function _button(label, variant = 'primary') {
  const bg     = variant === 'secondary' ? '#120d06' : '#2c1c0a';
  const bgHov  = variant === 'secondary' ? '#1e1509' : '#3e2810';
  const btn = _applyBase(document.createElement('button'), {
    display: 'block', width: '100%',
    marginTop: '6px', padding: '10px',
    background: bg,
    border: `1px solid ${S.border}`,
    color: S.gold,
    fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold',
    cursor: 'pointer', letterSpacing: '1px',
  });
  btn.textContent = label;
  btn.addEventListener('mouseover', () => { btn.style.background = bgHov; });
  btn.addEventListener('mouseout',  () => { btn.style.background = bg; });
  return btn;
}

function _statusMsg() {
  return _applyBase(document.createElement('div'), {
    fontSize: '11px', marginTop: '8px', minHeight: '16px', textAlign: 'center',
  });
}

function _link(label) {
  const a = _applyBase(document.createElement('span'), {
    color: S.goldMuted, fontSize: '11px', cursor: 'pointer',
    textDecoration: 'underline', display: 'block',
    textAlign: 'center', marginTop: '10px',
  });
  a.textContent = label;
  a.addEventListener('mouseover', () => { a.style.color = S.goldDim; });
  a.addEventListener('mouseout',  () => { a.style.color = S.goldMuted; });
  return a;
}

// ── Password strength indicator ─────────────────────────────────────────────
const RULES = [
  { test: p => p.length >= 8,              label: 'At least 8 characters' },
  { test: p => p.length <= 72,             label: 'No more than 72 characters' },
  { test: p => /[A-Z]/.test(p),            label: 'One uppercase letter' },
  { test: p => /[a-z]/.test(p),            label: 'One lowercase letter' },
  { test: p => /[0-9!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(p),
                                            label: 'One number or special character' },
];

function _strengthMeter(passwordInput) {
  const wrap = _applyBase(document.createElement('div'), {
    marginBottom: '10px', fontSize: '10px', lineHeight: '1.6',
  });
  const items = RULES.map(r => {
    const li = _applyBase(document.createElement('div'), { color: S.goldMuted });
    li.textContent = `✗ ${r.label}`;
    wrap.appendChild(li);
    return li;
  });
  passwordInput.addEventListener('input', () => {
    const p = passwordInput.value;
    items.forEach((li, i) => {
      const ok = RULES[i].test(p);
      li.textContent  = `${ok ? '✓' : '✗'} ${RULES[i].label}`;
      li.style.color  = ok ? S.green : S.goldMuted;
    });
  });
  return wrap;
}

// ── Password rules helper (for confirm-password validation) ─────────────────
function _allRulesMet(p) { return RULES.every(r => r.test(p)); }

// ── POST helper ─────────────────────────────────────────────────────────────
async function _post(endpoint, body) {
  // credentials: 'include' ensures the browser sends (and receives) the session cookie
  const resp = await fetch(endpoint, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

// ── Main login/register screen ──────────────────────────────────────────────

/**
 * Show the full-screen login/register overlay.
 * Resolves to { username } on success (no token — auth is cookie-based).
 */
export function showLoginScreen() {
  return new Promise((resolve) => {
    const overlay = _overlay();
    document.body.appendChild(overlay);

    // modes: 'login' | 'register' | 'forgot'
    let mode = 'login';

    // ── Elements ──
    const panel    = _panel();
    const title    = _applyBase(document.createElement('div'), {
      textAlign: 'center', fontSize: '20px', fontWeight: 'bold',
      color: S.gold, marginBottom: '4px', letterSpacing: '2px',
    });
    title.textContent = 'RuneWorld 2D';

    const subtitle = _applyBase(document.createElement('div'), {
      textAlign: 'center', fontSize: '11px', color: S.goldMuted, marginBottom: '18px',
    });
    subtitle.textContent = 'A multiplayer adventure';

    const tabBar = _applyBase(document.createElement('div'), {
      display: 'flex', marginBottom: '16px', borderBottom: `2px solid #c89030`,
    });

    const status = _statusMsg();
    overlay.appendChild(panel);
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(tabBar);

    // ── Tab builder ──
    let tabLogin, tabRegister;
    function _makeTab(label, key) {
      const tab = _applyBase(document.createElement('div'), {
        flex: '1', textAlign: 'center', padding: '7px 0',
        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
        userSelect: 'none',
      });
      tab.textContent = label;
      tab.addEventListener('click', () => { mode = key; render(); });
      return tab;
    }

    function _styleTab(tab, active) {
      tab.style.background   = active ? '#2c1c0a' : '#100b05';
      tab.style.color        = active ? S.gold    : S.goldMuted;
      tab.style.borderTop    = active ? `2px solid #c89030` : '2px solid transparent';
    }

    // ── Dynamic content area ──
    const body = document.createElement('div');
    panel.appendChild(body);
    panel.appendChild(status);

    function render() {
      // Rebuild tabs
      tabBar.innerHTML = '';
      tabLogin    = _makeTab('Login',    'login');
      tabRegister = _makeTab('Register', 'register');
      tabBar.appendChild(tabLogin);
      tabBar.appendChild(tabRegister);
      _styleTab(tabLogin,    mode === 'login');
      _styleTab(tabRegister, mode === 'register');

      body.innerHTML = '';
      status.textContent = '';
      status.style.color = S.red;

      if (mode === 'login') {
        _buildLogin();
      } else if (mode === 'register') {
        _buildRegister();
      } else if (mode === 'forgot') {
        _buildForgot();
      }
    }

    // ── Login form ──
    function _buildLogin() {
      const uInput = _input('Username');
      uInput.autocomplete = 'username';
      const pInput = _input('Password', 'password');
      pInput.autocomplete = 'current-password';
      const btn    = _button('Login');
      const forgot = _link('Forgot password?');

      body.appendChild(uInput);
      body.appendChild(pInput);
      body.appendChild(btn);
      body.appendChild(forgot);

      [uInput, pInput].forEach(el =>
        el.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); })
      );

      forgot.addEventListener('click', () => { mode = 'forgot'; render(); });

      btn.addEventListener('click', async () => {
        const username = uInput.value.trim();
        const password = pInput.value;
        status.textContent = '';

        if (!username || !password) {
          status.textContent = 'Please fill in all fields.';
          return;
        }

        // Offline / dev bypass — skips all server calls
        if (username === 'Admin' && password === '1234') {
          overlay.remove();
          resolve({ username: 'Admin' });
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Logging in…';

        try {
          const { ok, data } = await _post('/auth/login', { username, password });
          if (!ok) {
            status.textContent = data.error || 'Login failed.';
            btn.disabled = false;
            btn.textContent = 'Login';
            return;
          }
          overlay.remove();
          resolve({ username: data.username });
        } catch {
          status.textContent = 'Could not reach server.';
          btn.disabled = false;
          btn.textContent = 'Login';
        }
      });

      uInput.focus();
    }

    // ── Register form ──
    function _buildRegister() {
      const uInput = _input('Username (2–24 characters)');
      uInput.autocomplete = 'username';
      const eInput = _input('Email (optional — for password recovery)', 'email');
      eInput.autocomplete = 'email';
      const pInput = _input('Password', 'password');
      pInput.autocomplete = 'new-password';
      const meter  = _strengthMeter(pInput);
      const cInput = _input('Confirm password', 'password');
      cInput.autocomplete = 'new-password';
      const btn    = _button('Create account');

      body.appendChild(uInput);
      body.appendChild(eInput);
      body.appendChild(pInput);
      body.appendChild(meter);
      body.appendChild(cInput);
      body.appendChild(btn);

      [uInput, eInput, pInput, cInput].forEach(el =>
        el.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); })
      );

      btn.addEventListener('click', async () => {
        const username = uInput.value.trim();
        const email    = eInput.value.trim() || null;
        const password = pInput.value;
        const confirm  = cInput.value;
        status.textContent = '';

        if (!username || !password || !confirm) {
          status.textContent = 'Please fill in the required fields.';
          return;
        }
        if (!_allRulesMet(password)) {
          status.textContent = 'Password does not meet all requirements.';
          return;
        }
        if (password !== confirm) {
          status.textContent = 'Passwords do not match.';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Creating account…';

        try {
          const { ok, data } = await _post('/auth/register', { username, password, email });
          if (!ok) {
            status.textContent = data.error || 'Registration failed.';
            btn.disabled = false;
            btn.textContent = 'Create account';
            return;
          }
          overlay.remove();
          resolve({ username: data.username });
        } catch {
          status.textContent = 'Could not reach server.';
          btn.disabled = false;
          btn.textContent = 'Create account';
        }
      });

      uInput.focus();
    }

    // ── Forgot password form ──
    function _buildForgot() {
      const info = _applyBase(document.createElement('div'), {
        fontSize: '11px', color: S.goldMuted, marginBottom: '12px', lineHeight: '1.6',
      });
      info.textContent = 'Enter your username. If your account has an email address on file, a reset token will be sent. Check the server console in dev mode.';
      const uInput = _input('Username');
      const btn    = _button('Send reset token');
      const back   = _link('← Back to login');

      body.appendChild(info);
      body.appendChild(uInput);
      body.appendChild(btn);
      body.appendChild(back);

      back.addEventListener('click', () => { mode = 'login'; render(); });
      uInput.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

      btn.addEventListener('click', async () => {
        const username = uInput.value.trim();
        if (!username) { status.textContent = 'Please enter your username.'; return; }

        btn.disabled = true;
        btn.textContent = 'Sending…';

        try {
          const { ok, data } = await _post('/auth/request-reset', { username });
          if (ok || data.ok) {
            status.style.color = S.green;
            status.textContent = data.message || 'Check your email (or server console in dev).';
          } else {
            status.textContent = data.error || 'Something went wrong.';
          }
        } catch {
          status.textContent = 'Could not reach server.';
        }
        btn.disabled = false;
        btn.textContent = 'Send reset token';
      });

      uInput.focus();
    }

    render();
  });
}

/**
 * Silently check whether there is already a valid session by calling GET /auth/me.
 * Returns { username } if a session exists, or null if not.
 * Replaces the old localStorage token check.
 */
export async function tryAutoLogin() {
  try {
    const resp = await fetch('/auth/me', { credentials: 'include' });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.username ? { username: data.username } : null;
  } catch {
    return null; // server unreachable
  }
}

/**
 * In-game dialog for changing the password.
 * Call this from a settings/account menu inside the game.
 * Resolves to true on success, false if cancelled.
 */
export function showChangePasswordDialog() {
  return new Promise((resolve) => {
    const overlay = _overlay();
    overlay.style.zIndex = '300';
    document.body.appendChild(overlay);

    const panel  = _panel('320px');
    const heading = _applyBase(document.createElement('div'), {
      fontSize: '14px', fontWeight: 'bold', color: S.gold,
      marginBottom: '16px', textAlign: 'center', letterSpacing: '1px',
    });
    heading.textContent = 'Change Password';

    const curInput = _input('Current password', 'password');
    curInput.autocomplete = 'current-password';
    const newInput = _input('New password', 'password');
    newInput.autocomplete = 'new-password';
    const meter    = _strengthMeter(newInput);
    const cfmInput = _input('Confirm new password', 'password');
    cfmInput.autocomplete = 'new-password';
    const saveBtn  = _button('Change password');
    const cancelBtn = _button('Cancel', 'secondary');
    const status   = _statusMsg();

    panel.appendChild(heading);
    panel.appendChild(curInput);
    panel.appendChild(newInput);
    panel.appendChild(meter);
    panel.appendChild(cfmInput);
    panel.appendChild(saveBtn);
    panel.appendChild(cancelBtn);
    panel.appendChild(status);
    overlay.appendChild(panel);

    cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });

    [curInput, newInput, cfmInput].forEach(el =>
      el.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); })
    );

    saveBtn.addEventListener('click', async () => {
      const currentPassword = curInput.value;
      const newPassword     = newInput.value;
      const confirm         = cfmInput.value;
      status.style.color    = S.red;
      status.textContent    = '';

      if (!currentPassword || !newPassword || !confirm) {
        status.textContent = 'Please fill in all fields.';
        return;
      }
      if (!_allRulesMet(newPassword)) {
        status.textContent = 'New password does not meet all requirements.';
        return;
      }
      if (newPassword !== confirm) {
        status.textContent = 'New passwords do not match.';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        const { ok, data } = await _post('/auth/change-password', { currentPassword, newPassword });
        if (!ok) {
          status.textContent = data.error || 'Password change failed.';
          saveBtn.disabled = false;
          saveBtn.textContent = 'Change password';
          return;
        }
        status.style.color = S.green;
        status.textContent = 'Password changed successfully.';
        setTimeout(() => { overlay.remove(); resolve(true); }, 1200);
      } catch {
        status.textContent = 'Could not reach server.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Change password';
      }
    });

    curInput.focus();
  });
}
