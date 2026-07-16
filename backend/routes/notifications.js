const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// A customer's own notifications, newest first, plus how many are unread —
// used to drive the bell icon badge in the header.
router.get('/', (req, res) => {
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id);

  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({ notifications, unreadCount });
});

router.patch('/:id/read', (req, res) => {
  const notification = db
    .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.patch('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
