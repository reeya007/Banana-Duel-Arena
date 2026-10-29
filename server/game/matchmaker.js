// Quick match queue: the first player waits, the second player starts a match with them.
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

function handleDisconnect(socket) {
  if (waiting && waiting.id === socket.id) waiting = null;
  const match = getMatch(socket);
  if (match) match.forfeit(socket);
}

module.exports = { join, handleAnswer, handleDisconnect };