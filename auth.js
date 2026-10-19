function currentUser() { try { return Store.get(TOK) ? JSON.parse(Store.get(USR)) : null; } catch (e) { return null; } }
function setSession(d) { Store.set(TOK, d.token); Store.set(USR, JSON.stringify(d.user)); }
function clearSession() { Store.del(TOK); Store.del(USR); }
async function logout() {
  try { await api('auth.php?action=logout', { method: 'POST' }); } catch (e) {}
  clearSession(); location.href = '/index.html';
}

includesReady.then(() => {
  const box = document.getElementById('nav-auth');
  if (!box) return;
  const u = currentUser();
  if (u) {
    box.innerHTML = '<a href="/my-bookings.html">My bookings</a><a class="pill" href="#" id="logout-btn">Log out (' + esc(u.name.split(' ')[0]) + ')</a>';
    document.getElementById('logout-btn').onclick = e => { e.preventDefault(); logout(); };
  } else {
    box.innerHTML = '<a href="/login.html">Log in</a><a class="pill" href="/register.html">Sign up</a>';
  }
});

function wireForm(id, endpoint, getBody, check) {
  const f = document.getElementById(id);
  if (!f) return;
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const m = document.getElementById('msg'), btn = f.querySelector('button');
    m.textContent = '';
    const b = getBody(f), problem = check && check(b);
    if (problem) { m.textContent = problem; return; }
    btn.disabled = true;
    try { setSession(await api(endpoint, { method: 'POST', body: b })); location.href = '/index.html#book'; }
    catch (e) { m.textContent = e.message; btn.disabled = false; }
  });
}
wireForm('login-form', 'auth.php?action=login', f => ({ email: f.email.value, password: f.password.value }));
wireForm('register-form', 'auth.php?action=register',
  f => ({ name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value, password2: f.password2.value }),
  b => b.password.length < 6 ? 'Password must be at least 6 characters.' : b.password !== b.password2 ? 'Passwords do not match.' : '');
