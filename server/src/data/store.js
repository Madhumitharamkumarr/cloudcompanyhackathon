const { MongoClient } = require('mongodb');

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ─── Users ───────────────────────────────────────────────────────────────────
const users = [
  {
    id: 'user-1',
    name: 'Arjun Sharma',
    email: 'arjun@college.edu',
    password: bcrypt.hashSync('password123', 10),
    avatar: 'AS',
    college: 'IIT Bombay',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'user-2',
    name: 'Priya Nair',
    email: 'priya@college.edu',
    password: bcrypt.hashSync('password123', 10),
    avatar: 'PN',
    college: 'IIT Bombay',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'user-3',
    name: 'Rahul Gupta',
    email: 'rahul@college.edu',
    password: bcrypt.hashSync('password123', 10),
    avatar: 'RG',
    college: 'IIT Bombay',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

// ─── Auctions ─────────────────────────────────────────────────────────────────
const now = Date.now();
const auctions = [
  {
    id: 'auction-1',
    title: 'Hero Sprint 26T Mountain Bicycle',
    category: 'Cycles',
    description: 'Used for 2 years, well maintained. Gear system works perfectly. Minor scratches on frame. Comes with lock and pump. Great for campus commuting.',
    condition: 'Good',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
    startingPrice: 3500,
    minIncrement: 200,
    currentBid: 4100,
    bidCount: 3,
    sellerId: 'user-1',
    sellerName: 'Arjun Sharma',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 2).toISOString(),
    createdAt: new Date(now - 86400000 * 2).toISOString(),
    featured: true,
  },
  {
    id: 'auction-2',
    title: 'Casio FX-991ES Plus Scientific Calculator',
    category: 'Calculators',
    description: 'Perfect condition scientific calculator. Used for 1 semester only. All functions working. Comes with original cover. Essential for engineering exams.',
    condition: 'Like New',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'],
    startingPrice: 350,
    minIncrement: 25,
    currentBid: 375,
    bidCount: 2,
    sellerId: 'user-2',
    sellerName: 'Priya Nair',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 5).toISOString(),
    createdAt: new Date(now - 86400000 * 1).toISOString(),
    featured: true,
  },
  {
    id: 'auction-3',
    title: 'Engineering Mathematics Textbook Set (5 books)',
    category: 'Books',
    description: 'Complete set: Engineering Maths Vol 1-3 by H.K. Dass, Signals & Systems by Oppenheim, and Data Structures by Cormen. Light notes inside. Good condition.',
    condition: 'Good',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600'],
    startingPrice: 600,
    minIncrement: 50,
    currentBid: null,
    bidCount: 0,
    sellerId: 'user-3',
    sellerName: 'Rahul Gupta',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 8).toISOString(),
    createdAt: new Date(now - 3600000 * 12).toISOString(),
    featured: false,
  },
  {
    id: 'auction-4',
    title: 'Dell Inspiron 15 Laptop (Core i5, 8GB RAM)',
    category: 'Electronics',
    description: '3 year old Dell Inspiron. Intel i5-8th gen, 8GB DDR4, 512GB SSD. Battery lasts 3-4 hours. Minor wear on keyboard. Windows 11 installed. Great for coding.',
    condition: 'Fair',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    startingPrice: 18000,
    minIncrement: 500,
    currentBid: 19500,
    bidCount: 4,
    sellerId: 'user-1',
    sellerName: 'Arjun Sharma',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 1).toISOString(),
    createdAt: new Date(now - 86400000 * 3).toISOString(),
    featured: true,
  },
  {
    id: 'auction-5',
    title: 'Sony WH-1000XM3 Noise Cancelling Headphones',
    category: 'Electronics',
    description: 'Premium noise cancelling headphones. Excellent for studying in noisy dorms. Battery health at 85%. Original case and cables included. Minor scuffs.',
    condition: 'Good',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    startingPrice: 8000,
    minIncrement: 300,
    currentBid: 8600,
    bidCount: 3,
    sellerId: 'user-2',
    sellerName: 'Priya Nair',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 26).toISOString(),
    createdAt: new Date(now - 86400000 * 1).toISOString(),
    featured: false,
  },
  {
    id: 'auction-6',
    title: 'Wildcraft 45L College Backpack',
    category: 'Accessories',
    description: 'Durable Wildcraft backpack, carried for 2 semesters. Laptop compartment fits 15.6". All zippers working. Washed and clean. Teal/black color.',
    condition: 'Good',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
    startingPrice: 800,
    minIncrement: 50,
    currentBid: null,
    bidCount: 0,
    sellerId: 'user-3',
    sellerName: 'Rahul Gupta',
    status: 'ACTIVE',
    closingTime: new Date(now + 3600000 * 48).toISOString(),
    createdAt: new Date(now - 3600000 * 6).toISOString(),
    featured: false,
  },
];

// ─── Bids ─────────────────────────────────────────────────────────────────────
const bids = [
  // auction-1 bids
  { id: 'bid-1', auctionId: 'auction-1', bidderId: 'user-2', bidderName: 'Priya Nair', amount: 3700, isAuto: false, timestamp: new Date(now - 3600000 * 10).toISOString() },
  { id: 'bid-2', auctionId: 'auction-1', bidderId: 'user-3', bidderName: 'Rahul Gupta', amount: 3900, isAuto: false, timestamp: new Date(now - 3600000 * 8).toISOString() },
  { id: 'bid-3', auctionId: 'auction-1', bidderId: 'user-2', bidderName: 'Priya Nair', amount: 4100, isAuto: true, timestamp: new Date(now - 3600000 * 7).toISOString() },
  // auction-2 bids
  { id: 'bid-4', auctionId: 'auction-2', bidderId: 'user-3', bidderName: 'Rahul Gupta', amount: 375, isAuto: false, timestamp: new Date(now - 3600000 * 5).toISOString() },
  { id: 'bid-5', auctionId: 'auction-2', bidderId: 'user-1', bidderName: 'Arjun Sharma', amount: 375, isAuto: false, timestamp: new Date(now - 3600000 * 3).toISOString() },
  // auction-4 bids
  { id: 'bid-6', auctionId: 'auction-4', bidderId: 'user-2', bidderName: 'Priya Nair', amount: 18500, isAuto: false, timestamp: new Date(now - 86400000).toISOString() },
  { id: 'bid-7', auctionId: 'auction-4', bidderId: 'user-3', bidderName: 'Rahul Gupta', amount: 19000, isAuto: false, timestamp: new Date(now - 3600000 * 20).toISOString() },
  { id: 'bid-8', auctionId: 'auction-4', bidderId: 'user-2', bidderName: 'Priya Nair', amount: 19500, isAuto: true, timestamp: new Date(now - 3600000 * 18).toISOString() },
  { id: 'bid-9', auctionId: 'auction-4', bidderId: 'user-3', bidderName: 'Rahul Gupta', amount: 20000, isAuto: false, timestamp: new Date(now - 3600000 * 15).toISOString() },
  // auction-5 bids
  { id: 'bid-10', auctionId: 'auction-5', bidderId: 'user-1', bidderName: 'Arjun Sharma', amount: 8300, isAuto: false, timestamp: new Date(now - 3600000 * 12).toISOString() },
  { id: 'bid-11', auctionId: 'auction-5', bidderId: 'user-3', bidderName: 'Rahul Gupta', amount: 8600, isAuto: false, timestamp: new Date(now - 3600000 * 10).toISOString() },
];

// Fix bid counts and current bids to match
auctions[0].bidCount = bids.filter(b => b.auctionId === 'auction-1').length;
auctions[0].currentBid = 4100;
auctions[1].bidCount = bids.filter(b => b.auctionId === 'auction-2').length;
auctions[1].currentBid = 375;
auctions[3].bidCount = bids.filter(b => b.auctionId === 'auction-4').length;
auctions[3].currentBid = 20000;
auctions[4].bidCount = bids.filter(b => b.auctionId === 'auction-5').length;
auctions[4].currentBid = 8600;

// ─── Questions ────────────────────────────────────────────────────────────────
const questions = [
  {
    id: 'q-1',
    auctionId: 'auction-1',
    askerId: 'user-3',
    askerName: 'Rahul Gupta',
    question: 'Does it have gears? How many speeds?',
    answer: 'Yes, it has 21 speeds (7 at rear, 3 at front). All working perfectly!',
    answeredAt: new Date(now - 3600000 * 6).toISOString(),
    createdAt: new Date(now - 3600000 * 8).toISOString(),
  },
  {
    id: 'q-2',
    auctionId: 'auction-4',
    askerId: 'user-3',
    askerName: 'Rahul Gupta',
    question: 'Is the screen in good condition? Any dead pixels?',
    answer: 'Screen is perfect, no dead pixels. Just a tiny scratch on the bezel.',
    answeredAt: new Date(now - 3600000 * 14).toISOString(),
    createdAt: new Date(now - 3600000 * 16).toISOString(),
  },
];

// ─── Saved Searches ───────────────────────────────────────────────────────────
const savedSearches = [];

// ─── Notifications ────────────────────────────────────────────────────────────
const notifications = [
  {
    id: 'notif-1',
    userId: 'user-2',
    type: 'BID_OUTBID',
    message: 'You have been outbid on "Hero Sprint 26T Mountain Bicycle". Current bid: ₹4,100',
    auctionId: 'auction-1',
    read: false,
    createdAt: new Date(now - 3600000 * 7).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-3',
    type: 'AUCTION_ENDING',
    message: '"Dell Inspiron 15 Laptop" is ending in 1 hour!',
    auctionId: 'auction-4',
    read: false,
    createdAt: new Date(now - 3600000 * 1).toISOString(),
  },
];

// ─── Auto-bid settings ────────────────────────────────────────────────────────
const autoBids = [];

let client;
let collections;

function withoutMongoId(document) {
  if (!document) return null;
  const { _id, ...data } = document;
  return { ...data, id: data.id || _id };
}

function withMongoId(document) {
  return { ...document, _id: document.id };
}

async function seedCollection(collection, documents) {
  if (documents.length && await collection.countDocuments() === 0) {
    await collection.insertMany(documents.map(withMongoId));
  }
}

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbid';
  client = new MongoClient(uri);
  await client.connect();
  const database = client.db(process.env.MONGODB_DB || 'campusbid');
  await database.command({ ping: 1 });

  collections = {
    users: database.collection('users'),
    auctions: database.collection('auctions'),
    bids: database.collection('bids'),
    questions: database.collection('questions'),
    savedSearches: database.collection('savedSearches'),
    notifications: database.collection('notifications'),
    autoBids: database.collection('autoBids'),
  };

  await collections.users.createIndex({ email: 1 }, { unique: true });
  await collections.autoBids.createIndex({ auctionId: 1, userId: 1 }, { unique: true });
  await Promise.all([
    seedCollection(collections.users, users),
    seedCollection(collections.auctions, auctions),
    seedCollection(collections.bids, bids),
    seedCollection(collections.questions, questions),
    seedCollection(collections.savedSearches, savedSearches),
    seedCollection(collections.notifications, notifications),
    seedCollection(collections.autoBids, autoBids),
  ]);
  console.log(`Connected to MongoDB database "${database.databaseName}"`);
}

async function closeDatabase() {
  if (client) await client.close();
}

const db = {
  getUsers: async () => (await collections.users.find().toArray()).map(withoutMongoId),
  getUserById: async id => withoutMongoId(await collections.users.findOne({ _id: id })),
  getUserByEmail: async email => withoutMongoId(await collections.users.findOne({ email: email.toLowerCase() })),
  createUser: async data => {
    const user = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
    await collections.users.insertOne(withMongoId(user));
    return user;
  },

  getAuctions: async () => (await collections.auctions.find().toArray()).map(withoutMongoId),
  getAuctionById: async id => withoutMongoId(await collections.auctions.findOne({ _id: id })),
  createAuction: async data => {
    const auction = { id: uuidv4(), bidCount: 0, currentBid: null, status: 'ACTIVE', createdAt: new Date().toISOString(), ...data };
    await collections.auctions.insertOne(withMongoId(auction));
    return auction;
  },
  updateAuction: async (id, updates) => {
    const result = await collections.auctions.updateOne({ _id: id }, { $set: updates });
    return result.matchedCount ? db.getAuctionById(id) : null;
  },

  getBids: async () => (await collections.bids.find().toArray()).map(withoutMongoId),
  getBidsByAuction: async auctionId => (await collections.bids.find({ auctionId }).sort({ timestamp: -1 }).toArray()).map(withoutMongoId),
  getHighestBid: async auctionId => withoutMongoId(await collections.bids.findOne({ auctionId }, { sort: { amount: -1 } })),
  createBid: async data => {
    const bid = { id: uuidv4(), ...data, timestamp: new Date().toISOString() };
    await collections.bids.insertOne(withMongoId(bid));
    return bid;
  },

  getQuestionsByAuction: async auctionId => (await collections.questions.find({ auctionId }).sort({ createdAt: 1 }).toArray()).map(withoutMongoId),
  getQuestionById: async id => withoutMongoId(await collections.questions.findOne({ _id: id })),
  createQuestion: async data => {
    const question = { id: uuidv4(), answer: null, answeredAt: null, ...data, createdAt: new Date().toISOString() };
    await collections.questions.insertOne(withMongoId(question));
    return question;
  },
  updateQuestion: async (id, updates) => {
    const result = await collections.questions.updateOne({ _id: id }, { $set: updates });
    return result.matchedCount
      ? withoutMongoId(await collections.questions.findOne({ _id: id }))
      : null;
  },

  getSavedSearchesByUser: async userId => (await collections.savedSearches.find({ userId }).toArray()).map(withoutMongoId),
  createSavedSearch: async data => {
    const search = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
    await collections.savedSearches.insertOne(withMongoId(search));
    return search;
  },
  deleteSavedSearch: async id => {
    await collections.savedSearches.deleteOne({ _id: id });
  },

  getNotificationsByUser: async userId => (await collections.notifications.find({ userId }).sort({ createdAt: -1 }).toArray()).map(withoutMongoId),
  createNotification: async data => {
    const notification = { id: uuidv4(), read: false, ...data, createdAt: new Date().toISOString() };
    await collections.notifications.insertOne(withMongoId(notification));
    return notification;
  },
  markNotificationRead: async (id, userId) => {
    const filter = { _id: id, userId };
    const result = await collections.notifications.updateOne(filter, { $set: { read: true } });
    return result.matchedCount
      ? withoutMongoId(await collections.notifications.findOne(filter))
      : null;
  },
  markAllNotificationsRead: async userId => {
    await collections.notifications.updateMany({ userId }, { $set: { read: true } });
  },

  getAutoBid: async (auctionId, userId) => withoutMongoId(await collections.autoBids.findOne({ auctionId, userId })),
  getAutoBidsByAuction: async auctionId => (await collections.autoBids.find({ auctionId }).toArray()).map(withoutMongoId),
  setAutoBid: async (auctionId, userId, maxAmount) => {
    const entry = { id: uuidv4(), auctionId, userId, maxAmount, active: true, createdAt: new Date().toISOString() };
    await collections.autoBids.updateOne(
      { auctionId, userId },
      {
        $set: { maxAmount, active: true, createdAt: entry.createdAt },
        $setOnInsert: { _id: entry.id, id: entry.id },
      },
      { upsert: true },
    );
    return withoutMongoId(await collections.autoBids.findOne({ auctionId, userId }));
  },
};

module.exports = { db, connectToDatabase, closeDatabase };
