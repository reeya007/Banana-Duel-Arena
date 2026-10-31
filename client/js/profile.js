// Loads a profile. Uses ?id=... if given, otherwise the logged-in user. textContent only, never innerHTML.
async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  let id = params.get('id');
  if (!id) {
    const me = await fetch('/api/auth/me');
    if (!me.ok) { window.location.href = '/index.html'; return; }
    id = (await me.json()).id;
  }

  const res = await fetch('/api/users/' + encodeURIComponent(id) + '/history');
  if (res.status === 401) { window.location.href = '/index.html'; return; }
  const data = await res.json();
  if (!res.ok) { document.getElementById('message').textContent = data.error; return; }

  document.getElementById('name').textContent = data.username;
  document.getElementById('summary').textContent =
    `Rating: ${data.rating} | Games: ${data.games} | Wins: ${data.wins} | Win rate: ${data.winRate}%`;

  const tbody = document.getElementById('rows');
  data.history.forEach((m) => {
    const tr = document.createElement('tr');
    [m.opponent, m.result, m.score, m.date].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  if (data.history.length === 0) {
    document.getElementById('message').textContent = 'No matches played yet.';
  }
}
loadProfile();