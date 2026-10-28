const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'campusbid_demo_secret_2024';
const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, college: u.college, createdAt: u.createdAt });
const isEduEmail = (email) => /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+edu$/i.test(email);

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, college } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    const normalizedEmail = email.trim().toLowerCase();
    if (!isEduEmail(normalizedEmail)) return res.status(400).json({ error: 'Please use a valid .edu email address' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await db.getUserByEmail(normalizedEmail)) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const user = await db.createUser({ name, email: normalizedEmail, password: hashed, avatar: initials, college: college || '' });
    const token = signToken(user.id);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
});

module.exports = router;
