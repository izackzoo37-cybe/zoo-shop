const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function getCartWithProducts(userId) {
  const rows = db
    .prepare(
      `SELECT ci.product_id as productId, ci.quantity, p.name, p.price, p.color_a, p.color_b, p.icon, p.stock, p.image_url
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id ASC`
    )
    .all(userId);

  const subtotal = rows.reduce((sum, r) => sum + r.price * r.quantity, 0);
  return { items: rows, subtotal, itemCount: rows.reduce((n, r) => n + r.quantity, 0) };
}

router.get('/', requireAuth, (req, res) => {
  res.json(getCartWithProducts(req.user.id));
});

// body: { productId, quantity? } — defaults to adding 1
router.post('/', requireAuth, (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Math.max(1, Math.round(Number(quantity) || 1));

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!product.active) return res.status(400).json({ error: 'This product is no longer available' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      req.user.id,
      productId,
      qty
    );
  }

  res.status(201).json(getCartWithProducts(req.user.id));
});

// body: { quantity } — 0 removes the item
router.patch('/:productId', requireAuth, (req, res) => {
  const { quantity } = req.body;
  const qty = Math.round(Number(quantity));

  if (Number.isNaN(qty) || qty < 0) {
    return res.status(400).json({ error: 'Quantity must be 0 or a positive number' });
  }

  if (qty === 0) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(
      req.user.id,
      req.params.productId
    );
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(
      qty,
      req.user.id,
      req.params.productId
    );
  }

  res.json(getCartWithProducts(req.user.id));
});

router.delete('/:productId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(
    req.user.id,
    req.params.productId
  );
  res.json(getCartWithProducts(req.user.id));
});

module.exports = router;
