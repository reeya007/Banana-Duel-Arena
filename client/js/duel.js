// Socket.IO client handlers. Events come from the user (click/Enter),
// the server (round:start...) and the network (connect_error).
const $ = (id) => document.getElementById(id);
const socket = io();
let countdown = null;
let reconnectTimer = null;

function showScores(scores) {
  $('scoreboard').textContent = scores.map((s) => `${s.username}: ${s.score}`).join('   |   ');
}

function startCountdown(durationMs) {
  clearInterval(countdown);
  const endsAt = Date.now() + durationMs; // uses the local clock, so it works even if clocks differ
  countdown = setInterval(() => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    $('timer').textContent = `Time left: ${left}s`;
    if (left <= 0) clearInterval(countdown);
  }, 250);
}

function setInputEnabled(enabled) {
  $('answer').disabled = !enabled;
  $('submit-btn').disabled = !enabled;
  if (enabled) $('answer').focus();
}

function submitAnswer() {
  socket.emit('answer:submit', { answer: $('answer').value });
  $('answer').value = '';
}

// --- User events ---
$('find-btn').addEventListener('click', () => {
  socket.emit('queue:join');
  $('find-btn').disabled = true;
});
$('submit-btn').addEventListener('click', submitAnswer);
$('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(); });

// --- Network events ---
socket.on('connect_error', () => {
  $('status').textContent = 'Not logged in or connection failed. Please log in again.';
});

// --- Server events ---
socket.on('queue:waiting', () => { $('status').textContent = 'Waiting for an opponent...'; });

socket.on('match:found', ({ opponent }) => {
  $('status').textContent = `Match found! You are playing against ${opponent}. Get ready...`;
  $('arena').hidden = false;
  setInputEnabled(false);
});

socket.on('round:start', ({ round, image, durationMs, scores }) => {
  $('status').textContent = '';
  $('round-info').textContent = `Round ${round} of 5`;
  $('puzzle').src = image;
  $('feedback').textContent = '';
  $('opponent').textContent = '';
  showScores(scores);
  startCountdown(durationMs);
  setInputEnabled(true);
});

socket.on('answer:wrong', ({ lockMs }) => {
  setInputEnabled(false);
  $('feedback').textContent = `❌ Wrong! Locked for ${lockMs / 1000} seconds`;
  setTimeout(() => {
    setInputEnabled(true);
    $('feedback').textContent = '';
  }, lockMs);
});

socket.on('answer:invalid', ({ message }) => { $('feedback').textContent = message; });

socket.on('opponent:answered', () => { $('opponent').textContent = 'Opponent guessed wrong 😏'; });

socket.on('round:end', ({ winner, scores, solution }) => {
  clearInterval(countdown);
  setInputEnabled(false);
  showScores(scores);
  $('feedback').textContent = winner
    ? `Round won by ${winner}! The answer was ${solution}.`
    : `Time's up! Nobody scored. The answer was ${solution}.`;
});

socket.on('api:error', ({ message }) => { $('status').textContent = message; });

socket.on('match:end', ({ winner, scores, reason, ratingChange, newRating }) => {
      clearInterval(reconnectTimer);
  clearInterval(countdown);
  setInputEnabled(false);
  showScores(scores);
  $('timer').textContent = '';
  let text = winner
    ? `Match over! Winner: ${winner}` + (reason === 'opponent left' ? ' (opponent left)' : '')
    : 'Match over: it is a draw.';
  if (ratingChange !== null) {
    text += ` | Rating: ${newRating} (${ratingChange >= 0 ? '+' : ''}${ratingChange})`;
  }
  $('status').textContent = text;
  $('find-btn').disabled = false;
});

socket.on('error:msg', ({ message }) => {
  $('status').textContent = message;
  $('find-btn').disabled = false;
});
socket.on('opponent:disconnected', ({ seconds }) => {
  let left = seconds;
  clearInterval(reconnectTimer);
  $('opponent').textContent = `Opponent disconnected. Waiting ${left}s for them to come back...`;
  reconnectTimer = setInterval(() => {
    left--;
    if (left <= 0) { clearInterval(reconnectTimer); return; }
    $('opponent').textContent = `Opponent disconnected. Waiting ${left}s for them to come back...`;
  }, 1000);
});

socket.on('opponent:reconnected', () => {
  clearInterval(reconnectTimer);
  $('opponent').textContent = 'Opponent is back!';
});

// Sent to a player who reconnected: rebuild the duel screen from the server's state
socket.on('match:resume', ({ opponent, round, image, durationMs, scores, lockMs }) => {
  $('find-btn').disabled = true;
  $('arena').hidden = false;
  $('status').textContent = `Reconnected to your match against ${opponent}.`;
  $('round-info').textContent = `Round ${round} of 5`;
  showScores(scores);
  if (image) {
    $('puzzle').src = image;
    startCountdown(durationMs);
    if (lockMs > 0) {
      setInputEnabled(false);
      setTimeout(() => setInputEnabled(true), lockMs);
    } else {
      setInputEnabled(true);
    }
  } else {
    setInputEnabled(false); // between rounds: wait for the next round
  }
});