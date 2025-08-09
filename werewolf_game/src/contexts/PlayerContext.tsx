import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getOrCreateUserId } from '../utils/ManageUserId';

type PlayerContextType = {
  userId: string;
  setUserId: (id: string) => void;
  username: string;
  setUsername: (name: string) => void;
  roomId: string;
  setRoomId: (id: string) => void;
  isHost: boolean;
  setIsHost: (b: boolean) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string>(() => sessionStorage.getItem('userId') || getOrCreateUserId());
  const [username, setUsernameState] = useState<string>(() => sessionStorage.getItem('username') || '');
  const [roomId, setRoomIdState] = useState<string>(() => sessionStorage.getItem('roomId') || '');
  const [isHost, setIsHostState] = useState<boolean>(() => (sessionStorage.getItem('isHost') === 'true'));

  useEffect(() => { sessionStorage.setItem('userId', userId); }, [userId]);
  useEffect(() => { sessionStorage.setItem('username', username); }, [username]);
  useEffect(() => { sessionStorage.setItem('roomId', roomId); }, [roomId]);
  useEffect(() => { sessionStorage.setItem('isHost', String(isHost)); }, [isHost]);

  return (
    <PlayerContext.Provider value={{
      userId, setUserId: setUserIdState,
      username, setUsername: setUsernameState,
      roomId, setRoomId: setRoomIdState,
      isHost, setIsHost: setIsHostState
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}