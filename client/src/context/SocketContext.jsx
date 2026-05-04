import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // VITE_SOCKET_URL points at the Socket.IO endpoint.
    //   - Node server: socket runs on the same port as HTTP → leave unset (proxied by Vite)
    //   - Spring Boot: socket runs on a separate port (default 9092) → set to http://localhost:9092
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('onlineStatus', ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
