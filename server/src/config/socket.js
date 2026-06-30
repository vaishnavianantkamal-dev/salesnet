'use strict';

const { Server } = require('socket.io');
const config = require('./env');
const { verifyAccessToken } = require('../utils/token');
const logger = require('../utils/logger');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.userId || socket.user?._id || socket.user?.id;
    const roleKey = socket.user?.roleKey || socket.user?.role;
    logger.info(`Socket connected: socketId=${socket.id}, userId=${userId}, role=${roleKey}`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (roleKey === 'super_admin') {
      socket.join('role:super_admin');
    }

    socket.on('join:lead', (leadId) => {
      if (leadId) {
        socket.join(`lead:${leadId}`);
        logger.debug(`Socket ${socket.id} joined lead:${leadId}`);
      }
    });

    socket.on('leave:lead', (leadId) => {
      if (leadId) {
        socket.leave(`lead:${leadId}`);
        logger.debug(`Socket ${socket.id} left lead:${leadId}`);
      }
    });

    socket.on('join:room', (room) => {
      if (room) {
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room:${room}`);
      }
    });

    socket.on('leave:room', (room) => {
      if (room) {
        socket.leave(room);
        logger.debug(`Socket ${socket.id} left room:${room}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: socketId=${socket.id}, userId=${userId}, reason=${reason}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

const emitToLead = (leadId, event, data) => {
  if (!io) return;
  io.to(`lead:${leadId}`).emit(event, data);
};

const emitToRole = (roleKey, event, data) => {
  if (!io) return;
  io.to(`role:${roleKey}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToLead, emitToRole, emitToAll };
