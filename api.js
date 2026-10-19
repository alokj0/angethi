// After deploying the backend on Render, paste its URL below (no trailing slash).
const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:8080/api'
  : 'https://YOUR-APP-NAME.onrender.com/api';

const TOK = 'angeethi_token', USR = 'angeethi_user', ATOK = 'angeethi_admin_token';
const Store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

async function api(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = Store.get(admin ? ATOK : TOK);
  if (t) headers.Authorization = 'Bearer ' + t;
  let r;
  try {
    r = await fetch(API_BASE + '/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Cannot reach the server. If it was idle, wait a minute for it to wake up and try again.');
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const err = new Error(d.error || 'Something went wrong.'); err.status = r.status; throw err; }
  return d;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function todayLocal() { return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

// Shared header and footer (replaces includes/header.php and footer.php)
async function loadInclude(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.innerHTML = await (await fetch(url)).text(); } catch (e) {}
}
const includesReady = new Promise(res => document.addEventListener('DOMContentLoaded', () =>
  Promise.all([loadInclude('site-header', '/includes/header.html'), loadInclude('site-footer', '/includes/footer.html')]).then(res, res)));
