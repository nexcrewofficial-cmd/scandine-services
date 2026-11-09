import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
    });
  }
  return socket;
};
