const page = document.body.dataset.page;
const A = (path, opt = {}) => api(path, { ...opt, admin: true });
const app = document.getElementById('app');
function kick() { Store.del(ATOK); location.href = '/admin/login.html'; }
function post(path, body) { return A(path, { method: 'POST', body }); }
async function safe(fn) { try { await fn(); } catch (e) { if (e.status === 401) kick(); else alert(e.message); } }

function adminNav() {
  document.getElementById('admin-nav').innerHTML = `<header class="nav"><div class="navin"><a class="logo" href="/admin/index.html">Angeethi admin</a>
    <nav class="keep"><a href="/admin/index.html">Bookings</a><a href="/admin/menu.html">Menu</a><a href="/index.html">View site</a><a href="#" id="alogout">Log out</a></nav></div></header>`;
  document.getElementById('alogout').onclick = async e => { e.preventDefault(); try { await post('admin.php?action=logout'); } catch (x) {} kick(); };
}

if (page === 'login') {
  const f = document.getElementById('admin-login'), m = document.getElementById('msg');
  f.addEventListener('submit', async ev => {
    ev.preventDefault(); m.textContent = ''; const btn = f.querySelector('button'); btn.disabled = true;
    try { const d = await api('admin.php?action=login', { method: 'POST', body: { username: f.username.value, password: f.password.value } });
      Store.set(ATOK, d.token); location.href = '/admin/index.html'; }
    catch (e) { m.textContent = e.message; btn.disabled = false; }
  });
}

async function dashboard() {
  app.innerHTML = '<p class="loading">Loading…</p>';
  const d = await A('admin.php?action=bookings');
  app.innerHTML = `<h2>Bookings</h2><div class="stats">
    ${Object.entries(d.counts).map(([k, v]) => `<div class="stat"><b>${v}</b>${esc(k[0].toUpperCase() + k.slice(1))}</div>`).join('')}
    <div class="stat"><b>${d.customers}</b>Customers</div></div>
    <table><tr><th>Name</th><th>Phone</th><th>Account</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th><th>Action</th></tr>
    ${d.bookings.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${esc(r.res_date)}</td><td>${esc(r.res_time.slice(0, 5))}</td><td>${+r.guests}</td><td>${esc(r.status)}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-id="${+r.id}" data-act="confirmed">Confirm</button>
      <button class="btn sm" data-id="${+r.id}" data-act="cancelled">Cancel</button>
      <button class="btn sm" data-id="${+r.id}" data-act="delete">Delete</button></td></tr>`).join('') || '<tr><td colspan="8">No bookings yet.</td></tr>'}</table>`;
}
if (page === 'dashboard') {
  if (!Store.get(ATOK)) kick(); else {
    adminNav(); safe(dashboard);
    app.addEventListener('click', ev => {
      const b = ev.target.closest('button[data-act]'); if (!b) return;
      const id = +b.dataset.id, act = b.dataset.act;
      if (act === 'delete' && !confirm('Delete this booking?')) return;
      safe(async () => { await post(act === 'delete' ? 'admin.php?action=booking_delete' : 'admin.php?action=booking_status', act === 'delete' ? { id } : { id, status: act }); await dashboard(); });
    });
  }
}

async function menuPage() {
  app.innerHTML = '<p class="loading">Loading…</p>';
  const d = await A('admin.php?action=menu_list');
  app.innerHTML = `<h2>Menu items</h2>
    <form id="add" class="add"><div><label>Name</label><input name="name" required></div>
    <div><label>Description</label><input name="description"></div>
    <div><label>Price (₹)</label><input name="price" type="number" step="1" min="1" required></div>
    <div><label>Category</label><select name="category_id">${d.categories.map(c => `<option value="${+c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div><label><input type="checkbox" name="is_veg" checked style="width:auto"> Vegetarian</label></div>
    <div><button class="btn sm" type="submit">Add item</button></div></form>
    <table><tr><th>Item</th><th>Category</th><th>Price</th><th>Type</th><th>Shown</th><th>Action</th></tr>
    ${d.items.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.cat)}</td><td>₹${Math.round(r.price)}</td><td>${+r.is_veg ? 'Veg' : 'Non-veg'}</td><td>${+r.available ? 'Yes' : 'Hidden'}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-id="${+r.id}" data-act="toggle">${+r.available ? 'Hide' : 'Show'}</button>
      <button class="btn sm" data-id="${+r.id}" data-act="delete">Delete</button></td></tr>`).join('')}</table>`;
  document.getElementById('add').addEventListener('submit', ev => {
    ev.preventDefault(); const f = ev.target;
    safe(async () => { await post('admin.php?action=menu_add', { name: f.name.value, description: f.description.value, price: +f.price.value, category_id: +f.category_id.value, is_veg: f.is_veg.checked }); await menuPage(); });
  });
}
if (page === 'menu') {
  if (!Store.get(ATOK)) kick(); else {
    adminNav(); safe(menuPage);
    app.addEventListener('click', ev => {
      const b = ev.target.closest('button[data-act]'); if (!b) return;
      const id = +b.dataset.id;
      if (b.dataset.act === 'delete' && !confirm('Delete this item?')) return;
      safe(async () => { await post('admin.php?action=menu_' + b.dataset.act, { id }); await menuPage(); });
    });
  }
}
