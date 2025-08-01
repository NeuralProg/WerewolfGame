import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});
const PORT = 3001;

interface Player {
    id: string;
    userId: string;
    userName: string;
    disconnectTimeout?: NodeJS.Timeout;
}

interface Session {
    players: Player[];
    nbOfPlayers: number;
    roles: number[];
    dayTime: number;
}

const sessions: Record<string, Session> = {};

function generateCode(length = 6): string {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

function sanitizePlayers(players: Player[]) {
    return players.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
    }));
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('get-player-list', (code: string) => {
        const session = sessions[code];
        if (session) {
            socket.emit('player-list', sanitizePlayers(session.players));
        } else {
            socket.emit('error-message', 'Lobby does not exist.');
        }
    });

    socket.on('create-session', (data: { username: string; nbOfPlayers: number; roles: number[]; dayTime: number; userId: string }) => {
        const code = generateCode();
        const player: Player = {
            id: socket.id,
            userName: data.username,
            userId: data.userId,
        };
        sessions[code] = {
            players: [player],
            nbOfPlayers: data.nbOfPlayers,
            roles: data.roles,
            dayTime: data.dayTime,
        };
        socket.join(code);
        socket.emit('session-created', code);
        io.to(code).emit('player-list', sanitizePlayers(sessions[code].players));
        console.log(`Session ${code} created by { userName: ${data.username} id: ${player.id} }`);
    });

    socket.on('join-session', (data: { code: string; username: string; userId: string }) => {
        const session = sessions[data.code];
        if (!session) {
            socket.emit('error-message', 'Invalid session code.');
            return;
        }

        let existingPlayer = session.players.find(p => p.userId === data.userId);

        if (existingPlayer) {
            if (existingPlayer.disconnectTimeout) {
                clearTimeout(existingPlayer.disconnectTimeout);
                delete existingPlayer.disconnectTimeout;
            }
            existingPlayer.id = socket.id;
            existingPlayer.userName = data.username;

        } else {
            if (session.players.length >= session.nbOfPlayers) {
                socket.emit('error-message', 'Session is full.');
                return;
            }
            const newPlayer: Player = {
                id: socket.id,
                userName: data.username,
                userId: data.userId
            };
            session.players.push(newPlayer);
        }

        socket.join(data.code);
        socket.emit('session-joined', data.code);
        io.to(data.code).emit('player-list', sanitizePlayers(session.players));
        console.log(`${data.username} joined session ${data.code}`);
    });

    socket.on('disconnect', () => {
        for (const [code, session] of Object.entries(sessions)) {
            const player = session.players.find(p => p.id === socket.id);
            if (player) {
                player.disconnectTimeout = setTimeout(() => {
                    const idx = session.players.findIndex(p => p.userId === player.userId);
                    if (idx !== -1) {
                        session.players.splice(idx, 1);
                        console.log(`Player ${player.userName} removed from session ${code} after timeout`);
                        // Change host
                    }
                    if (session.players.length <= 0) {
                        delete sessions[code];
                        console.log(`Session ${code} deleted (empty)`);
                    } else {
                        io.to(code).emit('player-list', sanitizePlayers(session.players));
                    }
                }, 10000);
                console.log(`Player ${player.userName} disconnected from session ${code}, waiting for reconnect...`);
                break;
            }
        }
        console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('start-game', (code: string) => {
        const session = sessions[code];
        if (!session) {
            socket.emit('error-message', 'Session not found.');
            return;
        }
        io.to(code).emit('start-game');
        console.log(`Game started in room ${code}`);
    });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
