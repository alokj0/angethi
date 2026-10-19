<?php
require __DIR__ . '/../config.php';
$a = $_GET['action'] ?? '';

if ($a === 'login') {
    must_post(); $b = body();
    $s = db()->prepare('SELECT * FROM admins WHERE username=?'); $s->execute([trim($b['username'] ?? '')]);
    $r = $s->fetch();
    if (!$r || !password_verify((string)($b['password'] ?? ''), $r['password_hash'])) fail(401, 'Wrong username or password.');
    respond(['token' => make_token('admin', $r['id'], $r['token_version']), 'admin' => $r['username']]);
}
$adm = auth('admin');
$b = body(); $id = (int)($b['id'] ?? 0);

switch ($a) {
case 'logout':
    must_post();
    db()->prepare('UPDATE admins SET token_version = token_version + 1 WHERE id=?')->execute([$adm['id']]);
    respond(['ok' => true]);
case 'bookings':
    $counts = ['pending' => 0, 'confirmed' => 0, 'cancelled' => 0];
    foreach (db()->query('SELECT status, COUNT(*) c FROM reservations GROUP BY status') as $r) $counts[$r['status']] = (int)$r['c'];
    $rows = db()->query('SELECT r.id,r.name,r.phone,r.res_date,r.res_time,r.guests,r.status,u.email FROM reservations r JOIN users u ON u.id=r.user_id ORDER BY r.res_date DESC, r.res_time DESC')->fetchAll();
    respond(['counts' => $counts, 'customers' => (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn(), 'bookings' => $rows]);
case 'booking_status':
    must_post();
    if (!in_array($b['status'] ?? '', ['pending', 'confirmed', 'cancelled'], true)) fail(422, 'Invalid status.');
    db()->prepare('UPDATE reservations SET status=? WHERE id=?')->execute([$b['status'], $id]);
    respond(['ok' => true]);
case 'booking_delete':
    must_post(); db()->prepare('DELETE FROM reservations WHERE id=?')->execute([$id]); respond(['ok' => true]);
case 'menu_list':
    respond([
        'categories' => db()->query('SELECT id, name FROM categories ORDER BY sort_order')->fetchAll(),
        'items' => db()->query('SELECT m.id,m.name,m.description,m.price,m.is_veg,m.available,c.name AS cat FROM menu_items m JOIN categories c ON c.id=m.category_id ORDER BY c.sort_order, m.id')->fetchAll(),
    ]);
case 'menu_add':
    must_post();
    $name = trim($b['name'] ?? ''); $price = (float)($b['price'] ?? 0); $cat = (int)($b['category_id'] ?? 0);
    if ($name === '' || mb_strlen($name) > 100 || $price <= 0) fail(422, 'Enter a name and a price above 0.');
    $c = db()->prepare('SELECT id FROM categories WHERE id=?'); $c->execute([$cat]);
    if (!$c->fetch()) fail(422, 'Choose a category.');
    db()->prepare('INSERT INTO menu_items (category_id,name,description,price,is_veg) VALUES (?,?,?,?,?)')
        ->execute([$cat, $name, mb_substr(trim($b['description'] ?? ''), 0, 255), $price, !empty($b['is_veg']) ? 1 : 0]);
    respond(['ok' => true], 201);
case 'menu_toggle':
    must_post(); db()->prepare('UPDATE menu_items SET available = 1 - available WHERE id=?')->execute([$id]); respond(['ok' => true]);
case 'menu_delete':
    must_post(); db()->prepare('DELETE FROM menu_items WHERE id=?')->execute([$id]); respond(['ok' => true]);
}
fail(404, 'Unknown action.');
