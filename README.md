🍌 Banana Duel Arena
About the Project

Banana Duel Arena is a real-time, two-player web game where players race to solve the same Banana API puzzle. The answer is kept on the server, so nobody can cheat. It was built for CIS046-3 Software for Enterprise.

Players register and log in, then play a solo practice mode or a best-of-five duel against another player. Results update an Elo rating and a public leaderboard.

Features
Feature Status
Register, log in, log out (bcrypt, server-side sessions) Done
Protected pages and protected API routes Done
Practice mode using the Banana API Done
Quick-match duel (best of 5, 30-second rounds, 3-second lockout) Done
Same puzzle sent to both players at the same moment Done
Results saved, Elo ratings (K = 32), top-20 leaderboard Done
Profile page with match history and win rate Done
API timeout (5 s), one retry and friendly error messages Done
15-second reconnect before forfeit Planned
Bonus trivia question (Open Trivia DB) Planned
Private rooms with a share code Not built
Technologies Used
Runtime: Node.js
Server: Express 4
Real-time: Socket.IO
Database: SQLite (better-sqlite3)
Sessions: express-session with a connect-sqlite3 store
Security: bcrypt, helmet, express-rate-limit, express-validator
Frontend: HTML, CSS and vanilla JavaScript
External API: Banana API (marcconrad.com/uob/banana), called only by the server
Installation

You need Node.js 20 or newer.

bash
git clone https://github.com/reeya007/Banana-Duel-Arena.git
cd Banana-Duel-Arena
npm install

Create a .env file in the project root (copy .env.example) and set a long random secret:

SESSION_SECRET=your-long-random-string
PORT=3000

Generate a secret with:

bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Start the app and open http://localhost:3000:

bash
npm start

To test a duel on one computer, log in as one user in a normal browser window and as a second user in an incognito window.

Architecture
REST over HTTP
WebSocket via Socket.IO
HTTPS and JSON
Browser: HTML, CSS,JavaScript
Express server
SQLite database
Banana API

REST is used for request-response actions (login, practice, leaderboard, profile). Socket.IO events are used for live match actions. The server is the only trusted party: it holds the answers, validates every input and decides who is logged in.

Project Structure
client/ Pages and browser scripts
js/ auth.js, practice.js, duel.js, ui.js, leaderboard.js, profile.js
server/
app.js Express setup, security headers, sessions
socket.js Socket.IO setup and session check on connect
routes/ auth, practice, leaderboard, users
middleware/ requireAuth
services/ bananaService (API calls, timeout, retry, validation)
game/ matchmaker, Match (rounds, timers, lockouts), elo, saveResult
db/ database.js and schema.sql
docs/ Test log and evidence
Security
Passwords are hashed with bcrypt (cost 12) and never stored or returned in plain text
Session cookies are HttpOnly and SameSite=Lax (Secure when deployed over HTTPS)
The session ID is regenerated on login
Login attempts are limited to 5 per 15 minutes per IP
All input is validated on the server
The puzzle solution stays in server memory and is only sent after the round ends
Socket connections are refused without a valid session, and the user ID comes from the session, never from the client
SQL uses prepared statements, and user text is inserted with textContent, not innerHTML
Secrets are kept in .env, which is listed in .gitignore
Project Status

The core features are complete: accounts, practice mode, real-time duels, Elo ratings, leaderboard and profile page. The 15-second reconnect and the bonus trivia question are planned next.

Known Limitations
Running locally uses plain HTTP, so cookies are not encrypted in transit
A single server is a single point of failure
Match state is held in memory and is lost if the server restarts
A disconnect forfeits immediately
If the Banana API is down during a duel, the server retries every 5 seconds
Credits
Puzzles come from the Banana API by Marc Conrad (marcconrad.com/uob/banana)
The project design is based on a specification shared by a senior student (Nakul)
Open-source packages: Express, Socket.IO, better-sqlite3, bcrypt, express-session, connect-sqlite3, express-validator, express-rate-limit, helmet and dotenv
Some code was drafted with help from an AI assistant (Claude, by Anthropic). It was reviewed and tested by me, and AI-assisted files are credited in their code comments
Author

Reeya
