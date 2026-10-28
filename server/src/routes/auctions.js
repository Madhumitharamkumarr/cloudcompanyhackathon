const router = require('express').Router();
const { db } = require('../data/store');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Helper to check and close expired auctions
async function maybeCloseAuction(auction) {
  if (auction.status !== 'ACTIVE') return auction;
  if (new Date(auction.closingTime) <= new Date()) {
    const highestBid = await db.getHighestBid(auction.id);
    if (highestBid) {
      await db.updateAuction(auction.id, { status: 'PENDING_SELLER_APPROVAL', provisionalWinner: highestBid.bidderId, provisionalWinnerName: highestBid.bidderName, provisionalAmount: highestBid.amount });
      await db.createNotification({
        userId: auction.sellerId,
        type: 'AUCTION_ENDED',
        message: `Your auction "${auction.title}" closed! Winning bid: ₹${highestBid.amount.toLocaleString('en-IN')} by ${highestBid.bidderName}. Please review and approve/reject.`,
        auctionId: auction.id,
      });
    } else {
      await db.updateAuction(auction.id, { status: 'UNSOLD' });
      await db.createNotification({
        userId: auction.sellerId,
        type: 'AUCTION_UNSOLD',
        message: `Your auction "${auction.title}" closed with no bids.`,
        auctionId: auction.id,
      });
    }
    return db.getAuctionById(auction.id);
  }
  return auction;
}

function safeAuction(a) {
  return { id: a.id, title: a.title, category: a.category, description: a.description, condition: a.condition, images: a.images, startingPrice: a.startingPrice, minIncrement: a.minIncrement, currentBid: a.currentBid, bidCount: a.bidCount, sellerId: a.sellerId, sellerName: a.sellerName, status: a.status, closingTime: a.closingTime, createdAt: a.createdAt, featured: a.featured, provisionalWinnerName: a.provisionalWinnerName, provisionalAmount: a.provisionalAmount, sellerDecision: a.sellerDecision, handoverStatus: a.handoverStatus };
}

// GET /api/auctions
router.get('/', optionalAuth, async (req, res) => {
  const { search, category, condition, minPrice, maxPrice, status, sort } = req.query;
  let result = (await Promise.all((await db.getAuctions()).map(maybeCloseAuction))).map(safeAuction);
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
router.get('/:id', optionalAuth, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const updated = await maybeCloseAuction(auction);
  res.json(safeAuction(updated));
});

// POST /api/auctions
router.post('/', authenticate, async (req, res) => {
  const { title, category, description, condition, images, startingPrice, minIncrement, closingTime } = req.body;
  if (!title || !category || !description || !condition || !startingPrice || !closingTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (startingPrice <= 0 || minIncrement <= 0) return res.status(400).json({ error: 'Prices must be positive' });
  if (new Date(closingTime) <= new Date()) return res.status(400).json({ error: 'Closing time must be in the future' });
  const auction = await db.createAuction({ title, category, description, condition, images: images || [], startingPrice: Number(startingPrice), minIncrement: Number(minIncrement) || 50, closingTime, sellerId: req.user.id, sellerName: req.user.name, featured: false });

  // Check saved searches and notify
  const users = await db.getUsers();
  const searches = (await Promise.all(users.map(u => db.getSavedSearchesByUser(u.id)))).flat();
  await Promise.all(searches.map(async s => {
    const matchesKeyword = !s.keywords || auction.title.toLowerCase().includes(s.keywords.toLowerCase()) || auction.description.toLowerCase().includes(s.keywords.toLowerCase());
    const matchesCategory = !s.category || s.category === 'All' || auction.category === s.category;
    const matchesPrice = !s.maxPrice || auction.startingPrice <= Number(s.maxPrice);
    const matchesCondition = !s.condition || s.condition === 'All' || auction.condition === s.condition;
    if (matchesKeyword && matchesCategory && matchesPrice && matchesCondition && s.userId !== req.user.id) {
      await db.createNotification({ userId: s.userId, type: 'SAVED_SEARCH_MATCH', message: `New listing matches your search: "${auction.title}"`, auctionId: auction.id });
    }
  }));

  res.status(201).json(safeAuction(auction));
});

// PATCH /api/auctions/:id
router.patch('/:id', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your auction' });
  if (auction.status !== 'ACTIVE') return res.status(400).json({ error: 'Can only edit active auctions' });
  if (auction.bidCount > 0) return res.status(400).json({ error: 'Cannot edit auction with existing bids' });
  const { title, description, images } = req.body;
  const updated = await db.updateAuction(auction.id, { title, description, images });
  res.json(safeAuction(updated));
});

// POST /api/auctions/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your auction' });
  if (!['ACTIVE'].includes(auction.status)) return res.status(400).json({ error: 'Cannot cancel this auction' });
  if (auction.bidCount > 0) return res.status(400).json({ error: 'Cannot cancel auction with existing bids' });
  const updated = await db.updateAuction(auction.id, { status: 'CANCELLED' });
  res.json(safeAuction(updated));
});

// POST /api/auctions/:id/bids
router.post('/:id/bids', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });

  // Check status
  const fresh = await maybeCloseAuction(auction);
  if (fresh.status !== 'ACTIVE') return res.status(400).json({ error: 'Auction is not active' });

  // Check deadline (server-side)
  if (new Date(fresh.closingTime) <= new Date()) return res.status(400).json({ error: 'Auction has closed' });

  // Block seller from bidding
  if (fresh.sellerId === req.user.id) return res.status(400).json({ error: 'Sellers cannot bid on their own auctions' });

  const { amount } = req.body;
  const bidAmount = Number(amount);
  if (!bidAmount || bidAmount <= 0) return res.status(400).json({ error: 'Invalid bid amount' });

  // Validate bid amount
  const highestBid = await db.getHighestBid(fresh.id);
  const minRequired = highestBid ? highestBid.amount + fresh.minIncrement : fresh.startingPrice;
  if (bidAmount < minRequired) {
    return res.status(400).json({ error: `Bid must be at least ₹${minRequired.toLocaleString('en-IN')}`, minRequired });
  }

  // Anti-sniping: extend deadline if within 30 seconds
  let closingTime = fresh.closingTime;
  const timeLeft = new Date(fresh.closingTime) - new Date();
  if (timeLeft <= 30000 && timeLeft > 0) {
    closingTime = new Date(Date.now() + 60000).toISOString();
    await db.updateAuction(fresh.id, { closingTime });
  }

  // Create bid
  const bid = await db.createBid({ auctionId: fresh.id, bidderId: req.user.id, bidderName: req.user.name, amount: bidAmount, isAuto: false });
  await db.updateAuction(fresh.id, { currentBid: bidAmount, bidCount: (fresh.bidCount || 0) + 1 });

  // Notify seller of new bid
  await db.createNotification({
    userId: fresh.sellerId,
    type: 'NEW_BID',
    message: `New bid of ₹${bidAmount.toLocaleString('en-IN')} placed on your auction "${fresh.title}" by ${req.user.name}.`,
    auctionId: fresh.id,
  });

  // Notify previous highest bidder
  if (highestBid && highestBid.bidderId !== req.user.id) {
    await db.createNotification({ userId: highestBid.bidderId, type: 'BID_OUTBID', message: `You were outbid on "${fresh.title}". New bid: ₹${bidAmount.toLocaleString('en-IN')}`, auctionId: fresh.id });
  }

  // Run auto-bidding for other users
  const autoBidsList = (await db.getAutoBidsByAuction(fresh.id)).filter(ab => ab.userId !== req.user.id && ab.active);
  let latestBid = bid;
  let latestAmount = bidAmount;
  let updatedAuction = await db.getAuctionById(fresh.id);

  for (const ab of autoBidsList) {
    const nextRequired = latestAmount + updatedAuction.minIncrement;
    if (ab.maxAmount >= nextRequired) {
      const autoBidAmt = nextRequired;
      const autoBidder = await db.getUserById(ab.userId);
      const autoBid = await db.createBid({ auctionId: fresh.id, bidderId: ab.userId, bidderName: autoBidder?.name || 'Auto Bidder', amount: autoBidAmt, isAuto: true });
      const auctionAfterBid = await db.getAuctionById(fresh.id);
      await db.updateAuction(fresh.id, { currentBid: autoBidAmt, bidCount: (auctionAfterBid.bidCount || 0) + 1 });
      await db.createNotification({ userId: req.user.id, type: 'BID_OUTBID', message: `You were outbid (auto) on "${fresh.title}". New bid: ₹${autoBidAmt.toLocaleString('en-IN')}`, auctionId: fresh.id });
      latestAmount = autoBidAmt;
      latestBid = autoBid;
      updatedAuction = await db.getAuctionById(fresh.id);
    }
  }

  const finalAuction = await db.getAuctionById(fresh.id);
  res.status(201).json({ bid: latestBid, auction: safeAuction(finalAuction), closingTimeExtended: closingTime !== fresh.closingTime, newClosingTime: closingTime });
});

// GET /api/auctions/:id/bids
router.get('/:id/bids', async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const auctionBids = await db.getBidsByAuction(req.params.id);
  res.json(auctionBids);
});

// POST /api/auctions/:id/auto-bid
router.post('/:id/auto-bid', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId === req.user.id) return res.status(400).json({ error: 'Sellers cannot auto-bid on their own auctions' });
  if (auction.status !== 'ACTIVE') return res.status(400).json({ error: 'Auction is not active' });
  const { maxAmount } = req.body;
  const max = Number(maxAmount);
  if (!max || max <= 0) return res.status(400).json({ error: 'Invalid maximum amount' });
  const minRequired = auction.currentBid ? auction.currentBid + auction.minIncrement : auction.startingPrice;
  if (max < minRequired) return res.status(400).json({ error: `Maximum must be at least ₹${minRequired.toLocaleString('en-IN')}` });
  await db.setAutoBid(auction.id, req.user.id, max);
  res.json({ message: 'Auto-bid set successfully', maxAmount: max });
});

// POST /api/auctions/:id/decision
router.post('/:id/decision', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Only the seller can make a decision' });
  if (auction.status !== 'PENDING_SELLER_APPROVAL') return res.status(400).json({ error: 'Auction is not pending decision' });
  const { decision } = req.body;
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'Decision must be approve or reject' });
  if (decision === 'approve') {
    await db.updateAuction(auction.id, { status: 'RESERVED', sellerDecision: 'approved' });
    await db.createNotification({ userId: auction.provisionalWinner, type: 'AUCTION_WON', message: `Congratulations! Your bid on "${auction.title}" was approved. Contact the seller to arrange pickup.`, auctionId: auction.id });
  } else {
    await db.updateAuction(auction.id, { status: 'REJECTED', sellerDecision: 'rejected' });
    if (auction.provisionalWinner) {
      await db.createNotification({ userId: auction.provisionalWinner, type: 'BID_REJECTED', message: `The seller declined your winning bid on "${auction.title}".`, auctionId: auction.id });
    }
  }
  res.json(safeAuction(await db.getAuctionById(auction.id)));
});

// POST /api/auctions/:id/handover
router.post('/:id/handover', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.sellerId !== req.user.id) return res.status(403).json({ error: 'Only the seller can update handover' });
  const { status } = req.body;
  if (!['SOLD', 'FAILED_PICKUP'].includes(status)) return res.status(400).json({ error: 'Invalid handover status' });
  const updated = await db.updateAuction(auction.id, { status, handoverStatus: status });
  if (status === 'SOLD' && auction.provisionalWinner) {
    await db.createNotification({ userId: auction.provisionalWinner, type: 'HANDOVER_COMPLETE', message: `Handover confirmed for "${auction.title}". Enjoy your new item!`, auctionId: auction.id });
  }
  res.json(safeAuction(updated));
});

// GET /api/auctions/:id/questions
router.get('/:id/questions', async (req, res) => {
  const questions = await db.getQuestionsByAuction(req.params.id);
  res.json(questions);
});

// POST /api/auctions/:id/questions
router.post('/:id/questions', authenticate, async (req, res) => {
  const auction = await db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const { question } = req.body;
  if (!question || question.trim().length < 5) return res.status(400).json({ error: 'Question must be at least 5 characters' });
  if (question.length > 500) return res.status(400).json({ error: 'Question too long (max 500 chars)' });
  // Sanitize - strip HTML
  const sanitized = question.replace(/<[^>]*>/g, '').trim();
  const q = await db.createQuestion({ auctionId: auction.id, askerId: req.user.id, askerName: req.user.name, question: sanitized });
  await db.createNotification({
    userId: auction.sellerId,
    type: 'NEW_QUESTION',
    message: `New question on "${auction.title}" from ${req.user.name}: "${sanitized.slice(0, 60)}..."`,
    auctionId: auction.id,
  });
  res.status(201).json(q);
});

module.exports = router;
