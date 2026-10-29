const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Brute-force protection: 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many attempts, try again later' },
});

// Server-side validation 
const rules = [
  body('username').trim().isLength({ min: 3, max: 20 }).matches(/^[A-Za-z0-9_]+$/),
  body('password').isLength({ min: 8, max: 72 }),
];

router.post('/register', rules, async (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ error: 'Username: 3-20 letters/numbers/_ . Password: 8+ characters.' });
  }
  const { username, password } = req.body;
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const hash = await bcrypt.hash(password, 12); // salted, cost 12
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  res.status(201).json({ message: 'Account created' });
});

router.post('/login', loginLimiter, rules, async (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: 'Wrong username or password' });

  // New session ID on login prevents session fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ username: user.username });
  });
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

module.exports = router;