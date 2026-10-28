const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'campusbid_demo_secret_2024';
const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, college: u.college, createdAt: u.createdAt });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (db.getUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const user = db.createUser({ name, email: email.toLowerCase(), password: hashed, avatar: initials, college: college || '' });
    const token = signToken(user.id);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
});

module.exports = router;
