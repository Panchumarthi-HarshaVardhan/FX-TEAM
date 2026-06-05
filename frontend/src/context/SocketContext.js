'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '@/utils/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();


  useEffect(() => {
    if (user) {
      const newSocket = io(API_URL);
      const timer = setTimeout(() => {
        setSocket(newSocket);
      }, 0);

      newSocket.emit('join_room', user._id);

      return () => {
        clearTimeout(timer);
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        const timer = setTimeout(() => {
          setSocket(null);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);