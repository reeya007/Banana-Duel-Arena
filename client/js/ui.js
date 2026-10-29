// Shared helpers used by several pages.
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

async function showWelcome() {
  const el = document.getElementById('welcome');
  if (!el) return;
  const res = await fetch('/api/auth/me');
  if (res.ok) el.textContent = 'Welcome, ' + (await res.json()).username;
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);
showWelcome();