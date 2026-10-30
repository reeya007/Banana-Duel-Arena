const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Top 20 players by rating, with wins and games played. Public (no login needed).
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT u.username, u.rating,
      (SELECT COUNT(*) FROM matches m WHERE m.winner_id = u.id) AS wins,
      (SELECT COUNT(*) FROM matches m WHERE m.player1_id = u.id OR m.player2_id = u.id) AS games
    FROM users u
    ORDER BY u.rating DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

module.exports = router;