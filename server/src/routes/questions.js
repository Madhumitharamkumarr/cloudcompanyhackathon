const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate } = require('../middleware/auth');

// POST /api/questions/:id/answer
router.post('/:id/answer', authenticate, (req, res) => {
  const question = db.getQuestionById(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  const auction = db.getAuctionById(question.auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Only the seller can answer questions' });
  const { answer } = req.body;
  if (!answer || answer.trim().length < 2) return res.status(400).json({ error: 'Answer is too short' });
  if (answer.length > 1000) return res.status(400).json({ error: 'Answer too long (max 1000 chars)' });
  const sanitized = answer.replace(/<[^>]*>/g, '').trim();
  const updated = db.updateQuestion(question.id, { answer: sanitized, answeredAt: new Date().toISOString() });
  res.json(updated);
});

module.exports = router;
