<?php
require __DIR__ . '/../config.php';
$cats = db()->query('SELECT id, name FROM categories ORDER BY sort_order')->fetchAll();
$items = db()->query('SELECT id, category_id, name, description, price, is_veg FROM menu_items WHERE available=1 ORDER BY category_id, id')->fetchAll();
respond(['categories' => $cats, 'items' => $items]);
