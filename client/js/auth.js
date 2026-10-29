// Login/register form handlers. Clicks are events that call async handlers.
async function send(url) {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  document.getElementById('message').textContent = data.error || data.message || '';
  return res.ok;
}

document.getElementById('login-btn').addEventListener('click', async () => {
  if (await send('/api/auth/login')) window.location.href = '/home.html';
});

document.getElementById('register-btn').addEventListener('click', async () => {
  if (await send('/api/auth/register')) {
    document.getElementById('message').textContent = 'Account created. Now log in.';
  }
});