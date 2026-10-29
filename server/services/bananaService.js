// Talks to the Banana API. Only the SERVER calls it, so the solution never reaches the browser.
const API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';

async function fetchOnce() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  const start = Date.now();
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    console.log(`[Banana API] ${new Date().toISOString()} status=${res.status} time=${Date.now() - start}ms`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const solution = Number(data.solution);
    if (!data.question || !Number.isInteger(solution) || solution < 0 || solution > 9) {
      throw new Error('Unexpected data from Banana API');
    }
    return { image: data.question, solution };
  } finally {
    clearTimeout(timer);
  }
}

// Try once, retry once, then let the error go up to be handled
async function getPuzzle() {
  try {
    return await fetchOnce();
  } catch (err) {
    console.warn('[Banana API] failed, retrying once:', err.message);
    return await fetchOnce();
  }
}

module.exports = { getPuzzle };