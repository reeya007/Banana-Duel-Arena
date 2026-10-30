const db = require('../db/database');
const { calculate } = require('./elo');

function saveMatchResult({ players, winnerIdx, mode, startedAt, rounds }) {
  const [a, b] = players;

  const run = db.transaction(() => {
    const ratingA = db.prepare('SELECT rating FROM users WHERE id = ?').get(a.userId).rating;
    const ratingB = db.prepare('SELECT rating FROM users WHERE id = ?').get(b.userId).rating;

    const scoreA = winnerIdx === null ? 0.5 : (winnerIdx === 0 ? 1 : 0);
    const { newA, newB } = calculate(ratingA, ratingB, scoreA);

    db.prepare('UPDATE users SET rating = ? WHERE id = ?').run(newA, a.userId);
    db.prepare('UPDATE users SET rating = ? WHERE id = ?').run(newB, b.userId);

    const winnerId = winnerIdx === null ? null : players[winnerIdx].userId;
    const info = db.prepare(
      `INSERT INTO matches (player1_id, player2_id, winner_id, p1_score, p2_score, mode, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(a.userId, b.userId, winnerId, a.score, b.score, mode,
          new Date(startedAt).toISOString(), new Date().toISOString());

    const insertRound = db.prepare(
      'INSERT INTO rounds (match_id, round_no, winner_id, time_ms, puzzle_url) VALUES (?, ?, ?, ?, ?)'
    );
    rounds.forEach((r) => insertRound.run(info.lastInsertRowid, r.round_no, r.winner_id, r.time_ms, r.puzzle_url));

    return { changeA: newA - ratingA, changeB: newB - ratingB, newA, newB };
  });

  return run();
}

module.exports = { saveMatchResult };