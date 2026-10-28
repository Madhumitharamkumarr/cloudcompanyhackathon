const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  const notifs = db.getNotificationsByUser(req.user.id);
  res.json(notifs);
});

router.patch('/:id/read', authenticate, (req, res) => {
  const updated = db.markNotificationRead(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

router.patch('/read-all', authenticate, (req, res) => {
  const notifs = db.getNotificationsByUser(req.user.id);
  notifs.forEach(n => db.markNotificationRead(n.id));
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
