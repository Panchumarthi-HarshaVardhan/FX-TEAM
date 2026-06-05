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
    let newSocket = null;
    const userId = user?._id;
    if (userId) {
      newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.emit('join_room', userId);

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);