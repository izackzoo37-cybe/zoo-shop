const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — turns the current cart into an order, then empties the cart
router.post('/', requireAuth, (req, res) => {
  const { address } = req.body;
  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'A delivery address is required' });
  }

  const cartItems = db
    .prepare(
      `SELECT ci.product_id as productId, ci.quantity, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Only ${item.stock} of "${item.name}" left in stock` });
    }
  }

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orderResult = db
    .prepare('INSERT INTO orders (user_id, total, address, status) VALUES (?, ?, ?, ?)')
    .run(req.user.id, total, address.trim(), 'placed');

  const orderId = orderResult.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
  );
  const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

  for (const item of cartItems) {
    insertItem.run(orderId, item.productId, item.name, item.price, item.quantity);
    decrementStock.run(item.quantity, item.productId);
  }

  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

  db.prepare(
    'INSERT INTO notifications (user_id, order_id, message) VALUES (?, ?, ?)'
  ).run(req.user.id, orderId, `Your order #${orderId} has been placed successfully. We'll let you know as it's processed.`);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({ order, items });
});

router.get('/', requireAuth, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);

  const withItems = orders.map((order) => ({
    ...order,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id),
  }));

  res.json({ orders: withItems });
});

router.get('/:id', requireAuth, (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order, items });
});

module.exports = router;
