// Bootstrap — login → realtime → Surface A (Operations)

import { tryLogin, getSession, clearSession, startIdleTimer } from './core/auth.js';
import { createSB } from './core/supabase.js';
import { subscribeRealtime, unsubscribeRealtime } from './core/realtime.js';
import { toast, toastError } from './core/toast.js';

const overlay = document.getElementById('login-overlay');
const pinInput = document.getElementById('pin-input');
const adminInput = document.getElementById('admin-secret-input');
const pinSubmit = document.getElementById('pin-submit');
const pinErr = document.getElementById('pin-error');
const lockBtn = document.getElementById('lock-btn');
const rolePill = document.getElementById('role-pill');

function showLogin(message) {
  overlay.classList.remove('hidden');
  pinInput.value = '';
  if (message) pinErr.textContent = message;
  setTimeout(() => pinInput.focus(), 50);
}

function hideLogin() {
  overlay.classList.add('hidden');
  pinErr.textContent = '';
}

async function handleLogin(role, session) {
  rolePill.textContent = role;
  rolePill.style.color = role === 'owner' ? 'var(--green)' : 'var(--orange)';

  // Subscribe to realtime — sales gets limited subscription
  subscribeRealtime(role);

  // Start idle timer (30 min)
  startIdleTimer((reason) => {
    unsubscribeRealtime();
    showLogin(reason === 'idle' ? 'Locked due to inactivity.' : '');
  });

  // Lazy import Surface A
  const surface = await import('./surfaces/operations.js');
  await surface.init({ role });
}

async function attemptLogin() {
  pinErr.textContent = '';
  const pin = pinInput.value.trim();
  const adminSecret = adminInput.value.trim();
  pinSubmit.disabled = true;

  try {
    const result = await tryLogin(pin, adminSecret);
    if (!result.ok) {
      pinErr.textContent = result.reason;
      return;
    }
    hideLogin();
    toast(`Welcome — signed in as ${result.role}.`);
    await handleLogin(result.role, result.session);
  } catch (e) {
    toastError('Login failed: ' + (e?.message || e));
    pinErr.textContent = 'Login error. Check connection.';
  } finally {
    pinSubmit.disabled = false;
  }
}

pinSubmit.addEventListener('click', attemptLogin);
pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
adminInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });

lockBtn.addEventListener('click', () => {
  clearSession();
  unsubscribeRealtime();
  showLogin('Locked.');
});

// Resume session if still valid
(async function boot() {
  const sess = getSession();
  if (sess) {
    try {
      createSB(sess.adminSecret || '');
      hideLogin();
      await handleLogin(sess.role, sess);
      return;
    } catch (e) {
      console.warn('Session resume failed:', e);
      clearSession();
    }
  }
  showLogin();
})();
