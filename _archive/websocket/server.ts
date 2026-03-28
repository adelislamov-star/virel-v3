// WEBSOCKET SERVER
// Realtime updates for Action Center

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initWebSocket(httpServer: HTTPServer) {
  if (io) return io;
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join user room
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room`);
    }
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Notify specific user
 */
export function notifyUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}

/**
 * Notify Action Center about new task
 */
export function notifyActionCenter(userId: string, update: any) {
  notifyUser(userId, 'action_center:update', update);
}
