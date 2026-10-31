const Match = require('./Match');

let waiting = null;          // socket of the player waiting for an opponent
const matches = new Map();   // roomId -> Match
const userRoom = new Map();  // userId -> roomId
let counter = 0;

function join(io, socket) {
  if (userRoom.has(socket.userId)) {
    return socket.emit('error:msg', { message: 'You are already in a match' });
  }
  if (waiting && waiting.id === socket.id) return;
  if (!waiting || !waiting.connected) {
    waiting = socket;
    return socket.emit('queue:waiting');
  }
  if (waiting.userId === socket.userId) {
    return socket.emit('error:msg', { message: 'You are already waiting in another tab' });
  }

  const first = waiting;
  waiting = null;
  const roomId = `room-${++counter}`;
  const match = new Match(io, roomId, first, socket, (m) => {
    m.players.forEach((p) => userRoom.delete(p.userId));
    matches.delete(roomId);
  });
  matches.set(roomId, match);
  userRoom.set(first.userId, roomId);
  userRoom.set(socket.userId, roomId);
  match.start();
}

function getMatch(socket) {
  return matches.get(userRoom.get(socket.userId));
}

function handleAnswer(socket, data) {
  const match = getMatch(socket);
  if (match) match.submit(socket, data && data.answer);
}

// A socket dropped: the match starts a reconnect countdown instead of forfeiting at once
function handleDisconnect(socket) {
  if (waiting && waiting.id === socket.id) waiting = null;
  const match = getMatch(socket);
  if (match) match.playerDisconnected(socket);
}

// A logged-in user connected: if they have a running match, put them back in it
function handleReconnect(socket) {
  const match = getMatch(socket);
  return match ? match.rejoin(socket) : false;
}

module.exports = { join, handleAnswer, handleDisconnect, handleReconnect };