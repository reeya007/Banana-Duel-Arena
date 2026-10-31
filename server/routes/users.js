// Profile data: rating, win rate and recent match history for one user. Login required.
const express = require('express');
const { param, validationResult } = require('express-validator');
const db = require('../db/database');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/:id/history', requireAuth, param('id').isInt({ min: 1 }), (req, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const id = Number(req.params.id);

  const user = db.prepare('SELECT id, username, rating FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stats = db.prepare(`
    SELECT COUNT(*) AS games,
           SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) AS wins
    FROM matches WHERE player1_id = ? OR player2_id = ?
  `).get(id, id, id);

  const rows = db.prepare(`
    SELECT m.id, m.player1_id, m.winner_id, m.p1_score, m.p2_score, m.ended_at,
           CASE WHEN m.player1_id = ? THEN u2.username ELSE u1.username END AS opponent
    FROM matches m
    JOIN users u1 ON u1.id = m.player1_id
    JOIN users u2 ON u2.id = m.player2_id
    WHERE m.player1_id = ? OR m.player2_id = ?
    ORDER BY m.id DESC LIMIT 20
  `).all(id, id, id);

  const history = rows.map((m) => {
    const mine = m.player1_id === id;
    return {
      opponent: m.opponent,
      result: m.winner_id === null ? 'Draw' : (m.winner_id === id ? 'Win' : 'Loss'),
      score: mine ? `${m.p1_score} - ${m.p2_score}` : `${m.p2_score} - ${m.p1_score}`,
      date: m.ended_at,
    };
  });

  const games = stats.games || 0;
  const wins = stats.wins || 0;
  res.json({
    username: user.username,
    rating: user.rating,
    games,
    wins,
    winRate: games ? Math.round((wins / games) * 100) : 0,
    history,
  });
});

module.exports = router;