const ICONS = ['🍢', '🍛', '🫓', '🍮', '🍽️', '🥘'];

async function loadMenu() {
  const cards = document.getElementById('cards'), tabs = document.getElementById('tabs');
  cards.innerHTML = '<p class="loading">Loading menu… the server can take up to a minute to wake up.</p>';
  try {
    const { categories, items } = await api('menu.php');
    const icon = {}; categories.forEach((c, i) => icon[c.id] = ICONS[i % ICONS.length]);
    tabs.innerHTML = '<button class="tab on" data-c="all" type="button">All</button>' +
      categories.map(c => `<button class="tab" data-c="${c.id}" type="button">${icon[c.id]} ${esc(c.name)}</button>`).join('');
    cards.innerHTML = items.map(i => `<article class="card" data-c="${i.category_id}">
      <div class="ico">${icon[i.category_id]}</div>
      <h3><span class="veg ${+i.is_veg ? '' : 'nonveg'}" title="${+i.is_veg ? 'Vegetarian' : 'Non-vegetarian'}"></span>${esc(i.name)}</h3>
      <p>${esc(i.description)}</p><span class="price">₹${Math.round(i.price)}</span></article>`).join('') || '<p>No dishes yet.</p>';
    tabs.querySelectorAll('.tab').forEach(t => t.onclick = () => {
      tabs.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
      cards.querySelectorAll('.card').forEach(c => c.hidden = !(t.dataset.c === 'all' || c.dataset.c === t.dataset.c));
    });
  } catch (e) {
    cards.innerHTML = '<p class="err">' + esc(e.message) + ' <button class="btn ghost sm" id="retry" type="button">Retry</button></p>';
    document.getElementById('retry').onclick = loadMenu;
  }
}

function renderBook() {
  const box = document.getElementById('book-box'), u = currentUser();
  if (!u) {
    box.innerHTML = '<h3>Log in to book</h3><p>Create a free account to reserve a table and manage your bookings.</p>' +
      '<a class="btn gold" href="/register.html">Sign up</a> <a class="btn ghost light" href="/login.html">Log in</a>';
    return;
  }
  const opts = Array.from({ length: 10 }, (_, k) => `<option value="${k + 1}" ${k === 1 ? 'selected' : ''}>${k + 1}</option>`).join('');
  box.innerHTML = `<p class="err" id="book-err"></p>
    <form id="book-form">
      <label for="name">Name</label><input id="name" name="name" value="${esc(u.name)}" required>
      <label for="phone">Phone</label><input id="phone" name="phone" value="${esc(u.phone)}" required>
      <div class="row">
        <div><label for="date">Date</label><input id="date" type="date" name="date" min="${todayLocal()}" value="${todayLocal()}" required></div>
        <div><label for="time">Time</label><input id="time" type="time" name="time" value="20:00" required></div>
      </div>
      <label for="guests">Guests</label><select id="guests" name="guests">${opts}</select>
      <button class="btn gold" type="submit">Request booking</button>
    </form>`;
  const f = document.getElementById('book-form');
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const err = document.getElementById('book-err'), btn = f.querySelector('button');
    err.textContent = ''; btn.disabled = true;
    try {
      await api('bookings.php?action=create', { method: 'POST', body: { name: f.name.value, phone: f.phone.value, date: f.date.value, time: f.time.value, guests: +f.guests.value } });
      location.href = '/my-bookings.html?booked=1';
    } catch (e) {
      if (e.status === 401) { clearSession(); location.href = '/login.html'; return; }
      err.textContent = e.message; btn.disabled = false;
    }
  });
}
loadMenu(); renderBook();
