// Practice mode: button clicks and the Enter key trigger fetch calls to the server.
const $ = (id) => document.getElementById(id);

async function loadPuzzle() {
  $('result').textContent = '';
  $('status').textContent = 'Loading puzzle...';
  const res = await fetch('/api/practice/puzzle');
  if (res.status === 401) { window.location.href = '/index.html'; return; } // session expired
  const data = await res.json();
  if (!res.ok) { $('status').textContent = data.error; return; }
  $('status').textContent = '';
  $('puzzle').src = data.image;
  $('answer').value = '';
}

async function submitAnswer() {
  const res = await fetch('/api/practice/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: $('answer').value }),
  });
  const data = await res.json();
  $('result').textContent = data.error || (data.correct ? '✅ Correct!' : '❌ Wrong, try again');
}

$('new-puzzle-btn').addEventListener('click', loadPuzzle);
$('submit-btn').addEventListener('click', submitAnswer);
$('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(); });
loadPuzzle();