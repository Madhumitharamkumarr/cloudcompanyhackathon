const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Helper to check and close expired auctions
function maybeCloseAuction(auction) {
  if (auction.status !== 'ACTIVE') return auction;
  if (new Date(auction.closingTime) <= new Date()) {
    const highestBid = db.getHighestBid(auction.id);
    if (highestBid) {
      db.updateAuction(auction.id, { status: 'PENDING_SELLER_APPROVAL', provisionalWinner: highestBid.bidderId, provisionalWinnerName: highestBid.bidderName, provisionalAmount: highestBid.amount });
    } else {
      db.updateAuction(auction.id, { status: 'UNSOLD' });
    }
    return db.getAuctionById(auction.id);
  }
  return auction;
}

function safeAuction(a) {
  return { id: a.id, title: a.title, category: a.category, description: a.description, condition: a.condition, images: a.images, startingPrice: a.startingPrice, minIncrement: a.minIncrement, currentBid: a.currentBid, bidCount: a.bidCount, sellerId: a.sellerId, sellerName: a.sellerName, status: a.status, closingTime: a.closingTime, createdAt: a.createdAt, featured: a.featured, provisionalWinnerName: a.provisionalWinnerName, provisionalAmount: a.provisionalAmount, sellerDecision: a.sellerDecision, handoverStatus: a.handoverStatus };
}

// GET /api/auctions
router.get('/', optionalAuth, (req, res) => {
  const { search, category, condition, minPrice, maxPrice, status, sort } = req.query;
  let result = db.getAuctions().map(maybeCloseAuction).map(safeAuction);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }
  if (category && category !== 'All') result = result.filter(a => a.category === category);
  if (condition && condition !== 'All') result = result.filter(a => a.condition === condition);
  if (minPrice) result = result.filter(a => (a.currentBid || a.startingPrice) >= Number(minPrice));
  if (maxPrice) result = result.filter(a => (a.currentBid || a.startingPrice) <= Number(maxPrice));
  if (status) result = result.filter(a => a.status === status);
  if (sort === 'price_asc') result.sort((a, b) => (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice));
  else if (sort === 'price_desc') result.sort((a, b) => (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice));
  else if (sort === 'ending_soon') result.sort((a, b) => new Date(a.closingTime) - new Date(b.closingTime));
  else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(result);
});

// GET /api/auctions/:id
router.get('/:id', optionalAuth, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const updated = maybeCloseAuction(auction);
  res.json(safeAuction(updated));
});

// POST /api/auctions
router.post('/', authenticate, (req, res) => {
  const { title, category, description, condition, images, startingPrice, minIncrement, closingTime } = req.body;
  if (!title || !category || !description || !condition || !startingPrice || !closingTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (startingPrice <= 0 || minIncrement <= 0) return res.status(400).json({ error: 'Prices must be positive' });
  if (new Date(closingTime) <= new Date()) return res.status(400).json({ error: 'Closing time must be in the future' });
  const auction = db.createAuction({ title, category, description, condition, images: images || [], startingPrice: Number(startingPrice), minIncrement: Number(minIncrement) || 50, closingTime, sellerId: req.user.id, sellerName: req.user.name, featured: false });

  // Check saved searches and notify
  const searches = db.getUsers().flatMap(u => db.getSavedSearchesByUser(u.id));
  searches.forEach(s => {
    const matchesKeyword = !s.keywords || auction.title.toLowerCase().includes(s.keywords.toLowerCase()) || auction.description.toLowerCase().includes(s.keywords.toLowerCase());
    const matchesCategory = !s.category || s.category === 'All' || auction.category === s.category;
    const matchesPrice = !s.maxPrice || auction.startingPrice <= Number(s.maxPrice);
    const matchesCondition = !s.condition || s.condition === 'All' || auction.condition === s.condition;
    if (matchesKeyword && matchesCategory && matchesPrice && matchesCondition && s.userId !== req.user.id) {
      db.createNotification({ userId: s.userId, type: 'SAVED_SEARCH_MATCH', message: `New listing matches your search: "${auction.title}"`, auctionId: auction.id });
    }
  });

  res.status(201).json(safeAuction(auction));
});

// PATCH /api/auctions/:id
router.patch('/:id', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your auction' });
  if (auction.status !== 'ACTIVE') return res.status(400).json({ error: 'Can only edit active auctions' });
  if (auction.bidCount > 0) return res.status(400).json({ error: 'Cannot edit auction with existing bids' });
  const { title, description, images } = req.body;
  const updated = db.updateAuction(auction.id, { title, description, images });
  res.json(safeAuction(updated));
});

// POST /api/auctions/:id/cancel
router.post('/:id/cancel', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your auction' });
  if (!['ACTIVE'].includes(auction.status)) return res.status(400).json({ error: 'Cannot cancel this auction' });
  if (auction.bidCount > 0) return res.status(400).json({ error: 'Cannot cancel auction with existing bids' });
  const updated = db.updateAuction(auction.id, { status: 'CANCELLED' });
  res.json(safeAuction(updated));
});

// POST /api/auctions/:id/bids
router.post('/:id/bids', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });

  // Check status
  const fresh = maybeCloseAuction(auction);
  if (fresh.status !== 'ACTIVE') return res.status(400).json({ error: 'Auction is not active' });

  // Check deadline (server-side)
  if (new Date(fresh.closingTime) <= new Date()) return res.status(400).json({ error: 'Auction has closed' });

  // Block seller from bidding
  if (fresh.sellerId === req.user.id) return res.status(400).json({ error: 'Sellers cannot bid on their own auctions' });

  const { amount } = req.body;
  const bidAmount = Number(amount);
  if (!bidAmount || bidAmount <= 0) return res.status(400).json({ error: 'Invalid bid amount' });

  // Validate bid amount
  const highestBid = db.getHighestBid(fresh.id);
  const minRequired = highestBid ? highestBid.amount + fresh.minIncrement : fresh.startingPrice;
  if (bidAmount < minRequired) {
    return res.status(400).json({ error: `Bid must be at least ₹${minRequired.toLocaleString('en-IN')}`, minRequired });
  }

  // Anti-sniping: extend deadline if within 30 seconds
  let closingTime = fresh.closingTime;
  const timeLeft = new Date(fresh.closingTime) - new Date();
  if (timeLeft <= 30000 && timeLeft > 0) {
    closingTime = new Date(Date.now() + 60000).toISOString();
    db.updateAuction(fresh.id, { closingTime });
  }

  // Create bid
  const bid = db.createBid({ auctionId: fresh.id, bidderId: req.user.id, bidderName: req.user.name, amount: bidAmount, isAuto: false });
  db.updateAuction(fresh.id, { currentBid: bidAmount, bidCount: (fresh.bidCount || 0) + 1 });

  // Notify previous highest bidder
  if (highestBid && highestBid.bidderId !== req.user.id) {
    db.createNotification({ userId: highestBid.bidderId, type: 'BID_OUTBID', message: `You were outbid on "${fresh.title}". New bid: ₹${bidAmount.toLocaleString('en-IN')}`, auctionId: fresh.id });
  }

  // Run auto-bidding for other users
  const autoBidsList = db.getAutoBidsByAuction(fresh.id).filter(ab => ab.userId !== req.user.id && ab.active);
  let latestBid = bid;
  let latestAmount = bidAmount;
  let updatedAuction = db.getAuctionById(fresh.id);

  for (const ab of autoBidsList) {
    const nextRequired = latestAmount + updatedAuction.minIncrement;
    if (ab.maxAmount >= nextRequired) {
      const autoBidAmt = nextRequired;
      const autoBid = db.createBid({ auctionId: fresh.id, bidderId: ab.userId, bidderName: db.getUserById(ab.userId)?.name || 'Auto Bidder', amount: autoBidAmt, isAuto: true });
      db.updateAuction(fresh.id, { currentBid: autoBidAmt, bidCount: (db.getAuctionById(fresh.id).bidCount || 0) + 1 });
      db.createNotification({ userId: req.user.id, type: 'BID_OUTBID', message: `You were outbid (auto) on "${fresh.title}". New bid: ₹${autoBidAmt.toLocaleString('en-IN')}`, auctionId: fresh.id });
      latestAmount = autoBidAmt;
      latestBid = autoBid;
      updatedAuction = db.getAuctionById(fresh.id);
    }
  }

  const finalAuction = db.getAuctionById(fresh.id);
  res.status(201).json({ bid: latestBid, auction: safeAuction(finalAuction), closingTimeExtended: closingTime !== fresh.closingTime, newClosingTime: closingTime });
});

// GET /api/auctions/:id/bids
router.get('/:id/bids', (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const auctionBids = db.getBidsByAuction(req.params.id);
  res.json(auctionBids);
});

// POST /api/auctions/:id/auto-bid
router.post('/:id/auto-bid', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId === req.user.id) return res.status(400).json({ error: 'Sellers cannot auto-bid on their own auctions' });
  if (auction.status !== 'ACTIVE') return res.status(400).json({ error: 'Auction is not active' });
  const { maxAmount } = req.body;
  const max = Number(maxAmount);
  if (!max || max <= 0) return res.status(400).json({ error: 'Invalid maximum amount' });
  const minRequired = auction.currentBid ? auction.currentBid + auction.minIncrement : auction.startingPrice;
  if (max < minRequired) return res.status(400).json({ error: `Maximum must be at least ₹${minRequired.toLocaleString('en-IN')}` });
  const setting = db.setAutoBid(auction.id, req.user.id, max);
  res.json({ message: 'Auto-bid set successfully', maxAmount: max });
});

// POST /api/auctions/:id/decision
router.post('/:id/decision', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Only the seller can make a decision' });
  if (auction.status !== 'PENDING_SELLER_APPROVAL') return res.status(400).json({ error: 'Auction is not pending decision' });
  const { decision } = req.body;
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'Decision must be approve or reject' });
  if (decision === 'approve') {
    db.updateAuction(auction.id, { status: 'RESERVED', sellerDecision: 'approved' });
    db.createNotification({ userId: auction.provisionalWinner, type: 'AUCTION_WON', message: `Congratulations! Your bid on "${auction.title}" was approved. Contact the seller to arrange pickup.`, auctionId: auction.id });
  } else {
    db.updateAuction(auction.id, { status: 'REJECTED', sellerDecision: 'rejected' });
    if (auction.provisionalWinner) {
      db.createNotification({ userId: auction.provisionalWinner, type: 'BID_REJECTED', message: `The seller declined your winning bid on "${auction.title}".`, auctionId: auction.id });
    }
  }
  res.json(safeAuction(db.getAuctionById(auction.id)));
});

// POST /api/auctions/:id/handover
router.post('/:id/handover', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Only the seller can update handover' });
  const { status } = req.body;
  if (!['SOLD', 'FAILED_PICKUP'].includes(status)) return res.status(400).json({ error: 'Invalid handover status' });
  const updated = db.updateAuction(auction.id, { status, handoverStatus: status });
  if (status === 'SOLD' && auction.provisionalWinner) {
    db.createNotification({ userId: auction.provisionalWinner, type: 'HANDOVER_COMPLETE', message: `Handover confirmed for "${auction.title}". Enjoy your new item!`, auctionId: auction.id });
  }
  res.json(safeAuction(updated));
});

// GET /api/auctions/:id/questions
router.get('/:id/questions', (req, res) => {
  const questions = db.getQuestionsByAuction(req.params.id);
  res.json(questions);
});

// POST /api/auctions/:id/questions
router.post('/:id/questions', authenticate, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const { question } = req.body;
  if (!question || question.trim().length < 5) return res.status(400).json({ error: 'Question must be at least 5 characters' });
  if (question.length > 500) return res.status(400).json({ error: 'Question too long (max 500 chars)' });
  // Sanitize - strip HTML
  const sanitized = question.replace(/<[^>]*>/g, '').trim();
  const q = db.createQuestion({ auctionId: auction.id, askerId: req.user.id, askerName: req.user.name, question: sanitized });
  res.status(201).json(q);
});

module.exports = router;
