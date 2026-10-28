const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const notifs = await db.getNotificationsByUser(req.user.id);
  res.json(notifs);
});

router.patch('/:id/read', authenticate, async (req, res) => {
  const updated = await db.markNotificationRead(req.params.id, req.user.id);
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

router.patch('/read-all', authenticate, async (req, res) => {
  await db.markAllNotificationsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
