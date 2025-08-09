import './JoinGame.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

import { GAME_CODE_LENGTH } from "../../config/GameConfig";
import SecondaryButton from '../../shared/secondary-button/SecondaryButton';

function JoinGame() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [gameCode, setGameCode] = useState('');
    const [username, setUsername] = useState('');

    const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => setGameCode(e.target.value);
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value);

    function joinOnlineSession() {
        if (!gameCode || gameCode.length !== GAME_CODE_LENGTH) {
            setErrorMessage('Invalid game code!');
            return;
        }
        if (username.length <= 0 || username.length > 15) {
            setErrorMessage('Invalid username!');
            return;
        }
        setErrorMessage(null);
        // we only navigate to lobby; Lobby will read location.state and sessionStorage to join properly
        navigate(`/lobby/${gameCode.toUpperCase()}`, { state: { isHost: false, username } });
    }

    return (
        <div className="JoinGame">
            <input className="form-control form-control-lg w-100" type="text" placeholder="Game Code" value={gameCode} onChange={handleGameCodeChange} />
            <input className="form-control form-control-lg w-100" type="text" placeholder="Username" value={username} onChange={handleUsernameChange} />

            {errorMessage && (
                <Alert className="py-2 px-3 mt-5 mb-0" variant="info" dismissible onClose={() => setErrorMessage(null)}>
                    <p>{errorMessage}</p>
                </Alert>
            )}

            <SecondaryButton text="Join Game" action={joinOnlineSession} />
        </div>
    );
}

export default JoinGame;
