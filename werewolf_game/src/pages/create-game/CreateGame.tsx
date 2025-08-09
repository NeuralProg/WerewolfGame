import './CreateGame.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../shared/socket-server/socket';
import { getOrCreateUserId } from '../../utils/ManageUserId';

import { MIN_PLAYERS, MAX_PLAYERS, ROLES, ROLES_MAX, DAY_TIME_RANGE, DEFAULT_DAY_TIME } from "../../config/GameConfig";
import SecondaryButton from '../../shared/secondary-button/SecondaryButton';
import RoleCard from './components/role-card/RoleCard';
import DayTimeSlider from './components/day-time-slider/DayTimeSlider';

import { usePlayer } from '../../contexts/PlayerContext';

function CreateGame() {
    const navigate = useNavigate();
    const { setUserId, setUsername, setRoomId, setIsHost } = usePlayer();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeRoles, setActiveRoles] = useState<number[]>(
        () => Array(ROLES.length).fill(0)
    );
    const nbOfPlayers = activeRoles.reduce((acc, v) => acc + v, 0);

    const [dayTime, setDayTime] = useState(DEFAULT_DAY_TIME);
    const [usernameLocal, setUsernameLocal] = useState('');

    useEffect(() => {
        const onSessionCreated = (generatedCode: string) => {
            // Set context + sessionStorage so Lobby can rehydrate
            setRoomId(generatedCode);
            setIsHost(true);
            setUsername(usernameLocal);
            const uid = getOrCreateUserId();
            setUserId(uid);
            sessionStorage.setItem('roomId', generatedCode);
            sessionStorage.setItem('username', usernameLocal);
            sessionStorage.setItem('isHost', 'true');
            sessionStorage.setItem('userId', uid);

            navigate(`/lobby/${generatedCode}`, { state: { isHost: true, username: usernameLocal } });
        };
        socket.on('session-created', onSessionCreated);
        return () => { socket.off('session-created', onSessionCreated); };
    }, [navigate, setRoomId, setIsHost, setUsername, setUserId, usernameLocal]);

    function editRoleCount(idx: number, delta: number) {
        setActiveRoles(prev => {
            const copy = [...prev];
            if (
                (delta < 0 && copy[idx] <= 0) ||
                (delta > 0 && copy[idx] >= ROLES_MAX[idx]) ||
                idx < 0 || idx >= ROLES.length ||
                nbOfPlayers + delta > MAX_PLAYERS
            ) return copy;
            copy[idx] += delta;
            return copy;
        });
    }

    function createOnlineSession() {
        if (nbOfPlayers < MIN_PLAYERS || nbOfPlayers > MAX_PLAYERS) {
            setErrorMessage(`Number of players should be between ${MIN_PLAYERS} and ${MAX_PLAYERS}!`);
            return;
        }
        if (activeRoles[0] <= 0) {
            setErrorMessage('There is no werewolf in the game!');
            return;
        }
        if (usernameLocal.length <= 0 || usernameLocal.length > 15) {
            setErrorMessage('Username must be between 1 and 15 characters!');
            return;
        }

        setErrorMessage(null);

        const uid = getOrCreateUserId();
        setUserId(uid);
        setUsername(usernameLocal);
        setIsHost(true);
        sessionStorage.setItem('userId', uid);
        sessionStorage.setItem('username', usernameLocal);
        sessionStorage.setItem('isHost', 'true');

        const strGameRolesList: string[] = [];
        for (let i = 0; i < ROLES.length; i++) {
            for (let x = 0; x < activeRoles[i]; x++) {
                strGameRolesList.push(ROLES[i]);
            }
        }

        socket.emit('create-session', {
            username: usernameLocal,
            nbOfPlayers,
            roles: strGameRolesList,
            dayTime,
            userId: uid
        });
        console.log('Creating online session with roles:', strGameRolesList);
        // server will emit 'session-created' which we handle above
    }

    return (
        <div className="create-game">
            <Container className="create-game-container">
                <div className="role-cards-selection">
                    {ROLES.map((_, idx) => (
                        <RoleCard
                            key={idx}
                            idx={idx}
                            roles={ROLES}
                            rolesMax={ROLES_MAX}
                            activeRoles={activeRoles}
                            editRoleCount={editRoleCount}
                            maxNbPlayers={MAX_PLAYERS}
                        />
                    ))}
                </div>

                <Row className="game-stats-line gx-3 gy-2">
                    <Col xs={12} md={4} className="game-stat game-stat-day-duration">
                        <DayTimeSlider dayTimeRange={DAY_TIME_RANGE} dayTime={dayTime} setDayTime={setDayTime} />
                    </Col>

                    <Col xs={12} md={4} className="game-stat text-center d-flex align-items-center justify-content-center">
                        <p className="game-stat-nb-players mb-0">{nbOfPlayers} Players</p>
                    </Col>

                    <Col xs={12} md={4} className="game-stat">
                        <input
                            className="form-control form-control-lg w-100"
                            type="text"
                            placeholder="Username"
                            aria-label="Username text area"
                            value={usernameLocal}
                            onChange={(e) => setUsernameLocal(e.target.value)}
                            maxLength={15}
                        />
                    </Col>
                </Row>

                {errorMessage && (
                    <Alert className="py-2 px-3 mt-5 mb-0" variant="info" dismissible onClose={() => setErrorMessage(null)}>
                        <p>{errorMessage}</p>
                    </Alert>
                )}

                <div className="create-game-button">
                    <SecondaryButton text={'Create new game'} action={createOnlineSession} />
                </div>
            </Container>
        </div>
    );
}

export default CreateGame;
