async function loadLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) {
    document.getElementById('message').textContent = 'Could not load the leaderboard.';
    return;
  }
  const players = await res.json();
  const tbody = document.getElementById('rows');
  players.forEach((p, i) => {
    const tr = document.createElement('tr');
    [i + 1, p.username, p.rating, p.wins, p.games].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
loadLeaderboard();