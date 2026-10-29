// Express setup, middleware and session config.
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const path = require('path');

const app = express();

// helmet adds security headers. Images are allowed from other sites because the Banana puzzle image is hosted elsewhere.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https:', 'http:'],
      'upgrade-insecure-requests': null,
    },
  },
}));
app.use(express.json());

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: '.' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 2 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', require('./routes/auth'));

// Protected page: redirect to login if there is no session 
app.get('/home.html', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/index.html');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'client')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));