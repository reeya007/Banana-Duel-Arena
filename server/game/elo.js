// Elo rating calculation (K = 32). scoreA is 1 if player A won, 0 if lost, 0.5 for a draw.
const K = 32;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculate(ratingA, ratingB, scoreA) {
  const expectedA = expectedScore(ratingA, ratingB);
  const newA = Math.round(ratingA + K * (scoreA - expectedA));
  const newB = Math.round(ratingB + K * ((1 - scoreA) - (1 - expectedA)));
  return { newA, newB };
}

module.exports = { calculate };