// Holds the state of ONE match: scores, current solution, timers and lockouts.
// The solution only ever exists here, in server memory.
const { getPuzzle } = require('../services/bananaService');

const ROUND_MS = 30000;   // 30 second limit per round
const LOCK_MS = 3000;     // lockout after a wrong answer
const WINS_NEEDED = 3;    // best of 5
const MAX_ROUNDS = 5;

class Match {
  constructor(io, roomId, socketA, socketB, onEnd) {
    this.io = io;
    this.roomId = roomId;
    this.onEnd = onEnd;
    this.players = [socketA, socketB].map((s) => ({
      userId: s.userId,
      username: s.username,
      socketId: s.id,
      score: 0,
      lockedUntil: 0,
    }));
    this.round = 0;
    this.solution = null;
    this.roundActive = false;
    this.roundStart = 0;
    this.timer = null;
    this.ended = false;
    socketA.join(roomId);
    socketB.join(roomId);
  }

  scores() {
    return this.players.map((p) => ({ username: p.username, score: p.score }));
  }

  start() {
    this.players.forEach((p, i) => {
      this.io.to(p.socketId).emit('match:found', {
        roomId: this.roomId,
        opponent: this.players[1 - i].username,
      });
    });
    setTimeout(() => this.nextRound(), 3000);
  }

  async nextRound() {
    if (this.ended) return;
    this.round++;
    try {
      const puzzle = await getPuzzle();
      if (this.ended) return;
      this.solution = puzzle.solution;          // stays on the server
      this.roundActive = true;
      this.roundStart = Date.now();
      this.players.forEach((p) => { p.lockedUntil = 0; });
      // Both players get the same puzzle image at the same moment (no solution!)
      this.io.to(this.roomId).emit('round:start', {
        round: this.round,
        image: puzzle.image,
        endsAt: this.roundStart + ROUND_MS,
        durationMs: ROUND_MS,
        scores: this.scores(),
      });
      // Timer event: nobody scores if time runs out
      this.timer = setTimeout(() => this.endRound(null), ROUND_MS);
    } catch (err) {
      this.round--;
      this.io.to(this.roomId).emit('api:error', { message: 'Puzzle service busy. Retrying in 5 seconds...' });
      setTimeout(() => this.nextRound(), 5000);
    }
  }

  submit(socket, answer) {
    if (!this.roundActive) return;
    const idx = this.players.findIndex((p) => p.socketId === socket.id);
    if (idx === -1) return;
    const player = this.players[idx];
    const now = Date.now();

    if (now < player.lockedUntil) return; // still locked out (enforced on the server)

    // Server-side validation: must be a single digit 0-9
    if (!/^[0-9]$/.test(String(answer))) {
      return socket.emit('answer:invalid', { message: 'Answer must be a digit from 0 to 9' });
    }

    if (Number(answer) === this.solution) {
      this.endRound(idx);
    } else {
      player.lockedUntil = now + LOCK_MS;
      socket.emit('answer:wrong', { lockedUntil: player.lockedUntil, lockMs: LOCK_MS });
      const opp = this.players[1 - idx];
      this.io.to(opp.socketId).emit('opponent:answered', { correct: false });
    }
  }

  endRound(winnerIdx) {
    if (!this.roundActive) return;
    this.roundActive = false;
    clearTimeout(this.timer);
    if (winnerIdx !== null) this.players[winnerIdx].score++;

    this.io.to(this.roomId).emit('round:end', {
      winner: winnerIdx === null ? null : this.players[winnerIdx].username,
      scores: this.scores(),
      solution: this.solution, // revealed only AFTER the round is over
    });

    const done = this.players.some((p) => p.score >= WINS_NEEDED) || this.round >= MAX_ROUNDS;
    if (done) setTimeout(() => this.endMatch(), 3000);
    else setTimeout(() => this.nextRound(), 4000);
  }

  // If a player disconnects, the opponent wins (15-second reconnect comes later)
  forfeit(socket) {
    if (this.ended) return;
    const idx = this.players.findIndex((p) => p.socketId === socket.id);
    if (idx === -1) return;
    this.endMatch(1 - idx, 'opponent left');
  }

  endMatch(forcedWinnerIdx = null, reason = 'finished') {
    if (this.ended) return;
    this.ended = true;
    this.roundActive = false;
    clearTimeout(this.timer);

    let winner = null;
    const [a, b] = this.players;
    if (forcedWinnerIdx !== null) winner = this.players[forcedWinnerIdx].username;
    else if (a.score !== b.score) winner = a.score > b.score ? a.username : b.username;

    this.io.to(this.roomId).emit('match:end', { winner, scores: this.scores(), reason });
    this.onEnd(this);
  }
}

module.exports = Match;