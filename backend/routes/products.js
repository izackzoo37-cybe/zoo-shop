const express = require('express');
const db = require('../db');

const router = express.Router();

const SORTS = {
  relevance: 'id ASC',
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  rating: 'rating DESC',
};

// GET /api/products?q=&category=&sort=
router.get('/', (req, res) => {
  const { q, category, sort } = req.query;

  let sql = 'SELECT * FROM products WHERE active = 1';
  const params = [];

  if (q) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ` ORDER BY ${SORTS[sort] || SORTS.relevance}`;

  const products = db.prepare(sql).all(...params);
  res.json({ products });
});

router.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category').all();
  res.json({ categories: rows.map((r) => r.category) });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

module.exports = router;
