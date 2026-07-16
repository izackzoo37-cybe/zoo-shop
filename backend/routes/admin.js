const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const { upload } = require('../utils/upload');

const router = express.Router();

// Every route here requires a logged-in admin
router.use(requireAuth, requireAdmin);

const VALID_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Customer-facing copy for each status — used to notify the customer the
// moment an admin updates their order.
const STATUS_MESSAGES = {
  placed: (id) => `Your order #${id} has been placed and is awaiting processing.`,
  processing: (id) => `Good news — your order #${id} has been processed and is now being prepared.`,
  shipped: (id) => `Your order #${id} has shipped and is on its way to you.`,
  delivered: (id) => `Your order #${id} has been delivered. Enjoy!`,
  cancelled: (id) => `Your order #${id} has been cancelled. Contact us if this wasn't expected.`,
};

// ---- Overview / dashboard stats ----
router.get('/overview', (_req, res) => {
  const { totalRevenue } = db.prepare('SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders').get();
  const { totalOrders } = db.prepare('SELECT COUNT(*) as totalOrders FROM orders').get();
  const { totalCustomers } = db.prepare('SELECT COUNT(*) as totalCustomers FROM users WHERE is_admin = 0').get();
  const { todayOrders } = db
    .prepare("SELECT COUNT(*) as todayOrders FROM orders WHERE date(created_at) = date('now')")
    .get();
  const lowStockProducts = db
    .prepare('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 10 ORDER BY stock ASC')
    .all();

  const recentOrders = db
    .prepare(
      `SELECT o.id, o.total, o.status, o.created_at, u.name as customerName, u.email as customerEmail
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 5`
    )
    .all();

  res.json({
    totalRevenue,
    totalOrders,
    totalCustomers,
    todayOrders,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentOrders,
  });
});

// ---- Orders: monitor all customer shopping activity ----
router.get('/orders', (req, res) => {
  const { status } = req.query;

  let sql = `SELECT o.id, o.total, o.status, o.address, o.created_at, u.name as customerName, u.email as customerEmail
             FROM orders o JOIN users u ON u.id = o.user_id WHERE 1=1`;
  const params = [];

  if (status && status !== 'All') {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(sql).all(...params);
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));

  res.json({ orders: withItems });
});

// Single order — used by the standalone invoice page so a direct link/refresh
// to #/admin/invoice/:id doesn't depend on the orders list already being loaded
router.get('/orders/:id', (req, res) => {
  const order = db
    .prepare(
      `SELECT o.id, o.total, o.status, o.address, o.created_at, u.name as customerName, u.email as customerEmail
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`
    )
    .get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order: { ...order, items } });
});

router.patch('/orders/:id', (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const order = db.prepare('SELECT id, user_id, status FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

  // Notify the customer only when the status actually changed, so re-saving
  // the same status doesn't spam them with duplicate messages.
  if (status !== order.status) {
    const buildMessage = STATUS_MESSAGES[status];
    const message = buildMessage ? buildMessage(order.id) : `Your order #${order.id} status is now "${status}".`;
    db.prepare(
      'INSERT INTO notifications (user_id, order_id, message) VALUES (?, ?, ?)'
    ).run(order.user_id, order.id, message);
  }

  res.json({ success: true, id: Number(req.params.id), status });
});

// ---- Products: full management (including inactive/removed) ----
router.get('/products', (_req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY active DESC, id DESC').all();
  res.json({ products });
});

// Image upload — accepts a single "image" file, stores it on disk, and returns
// a URL the frontend can attach to a product as `image_url`. Kept as its own
// endpoint (rather than bundled into the create/update routes) so the admin UI
// can upload the file the moment it's picked and show a preview before saving.
router.post('/products/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/products', (req, res) => {
  const { name, description, price, category, color_a, color_b, icon, stock, image_url } = req.body;

  if (!name || !description || !price || !category || !color_a || !color_b || !icon) {
    return res.status(400).json({ error: 'name, description, price, category, color_a, color_b, and icon are required' });
  }

  const priceInt = Math.round(Number(price));
  const stockInt = Math.max(0, Math.round(Number(stock) || 0));
  if (!priceInt || priceInt < 1) return res.status(400).json({ error: 'Enter a valid price' });

  const result = db
    .prepare(
      `INSERT INTO products (name, description, price, category, color_a, color_b, icon, rating, review_count, stock, active, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 1, ?)`
    )
    .run(name, description, priceInt, category, color_a, color_b, icon, stockInt, image_url || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ product });
});

router.patch('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const fields = ['name', 'description', 'price', 'category', 'color_a', 'color_b', 'icon', 'stock', 'active', 'image_url'];
  const updates = [];
  const params = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      let value = req.body[field];
      if (field === 'price') value = Math.round(Number(value));
      if (field === 'stock') value = Math.max(0, Math.round(Number(value)));
      if (field === 'active') value = value ? 1 : 0;
      updates.push(`${field} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
});

// Soft delete — keeps historical order_items intact, just hides it from the storefront
router.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- Customers ----
router.get('/customers', (_req, res) => {
  const customers = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.created_at,
              COUNT(o.id) as orderCount,
              COALESCE(SUM(o.total), 0) as totalSpent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.is_admin = 0
       GROUP BY u.id
       ORDER BY totalSpent DESC`
    )
    .all();

  res.json({ customers });
});

module.exports = router;
