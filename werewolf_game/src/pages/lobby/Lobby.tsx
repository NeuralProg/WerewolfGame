import './Lobby.css';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socket } from '../../shared/socket-server/socket';
import { getOrCreateUserId } from '../../utils/ManageUserId';
import { usePlayer } from '../../contexts/PlayerContext';

type Player = { id: string; userName: string; userId: string };

function Lobby() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, setUserId, username, setUsername, roomId, setRoomId, isHost, setIsHost } = usePlayer();

    const { roomId: urlRoomId } = useParams<{ roomId: string }>();
    const [playerList, setPlayerList] = useState<Player[]>([]);
    const hasJoinedRef = useRef(false);

    // if URL changed, sync it to context (run once when urlRoomId changes)
    useEffect(() => {
        if (urlRoomId) setRoomId(urlRoomId);
    }, [urlRoomId, setRoomId]);

    // initialize context from location.state or sessionStorage and ensure userId exists
    useEffect(() => {
        // username
        if (location.state?.username) {
            setUsername(location.state.username);
            sessionStorage.setItem('username', location.state.username);
        } else {
            const stored = sessionStorage.getItem('username');
            if (stored) setUsername(stored);
        }

        // roomId (if not set from params)
        if (!roomId) {
            const storedRoom = sessionStorage.getItem('roomId');
            if (storedRoom) {
                setRoomId(storedRoom);
            }
        } else {
            sessionStorage.setItem('roomId', roomId);
        }

        // isHost
        if (location.state?.isHost !== undefined) {
            setIsHost(location.state.isHost);
            sessionStorage.setItem('isHost', String(location.state.isHost));
        } else {
            const stored = sessionStorage.getItem('isHost');
            if (stored) setIsHost(stored === 'true');
        }

        // ensure userId exists
        if (!userId) {
            const uid = getOrCreateUserId();
            setUserId(uid);
            sessionStorage.setItem('userId', uid);
        }
    }, [location.state, roomId, setRoomId, setUsername, setIsHost, setUserId, userId]);

    // socket listeners
    useEffect(() => {
        const onError = (msg: string) => {
            alert(msg);
            navigate('/');
        };
        const onPlayerList = (list: Player[]) => setPlayerList(list);
        const onStart = () => navigate(`/role/${roomId}`);

        socket.on('error-message', onError);
        socket.on('player-list', onPlayerList);
        socket.on('start-game', onStart);

        return () => {
            socket.off('error-message', onError);
            socket.off('player-list', onPlayerList);
            socket.off('start-game', onStart);
        };
    }, [navigate, roomId]);

    // emit join-session only once, when roomId & username & userId are available
    useEffect(() => {
        if (hasJoinedRef.current) return;
        if (!roomId) return;
        if (!username) return;
        if (!userId) return;

        socket.emit('join-session', { code: roomId, username: username, userId: userId });
        hasJoinedRef.current = true;
    }, [roomId, username, userId]);

    function startGame() {
        socket.emit('start-game', roomId);
    }

    return (
        <div className="lobby">
            <h1>{isHost ? 'Host Lobby' : 'Lobby'}</h1>
            <p>Share this code: <strong>{roomId}</strong></p>

            <p>Player list:</p>
            <ul>
                {playerList.map(p => (
                    <li key={p.userId || p.id}>{p.userName || '...'}</li>
                ))}
            </ul>

            {isHost && <button onClick={startGame}>Start Game</button>}
        </div>
    );
}

export default Lobby;
