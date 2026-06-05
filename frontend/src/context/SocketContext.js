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
    let timer1 = null;
    let timer2 = null;
    let timer3 = null;

    const userId = user?._id;
    if (userId) {
      newSocket = io(API_URL);
      timer1 = setTimeout(() => {
        setSocket(newSocket);
      }, 0);

      newSocket.emit('join_room', userId);

      return () => {
        if (timer1) clearTimeout(timer1);
        newSocket.close();
        timer2 = setTimeout(() => {
          setSocket(null);
        }, 0);
      };
    } else {
      timer3 = setTimeout(() => {
        setSocket(null);
      }, 0);
      return () => {
        if (timer3) clearTimeout(timer3);
      };
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);