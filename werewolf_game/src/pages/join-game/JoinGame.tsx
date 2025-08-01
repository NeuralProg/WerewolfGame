import './JoinGame.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

import { GAME_CODE_LENGTH } from "../../config/GameConfig.ts";
import SecondaryButton from '../../shared/secondary-button/SecondaryButton';

function JoinGame() {
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [gameCode, setGameCode] = useState('');
    const [username, setUsername] = useState('');

    const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGameCode(e.target.value);
    };
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

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

        sessionStorage.setItem('roomId', gameCode.toUpperCase());
        sessionStorage.setItem('isHost', 'false');
        sessionStorage.setItem('username', username);

        navigate(`/lobby/${gameCode.toUpperCase()}`, { state: { isHost: false, username } });
    }

    return (
        <div className="JoinGame">
            <input
                className="form-control form-control-lg w-100"
                type="text"
                placeholder="Game Code"
                aria-label="Game code text area"
                value={gameCode}
                onChange={handleGameCodeChange}
            />

            <input
                className="form-control form-control-lg w-100"
                type="text"
                placeholder="Username"
                aria-label="Username text area"
                value={username}
                onChange={handleUsernameChange}
            />

            {errorMessage && (
                <Alert className="py-2 px-3 mt-5 mb-0" variant="info" dismissible onClose={() => setErrorMessage(null)}>
                    <p>{errorMessage}</p>
                </Alert>
            )}

            <SecondaryButton text="Join Game" action={joinOnlineSession} />

            <h1>JoinGame</h1>
            <h4>Game code entry (Textbox) (mandatory)</h4>
            <h4>Game Pseudo (Textbox) (mandatory)</h4>
            <h4>Join Game (button)</h4>
        </div>
    );
}

export default JoinGame;
