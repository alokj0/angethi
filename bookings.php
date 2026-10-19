<?php
require __DIR__ . '/../config.php';
$u = auth('user'); $a = $_GET['action'] ?? 'list';

if ($a === 'list') {
    $s = db()->prepare('SELECT id,name,phone,res_date,res_time,guests,status FROM reservations WHERE user_id=? ORDER BY res_date DESC, res_time DESC');
    $s->execute([$u['id']]);
    respond(['bookings' => $s->fetchAll()]);
}
must_post(); $b = body();
if ($a === 'create') {
    $n = trim($b['name'] ?? ''); $p = trim($b['phone'] ?? ''); $d = $b['date'] ?? ''; $t = $b['time'] ?? ''; $g = (int)($b['guests'] ?? 0);
    $e = [];
    if ($n === '' || mb_strlen($n) > 80) $e[] = 'Enter your name.';
    if (!preg_match('/^[0-9+ ]{10,15}$/', $p)) $e[] = 'Enter a valid phone number.';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || $d < date('Y-m-d')) $e[] = 'Choose today or a later date.';
    if (!preg_match('/^\d{2}:\d{2}$/', $t)) $e[] = 'Choose a time.';
    if ($g < 1 || $g > 20) $e[] = 'Guests must be between 1 and 20.';
    if ($e) fail(422, implode(' ', $e));
    db()->prepare('INSERT INTO reservations (user_id,name,phone,res_date,res_time,guests) VALUES (?,?,?,?,?,?)')->execute([$u['id'], $n, $p, $d, $t, $g]);
    respond(['ok' => true], 201);
}
if ($a === 'cancel') {
    db()->prepare("UPDATE reservations SET status='cancelled' WHERE id=? AND user_id=?")->execute([(int)($b['id'] ?? 0), $u['id']]);
    respond(['ok' => true]);
}
fail(404, 'Unknown action.');
