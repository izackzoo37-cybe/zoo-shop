require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

const app = express();

app.use(cors({
    origin: "https://zoo-shop-production.up.railway.app",
    credentials: true
}));

app.use(express.json());


app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Uploaded product photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Convenience: serve the frontend too
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Zoo Group Holdings shop API running on http://localhost:${PORT}`);
});