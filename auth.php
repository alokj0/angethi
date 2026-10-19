<?php
require __DIR__ . '/../config.php';
$a = $_GET['action'] ?? '';
function pub($u) { return ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'phone' => $u['phone']]; }

if ($a === 'register') {
    must_post(); $b = body();
    $n = trim($b['name'] ?? ''); $em = strtolower(trim($b['email'] ?? '')); $p = trim($b['phone'] ?? ''); $pw = (string)($b['password'] ?? '');
    $e = [];
    if ($n === '' || mb_strlen($n) > 80) $e[] = 'Enter your name.';
    if (!filter_var($em, FILTER_VALIDATE_EMAIL)) $e[] = 'Enter a valid email address.';
    if (!preg_match('/^[0-9+ ]{10,15}$/', $p)) $e[] = 'Enter a valid phone number.';
    if (strlen($pw) < 6) $e[] = 'Password must be at least 6 characters.';
    if ($e) fail(422, implode(' ', $e));
    $s = db()->prepare('SELECT id FROM users WHERE email=?'); $s->execute([$em]);
    if ($s->fetch()) fail(409, 'This email is already registered. Log in instead.');
    db()->prepare('INSERT INTO users (name,email,phone,password_hash) VALUES (?,?,?,?)')->execute([$n, $em, $p, password_hash($pw, PASSWORD_DEFAULT)]);
    $id = (int)db()->lastInsertId();
    $s = db()->prepare('SELECT * FROM users WHERE id=?'); $s->execute([$id]); $u = $s->fetch();
    respond(['token' => make_token('user', $id, 0), 'user' => pub($u)], 201);
}
if ($a === 'login') {
    must_post(); $b = body();
    $s = db()->prepare('SELECT * FROM users WHERE email=?'); $s->execute([strtolower(trim($b['email'] ?? ''))]);
    $u = $s->fetch();
    if (!$u || !password_verify((string)($b['password'] ?? ''), $u['password_hash'])) fail(401, 'Wrong email or password.');
    respond(['token' => make_token('user', $u['id'], $u['token_version']), 'user' => pub($u)]);
}
if ($a === 'me') respond(['user' => pub(auth('user'))]);
if ($a === 'logout') {   // bumps token_version, so every old token stops working
    must_post(); $u = auth('user');
    db()->prepare('UPDATE users SET token_version = token_version + 1 WHERE id=?')->execute([$u['id']]);
    respond(['ok' => true]);
}
fail(404, 'Unknown action.');
