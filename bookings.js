const root = document.getElementById('list');
async function loadBookings() {
  const u = currentUser();
  if (!u) { location.href = '/login.html'; return; }
  document.getElementById('who').textContent = 'Signed in as ' + u.name + ' (' + u.email + ')';
  if (new URLSearchParams(location.search).has('booked')) document.getElementById('ok').hidden = false;
  root.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const { bookings } = await api('bookings.php?action=list');
    const today = todayLocal();
    root.innerHTML = bookings.length ? bookings.map(r => `<div class="bk">
      <div><b>${esc(new Date(r.res_date + 'T00:00:00').toDateString())} · ${esc(r.res_time.slice(0, 5))}</b><br>${+r.guests} guest${r.guests > 1 ? 's' : ''} · ${esc(r.name)}</div>
      <span class="st ${esc(r.status)}">${esc(r.status[0].toUpperCase() + r.status.slice(1))}</span>
      ${r.status !== 'cancelled' && r.res_date >= today ? `<button class="btn sm dark" data-id="${+r.id}" type="button">Cancel</button>` : ''}
    </div>`).join('') : '<p>You have no bookings yet. <a href="/index.html#book">Book a table</a></p>';
  } catch (e) {
    if (e.status === 401) { clearSession(); location.href = '/login.html'; return; }
    root.innerHTML = '<p class="err">' + esc(e.message) + '</p>';
  }
}
root.addEventListener('click', async ev => {
  const b = ev.target.closest('button[data-id]');
  if (!b || !confirm('Cancel this booking?')) return;
  try { await api('bookings.php?action=cancel', { method: 'POST', body: { id: +b.dataset.id } }); loadBookings(); }
  catch (e) { alert(e.message); }
});
loadBookings();
