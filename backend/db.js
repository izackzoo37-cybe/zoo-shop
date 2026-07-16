// Uses Node's built-in SQLite (node:sqlite) — no native build step required.
// Requires Node.js 22.5+.
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'zoo_shop.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,          -- whole KES
    category TEXT NOT NULL,
    color_a TEXT NOT NULL,
    color_b TEXT NOT NULL,
    icon TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 4.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 20,
    active INTEGER NOT NULL DEFAULT 1,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'placed',
    address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// ---- migration: add image_url to pre-existing databases that predate this column ----
try {
  const columns = db.prepare('PRAGMA table_info(products)').all();
  const hasImageUrl = columns.some((c) => c.name === 'image_url');
  if (!hasImageUrl) {
    db.exec('ALTER TABLE products ADD COLUMN image_url TEXT');
  }
} catch (err) {
  console.error('Migration check for image_url failed:', err.message);
}

// ---- seed products once, on first run ----
const { count } = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, category, color_a, color_b, icon, rating, review_count, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    // Electronics — teal
    ['Zoo AirBuds Pro', 'True wireless earbuds with active noise cancellation and 30-hour case battery.', 5499, 'Electronics', '#0EA5A8', '#4FD9DC', 'headphones', 4.6, 312, 44],
    ['Zoo PowerBank 20K', '20,000mAh power bank with fast USB-C charging for phones, tablets, and earbuds.', 2899, 'Electronics', '#0B8A8D', '#2FD1C9', 'battery', 4.4, 198, 76],
    ['Zoo SmartWatch Lite', 'Fitness tracking smartwatch with heart-rate monitor and 10-day battery life.', 7999, 'Electronics', '#127B85', '#3FC7C4', 'watch', 4.3, 441, 31],
    ['Zoo Portable Speaker', 'Waterproof Bluetooth speaker with 12-hour playtime, IPX7 rated.', 3299, 'Electronics', '#0EA5A8', '#63E0D8', 'speaker', 4.7, 256, 58],

    // Home & Kitchen — amber
    ['Zoo Electric Kettle 1.7L', 'Rapid-boil stainless steel kettle with auto shut-off.', 2199, 'Home & Kitchen', '#C9862F', '#F0B45C', 'kettle', 4.5, 167, 63],
    ['Zoo NonStick Pan Set (3pc)', 'Ceramic-coated cookware set — frying pan, saucepan, and wok.', 4799, 'Home & Kitchen', '#B87526', '#E8A94C', 'pan', 4.6, 203, 27],
    ['Zoo Air Purifier Compact', 'HEPA air purifier for rooms up to 25m², whisper-quiet mode.', 8999, 'Home & Kitchen', '#A8641F', '#DE9B3E', 'purifier', 4.2, 88, 19],

    // Fashion — violet
    ['Zoo Classic Denim Jacket', 'Unisex washed denim jacket, relaxed fit, available in 5 sizes.', 3599, 'Fashion', '#6E4FD9', '#9C86ED', 'jacket', 4.4, 129, 52],
    ['Zoo Everyday Sneakers', 'Lightweight everyday trainers with breathable mesh upper.', 4199, 'Fashion', '#7B5CE0', '#A594F2', 'shoe', 4.5, 312, 68],
    ['Zoo Woven Tote Bag', 'Canvas tote bag with vegan leather trim and interior pocket.', 1899, 'Fashion', '#6549C7', '#8F73E3', 'bag', 4.3, 77, 41],

    // Beauty — rose
    ['Zoo Vitamin C Serum', 'Brightening facial serum with 15% vitamin C, 30ml.', 1499, 'Beauty', '#D94F72', '#F08BA5', 'droplet', 4.6, 523, 91],
    ['Zoo Bamboo Toothbrush Set (4pk)', 'Biodegradable bamboo toothbrushes, soft bristles, pack of 4.', 699, 'Beauty', '#C43F60', '#E87A96', 'leaf', 4.5, 144, 120],

    // Sports & Outdoors — green
    ['Zoo Yoga Mat Pro', 'Non-slip 6mm exercise mat with carry strap.', 2299, 'Sports & Outdoors', '#2E9E5B', '#63CC8A', 'mat', 4.7, 289, 55],
    ['Zoo Camping Hammock', 'Lightweight double hammock with tree straps, packs to fit a backpack.', 3199, 'Sports & Outdoors', '#268550', '#4FBE7D', 'hammock', 4.4, 98, 34],

    // Books — coral
    ['Building Coastal Kenya', 'A local history of trade and growth along the Kenyan coast. Paperback.', 1200, 'Books', '#E14A5A', '#F5828D', 'book', 4.8, 56, 22],
    ['The Founder\u2019s Notebook', 'Practical notes on building a company from zero to one. Paperback.', 1450, 'Books', '#D63C4C', '#F07480', 'book', 4.5, 134, 40],
  ];

  for (const p of products) insert.run(...p);
}

// ---- seed one admin account, once, on first run ----
const adminExisting = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();

if (!adminExisting) {
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@zoogroupholdings.co.ke';
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ZooAdmin123!';
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  db.prepare(
    'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)'
  ).run(ADMIN_EMAIL, passwordHash, 'Zoo Group Admin');

  console.log('----------------------------------------------------------');
  console.log('Seeded an admin account (change this password immediately):');
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log('Override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env');
  console.log('----------------------------------------------------------');
}

module.exports = db;
