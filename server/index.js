require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true },
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/auctions', require('./src/routes/auctions'));
app.use('/api/questions', require('./src/routes/questions'));
app.use('/api/saved-searches', require('./src/routes/searches'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/assistant', require('./src/routes/assistant'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'demo', time: new Date().toISOString() }));

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join-auction', (auctionId) => socket.join(`auction-${auctionId}`));
  socket.on('leave-auction', (auctionId) => socket.leave(`auction-${auctionId}`));
  socket.on('disconnect', () => {});
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CampusBid server running on port ${PORT}`);
  console.log(`📦 Mode: Demo (in-memory data store)`);
  console.log(`🤖 AI: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter configured' : 'No API key — fallback mode'}`);
});
