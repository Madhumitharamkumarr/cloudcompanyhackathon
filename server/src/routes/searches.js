const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  const searches = db.getSavedSearchesByUser(req.user.id);
  res.json(searches);
});

router.post('/', authenticate, (req, res) => {
  const { keywords, category, maxPrice, condition } = req.body;
  if (!keywords && !category && !maxPrice) return res.status(400).json({ error: 'Provide at least one search criterion' });
  const search = db.createSavedSearch({ userId: req.user.id, keywords, category, maxPrice: maxPrice ? Number(maxPrice) : null, condition });
  res.status(201).json(search);
});

router.delete('/:id', authenticate, (req, res) => {
  db.deleteSavedSearch(req.params.id);
  res.json({ message: 'Saved search deleted' });
});

module.exports = router;
