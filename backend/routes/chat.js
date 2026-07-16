const express = require('express');
const db = require('../db');
const { verifyToken } = require('../utils/jwt');

const router = express.Router();

// Auth is optional here — guests can ask about products/policies, but
// order-specific answers require a signed-in customer. A bad/missing token
// just means the request continues as a guest rather than failing.
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = verifyToken(token); } catch (_e) { /* treat as guest */ }
  }
  next();
}
router.use(optionalAuth);

const STORE_FACTS =
  "Zoo Group Holdings is an online store based on Kenya's coast (Kilifi), selling Electronics, " +
  'Home & Kitchen, Fashion, Beauty, Sports & Outdoors, and Books. All prices are in KES. Orders ' +
  'move through these statuses in order: placed → processing → shipped → delivered (or cancelled). ' +
  "Customers get an in-app notification (the bell icon) the moment their order's status changes.";

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'you', 'have', 'has', 'my', 'i', 'me', 'to', 'for',
  'of', 'and', 'or', 'in', 'on', 'with', 'can', 'could', 'would', 'please', 'hi', 'hello', 'hey',
  'order', 'orders', 'track', 'tracking', 'status', 'where', 'buy', 'looking', 'need', 'want', 'about',
  'that', 'this', 'it', 'your', 'yours', 'help', 'much', 'many', 'cost', 'price',
]);

function formatKES(n) {
  return `KES ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function findRelevantProducts(message) {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  if (words.length === 0) return [];

  const clauses = words.map(() => '(name LIKE ? OR description LIKE ? OR category LIKE ?)').join(' OR ');
  const params = [];
  words.forEach((w) => { const like = `%${w}%`; params.push(like, like, like); });

  return db
    .prepare(`SELECT id, name, category, price, stock FROM products WHERE active = 1 AND (${clauses}) ORDER BY rating DESC LIMIT 5`)
    .all(...params);
}

function isOrderIntent(lower) {
  return /\b(order|orders|track|tracking|status|shipment|shipped|delivery|deliver|delivered|package|parcel)\b/.test(lower) || /#\s*\d+/.test(lower);
}

function extractOrderNumber(lower) {
  const m = lower.match(/#?\s*(\d{1,6})\b/);
  return m ? Number(m[1]) : null;
}

function getRecentOrders(userId) {
  return db.prepare('SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 5').all(userId);
}
function getOrderById(userId, orderId) {
  return db.prepare('SELECT id, total, status, created_at FROM orders WHERE user_id = ? AND id = ?').get(userId, orderId);
}

// ---- rule-based fallback (always available, always factually grounded) ----
function buildFallbackReply(message, req) {
  const lower = message.toLowerCase().trim();

  if (lower.length < 3 || /^(hi|hello|hey|hola|jambo|sasa)\b/.test(lower)) {
    return {
      reply: "Hi! I'm the Zoo Group Holdings assistant. I can help you track an order, check shipping, or find a product. What do you need?",
      quickReplies: ['Track my order', 'Shipping & returns', 'Find a product'],
    };
  }

  if (isOrderIntent(lower)) {
    if (!req.user) {
      return {
        reply: "I can pull up your orders once you're signed in — head to Account to sign in, then ask me again.",
        quickReplies: ['Go to Account'],
      };
    }

    const orderNum = extractOrderNumber(lower);
    if (orderNum) {
      const order = getOrderById(req.user.id, orderNum);
      if (order) {
        const dateStr = new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
        return { reply: `Order #${order.id} is currently "${order.status}". Total: ${formatKES(order.total)}, placed ${dateStr}. You'll get a notification here the moment it changes status.` };
      }
      return { reply: `I couldn't find order #${orderNum} on your account — double check the number, or take a look at your full order history.`, quickReplies: ['View order history'] };
    }

    const orders = getRecentOrders(req.user.id);
    if (orders.length === 0) {
      return { reply: "You don't have any orders yet — once you place one, I can track it for you right here.", quickReplies: ['Shop all products'] };
    }
    const list = orders.map((o) => `• Order #${o.id} — ${o.status} (${formatKES(o.total)})`).join('\n');
    return { reply: `Here's what's on your account:\n${list}\n\nAsk me about a specific order number for more detail.` };
  }

  if (/(return|refund|exchange|cancel)/.test(lower)) {
    return { reply: "You can cancel before an order ships by messaging us the order number. Once an order is delivered, returns are handled case-by-case — send us the order number and what's wrong, and we'll sort it out." };
  }

  if (/(shipping|delivery|deliver|when will|how long)/.test(lower)) {
    return { reply: 'Orders are prepared from our Kilifi coast base and move through placed → processing → shipped → delivered. Watch the bell icon — you\'ll get a notification the moment your status changes.' };
  }

  const products = findRelevantProducts(lower);
  if (products.length > 0) {
    const list = products.map((p) => `• ${p.name} — ${formatKES(p.price)} (${p.category})${p.stock <= 0 ? ' — out of stock' : ''}`).join('\n');
    return { reply: `Here's what I found:\n${list}\n\nWant me to narrow it down further?` };
  }

  return {
    reply: "I can help with order tracking, shipping, returns, and finding products. Could you rephrase, or try one of these?",
    quickReplies: ['Track my order', 'Shipping & returns', 'Find a product'],
  };
}

// ---- optional AI-powered reply (only if ANTHROPIC_API_KEY is configured) ----
async function buildAIReply(message, history, req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const productContext = findRelevantProducts(message);
  const orderContext = req.user ? getRecentOrders(req.user.id) : [];

  const contextBlock = [
    STORE_FACTS,
    productContext.length
      ? `Relevant products in our catalog right now:\n${productContext.map((p) => `- ${p.name} (${p.category}), ${formatKES(p.price)}, ${p.stock > 0 ? 'in stock' : 'out of stock'}`).join('\n')}`
      : '',
    req.user ? `Signed-in customer: ${req.user.name || req.user.email}.` : 'This visitor is not signed in — if they ask about their own orders, tell them to sign in first.',
    orderContext.length
      ? `Their recent orders:\n${orderContext.map((o) => `- Order #${o.id}: ${o.status}, ${formatKES(o.total)}, placed ${o.created_at}`).join('\n')}`
      : (req.user ? 'They have no past orders yet.' : ''),
  ].filter(Boolean).join('\n\n');

  const systemPrompt =
    'You are the customer-support assistant embedded in the Zoo Group Holdings online store. ' +
    "Answer only using the context below — never invent order numbers, statuses, prices, or policies " +
    "that aren't given to you. Keep replies short (2-4 sentences), warm, and practical. If you don't " +
    'have the information, say so plainly and suggest what the customer can do next (sign in, check ' +
    'Order History, browse a category).\n\n' + contextBlock;

  const messages = [
    ...(Array.isArray(history) ? history : []).slice(-8).map((h) => ({
      role: h.role === 'bot' ? 'assistant' : 'user',
      content: String(h.content || '').slice(0, 1000),
    })),
    { role: 'user', content: message },
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();
    return text || null;
  } catch (_e) {
    return null; // fall back to the rule-based assistant below
  }
}

router.post('/', async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A message is required' });
  }
  const trimmed = message.trim().slice(0, 1000);

  const aiReply = await buildAIReply(trimmed, history, req);
  if (aiReply) return res.json({ reply: aiReply, source: 'ai' });

  const fallback = buildFallbackReply(trimmed, req);
  res.json({ ...fallback, source: 'assistant' });
});

module.exports = router;
