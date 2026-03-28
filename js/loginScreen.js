/**
 * Login / Register screen rendered as an HTML overlay on top of the canvas.
 * Returns a Promise that resolves to { token, username } on success.
 */
export function showLoginScreen(canvas) {
  return new Promise((resolve) => {
    // ── Build overlay ───────────────────────────────────
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position:       'absolute',
      top:            '0', left: '0',
      width:          '100%', height: '100%',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'rgba(0,0,0,0.82)',
      zIndex:         '100',
      fontFamily:     'monospace',
    });
    document.body.style.position = 'relative';
    document.body.appendChild(overlay);

    // ── Panel ───────────────────────────────────────────
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background:   '#1c1208',
      border:       '2px solid #5a3c1c',
      outline:      '2px solid #080503',
      padding:      '28px 32px',
      width:        '320px',
      color:        '#c0a860',
      boxShadow:    '0 0 40px rgba(0,0,0,0.9)',
    });
    overlay.appendChild(panel);

    // ── Title ───────────────────────────────────────────
    const title = document.createElement('div');
    Object.assign(title.style, {
      textAlign:    'center',
      fontSize:     '20px',
      fontWeight:   'bold',
      color:        '#f0d060',
      marginBottom: '6px',
      letterSpacing:'2px',
    });
    title.textContent = 'RuneWorld 2D';
    panel.appendChild(title);

    const subtitle = document.createElement('div');
    Object.assign(subtitle.style, {
      textAlign:    'center',
      fontSize:     '11px',
      color:        '#6a5030',
      marginBottom: '20px',
    });
    subtitle.textContent = 'A multiplayer adventure';
    panel.appendChild(subtitle);

    // ── Tab bar ─────────────────────────────────────────
    let mode = 'login'; // 'login' | 'register'
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
      display:       'flex',
      marginBottom:  '16px',
      borderBottom:  '2px solid #c89030',
    });
    panel.appendChild(tabBar);

    function makeTab(label, key) {
      const tab = document.createElement('div');
      Object.assign(tab.style, {
        flex:        '1',
        textAlign:   'center',
        padding:     '7px 0',
        cursor:      'pointer',
        fontSize:    '12px',
        fontWeight:  'bold',
        background:  key === mode ? '#2c1c0a' : '#100b05',
        color:       key === mode ? '#f0d060' : '#6a5030',
        borderTop:   key === mode ? '2px solid #c89030' : '2px solid transparent',
        userSelect:  'none',
      });
      tab.textContent = label;
      tab.addEventListener('click', () => { mode = key; refresh(); });
      return tab;
    }

    // ── Form fields ─────────────────────────────────────
    function input(placeholder, type = 'text') {
      const el = document.createElement('input');
      el.type        = type;
      el.placeholder = placeholder;
      Object.assign(el.style, {
        display:      'block',
        width:        '100%',
        boxSizing:    'border-box',
        background:   '#0d0804',
        border:       '1px solid #2a1a08',
        borderBottom: '1px solid #1a1006',
        color:        '#f0d060',
        fontFamily:   'monospace',
        fontSize:     '13px',
        padding:      '8px 10px',
        marginBottom: '10px',
        outline:      'none',
      });
      el.addEventListener('focus', () => { el.style.borderColor = '#c89030'; });
      el.addEventListener('blur',  () => { el.style.border = '1px solid #2a1a08'; el.style.borderBottom = '1px solid #1a1006'; });
      return el;
    }

    // ── Submit button ────────────────────────────────────
    function makeButton(label) {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        display:     'block',
        width:       '100%',
        marginTop:   '6px',
        padding:     '10px',
        background:  '#2c1c0a',
        border:      '1px solid #c89030',
        color:       '#f0d060',
        fontFamily:  'monospace',
        fontSize:    '13px',
        fontWeight:  'bold',
        cursor:      'pointer',
        letterSpacing:'1px',
      });
      btn.addEventListener('mouseover', () => { btn.style.background = '#3e2810'; });
      btn.addEventListener('mouseout',  () => { btn.style.background = '#2c1c0a'; });
      return btn;
    }

    // ── Error message ────────────────────────────────────
    const errorEl = document.createElement('div');
    Object.assign(errorEl.style, {
      color:       '#c0392b',
      fontSize:    '11px',
      marginTop:   '8px',
      minHeight:   '16px',
      textAlign:   'center',
    });
    errorEl.textContent = '';

    // ── Render / re-render panel content ─────────────────
    let usernameInput, passwordInput, confirmInput, submitBtn;

    function refresh() {
      // Clear and rebuild dynamic section
      while (tabBar.firstChild) tabBar.removeChild(tabBar.firstChild);
      tabBar.appendChild(makeTab('Login',    'login'));
      tabBar.appendChild(makeTab('Register', 'register'));

      // Remove old inputs/button if present
      [usernameInput, passwordInput, confirmInput, submitBtn].forEach(el => {
        if (el && el.parentNode === panel) panel.removeChild(el);
      });
      if (errorEl.parentNode === panel) panel.removeChild(errorEl);

      usernameInput = input('Username');
      passwordInput = input('Password', 'password');
      confirmInput  = mode === 'register' ? input('Confirm password', 'password') : null;
      submitBtn     = makeButton(mode === 'login' ? 'Login' : 'Create account');

      panel.appendChild(usernameInput);
      panel.appendChild(passwordInput);
      if (confirmInput) panel.appendChild(confirmInput);
      panel.appendChild(submitBtn);
      panel.appendChild(errorEl);
      errorEl.textContent = '';

      usernameInput.focus();

      // Enter key submits
      [usernameInput, passwordInput, confirmInput].forEach(el => {
        if (!el) return;
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });
      });

      submitBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirm  = confirmInput?.value;
        errorEl.textContent = '';

        if (!username || !password) {
          errorEl.textContent = 'Please fill in all fields.';
          return;
        }
        if (mode === 'register' && password !== confirm) {
          errorEl.textContent = 'Passwords do not match.';
          return;
        }

        submitBtn.disabled     = true;
        submitBtn.textContent  = mode === 'login' ? 'Logging in…' : 'Creating account…';

        try {
          const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
          const resp = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username, password }),
          });
          const data = await resp.json();
          if (!resp.ok) {
            errorEl.textContent = data.error || 'Something went wrong.';
            submitBtn.disabled  = false;
            submitBtn.textContent = mode === 'login' ? 'Login' : 'Create account';
            return;
          }
          // Success — store token and resolve
          localStorage.setItem('rw_token',    data.token);
          localStorage.setItem('rw_username', data.username);
          overlay.remove();
          resolve({ token: data.token, username: data.username });
        } catch (err) {
          errorEl.textContent = 'Could not reach server.';
          submitBtn.disabled  = false;
          submitBtn.textContent = mode === 'login' ? 'Login' : 'Create account';
        }
      });
    }

    refresh();
  });
}

/**
 * Check for a stored token, verify it is still valid by hitting /save,
 * and return { token, username } if valid, or null if expired/missing.
 */
export async function tryAutoLogin() {
  const token    = localStorage.getItem('rw_token');
  const username = localStorage.getItem('rw_username');
  if (!token || !username) return null;
  try {
    const resp = await fetch('/save', {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 401 = token expired; 404 = valid token but no save yet (new player)
    if (resp.status === 401) {
      localStorage.removeItem('rw_token');
      localStorage.removeItem('rw_username');
      return null;
    }
    return { token, username };
  } catch {
    return null; // server unreachable — fall through to login screen
  }
}
