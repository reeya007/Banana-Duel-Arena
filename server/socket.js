// Socket.IO setup. The session cookie is checked when a socket connects,
// and the user ID comes from the session, never from the client.
const { Server } = require('socket.io');
const matchmaker = require('./game/matchmaker');

module.exports = function setupSocket(httpServer, sessionMiddleware) {
  const io = new Server(httpServer);

  // Reuse the Express session for socket connections
  io.engine.use(sessionMiddleware);

  // Reject sockets that are not logged in
  io.use((socket, next) => {
    const sess = socket.request.session;
    if (sess && sess.userId) {
      socket.userId = sess.userId;
      socket.username = sess.username;
      return next();
    }
    next(new Error('Not logged in'));
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] connected: ${socket.username} (${socket.id})`);

    // If this user has a match in progress, put them back into it
    matchmaker.handleReconnect(socket);

    socket.on('queue:join', () => matchmaker.join(io, socket));
    socket.on('answer:submit', (data) => matchmaker.handleAnswer(socket, data));
    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected: ${socket.username}`);
      matchmaker.handleDisconnect(socket);
    });
  });
};