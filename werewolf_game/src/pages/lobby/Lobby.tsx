import './Lobby.css';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socket } from '../../shared/socket-server/socket';
import { getOrCreateUserId } from '../../utils/ManageUserId';

type Player = {
    id: string;
    userName: string;
};
  
function Lobby() {
    const navigate = useNavigate(); nb
    const location = useLocation();
    const { roomId } = useParams<{ roomId: string }>();

    const [isHost, setIsHost] = useState<boolean>(() => {
        if (location.state?.isHost !== undefined)
            return location.state.isHost;
        const stored = sessionStorage.getItem('isHost');
        return stored === 'true';
    });

    const [username, setUsername] = useState<string>(() => {
        if (location.state?.username)
            return location.state.username;
        const stored = sessionStorage.getItem('username');
        return stored || '';
    });

    const [playerList, setPlayerList] = useState<Player[]>([]);

    useEffect(() => {
        if (!roomId) {
            const storedRoomId = sessionStorage.getItem('roomId');
            if (storedRoomId) {
                navigate(`/lobby/${storedRoomId}`, { replace: true });
                return;
            }
            alert('Invalid room code');
            navigate('/');
            return;
        }

        const userId = getOrCreateUserId();
        socket.emit('join-session', {
            code: roomId,
            username,
            userId,
        });

        const onError = (msg: string) => {
            alert(msg);
            navigate('/');
        };
        socket.on('error-message', onError);

        const onPlayerList = (list: Player[]) => {
            setPlayerList(list);
        };
        socket.on('player-list', onPlayerList);

        const handleStartGame = () => {
            navigate(`/role/${roomId}`);
        };
        socket.on('start-game', handleStartGame);

        return () => {
            socket.off('error-message', onError);
            socket.off('player-list', onPlayerList);
        };
    }, [roomId, navigate, username]);

    console.log(sessionStorage, playerList);

    function startGame() {
        socket.emit('start-game', roomId);
    }

    return (
        <div className="lobby">
            <h1>{isHost ? 'Host Lobby' : 'Lobby'}</h1>
            <p>
                Share this code: <strong>{roomId}</strong>
            </p>
            <p>Player list:</p>
            <ul>
                {playerList.map((player) => (
                    <li key={player.id}>{player.userName}</li>
                ))}
            </ul>

            <h4>Settings of the game and rules (cards, nb player, vote time, stats)</h4>
            <h4>Players display (list)</h4>
            {isHost && <button onClick={startGame}>Start Game</button>}
            <h4>Rules</h4>
        </div>
    );
}

export default Lobby;
