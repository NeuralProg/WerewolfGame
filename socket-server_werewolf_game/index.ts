// server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});
const PORT = 3001;

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

interface Player {
  id: string;        // current socket.id
  userId: string;    // persistent client id (from sessionStorage)
  userName: string;
  disconnectTimeout?: TimeoutHandle;
}

interface Session {
  players: Player[];
  nbOfPlayers: number;
  roles: string[]; // available roles to assign
  dayTime: number;
  roleAssignation: Map<string, string>; // userId -> role
  hostUserId: string; // userId of the host (creator)
  hostDisconnectTimeout?: TimeoutHandle; // timeout to delete session when host disconnects
}

const sessions: Record<string, Session> = {};

function generateCode(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

function sanitizePlayers(players: Player[]) {
  return players.map((p) => ({ id: p.id, userId: p.userId, userName: p.userName }));
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

  socket.on(
    'get-role',
    (code: string, userId: string, callback: (role: string | null) => void) => {
      const session = sessions[code];
      if (!session) {
        callback(null);
        return;
      }
      const role = session.roleAssignation.get(userId) ?? null;
      callback(role);
    }
  );

  // Create a new session (host creates)
  socket.on(
    'create-session',
    (data: { username: string; nbOfPlayers: number; roles: string[]; dayTime: number; userId: string }) => {
      if (!data.userId || !data.username) {
        socket.emit('error-message', 'Missing userId or username');
        return;
      }

      const code = generateCode();
      const player: Player = {
        id: socket.id,
        userId: data.userId,
        userName: data.username,
      };

      sessions[code] = {
        players: [player],
        nbOfPlayers: data.nbOfPlayers,
        roles: data.roles,
        dayTime: data.dayTime,
        roleAssignation: new Map<string, string>(),
        hostUserId: data.userId,
        hostDisconnectTimeout: null,
      };

      socket.join(code);
      socket.emit('session-created', code);
      io.to(code).emit('player-list', sanitizePlayers(sessions[code].players));
      console.log(`Session ${code} created by { userName: ${data.username} userId: ${data.userId} socket: ${player.id} }`);
    }
  );

  // Join (or reconnect) to a session
  socket.on('join-session', (data: { code: string; username: string; userId: string }) => {
    const session = sessions[data.code];
    if (!session) {
      socket.emit('error-message', 'Invalid session code.');
      return;
    }
    if (!data.userId || !data.username) {
      socket.emit('error-message', 'Missing userId or username.');
      return;
    }

    // Find existing player by userId
    const existing = session.players.find((p) => p.userId === data.userId);

    if (existing) {
      // Clear any pending per-player disconnect timeout
      if (existing.disconnectTimeout) {
        clearTimeout(existing.disconnectTimeout);
        existing.disconnectTimeout = undefined;
      }

      // If host had a session deletion timeout, clear it when host reconnects
      if (data.userId === session.hostUserId && session.hostDisconnectTimeout) {
        clearTimeout(session.hostDisconnectTimeout);
        session.hostDisconnectTimeout = undefined;
        console.log(`Host ${data.userId} reconnected to room ${data.code} — cleared session delete timeout.`);
      }

      existing.id = socket.id;
      existing.userName = data.username;
      existing.userId = data.userId;
      console.log(`Reconnected existing player ${data.username} (${data.userId}) in room ${data.code}`);
    } else {
      // New player joining
      if (session.players.length >= session.nbOfPlayers) {
        socket.emit('error-message', 'Session is full.');
        return;
      }
      const newPlayer: Player = {
        id: socket.id,
        userId: data.userId,
        userName: data.username,
      };
      session.players.push(newPlayer);
      io.to(data.code).emit("update_players", session.players);
      console.log(`New player ${data.username} (${data.userId}) joined room ${data.code}`);
    }

    socket.join(data.code);
    socket.emit('session-joined', data.code);
    io.to(data.code).emit('player-list', sanitizePlayers(session.players));
  });

  // Disconnect handling with timeouts
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    for (const [code, session] of Object.entries(sessions)) {
      const player = session.players.find((p) => p.id === socket.id);
      if (!player) continue;

      // If the disconnected player is the host
      if (player.userId === session.hostUserId) {
        // Start a session deletion timeout (grace period for host to reconnect)
        if (session.hostDisconnectTimeout) {
          // shouldn't happen but clear & reset
          clearTimeout(session.hostDisconnectTimeout);
        }
        console.log(`Host ${player.userId} disconnected from room ${code}. Starting session delete timeout...`);
        session.hostDisconnectTimeout = setTimeout(() => {
          // if host did not reconnect in time, delete session
          const stillSession = sessions[code];
          if (!stillSession) return;
          console.log(`Host did not reconnect — deleting entire session ${code}`);
          // clear any player timeouts
          for (const p of stillSession.players) {
            if (p.disconnectTimeout) {
              clearTimeout(p.disconnectTimeout);
              p.disconnectTimeout = undefined;
            }
          }
          delete sessions[code];
        }, 10000); // 10 seconds grace period
        // leave loop after scheduling
        break;
      }

      // Non-host player: set a per-player timeout to remove them
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
      }
      player.disconnectTimeout = setTimeout(() => {
        const sess = sessions[code];
        if (!sess) return;
        const idx = sess.players.findIndex((p) => p.userId === player.userId);
        if (idx !== -1) {
          sess.players.splice(idx, 1);
          console.log(`Player ${player.userName} (${player.userId}) removed from session ${code} after timeout`);
        }

        // If session empty after removal, delete session
        if (sess.players.length === 0) {
          delete sessions[code];
          console.log(`Session ${code} deleted (empty)`);
        } else {
          io.to(code).emit('player-list', sanitizePlayers(sess.players));
        }
      }, 10000); // 10 seconds grace period for quick reconnects

      console.log(`Player ${player.userName} (${player.userId}) disconnected from session ${code}, waiting ${10000}ms for reconnect...`);
      break; // found the player; break out of loop
    }
  });

  // Start game: assign roles and emit to players privately
  socket.on('start-game', (code: string) => {
    const session = sessions[code];
    if (!session) {
      socket.emit('error-message', 'Session not found.');
      return;
    }

    // assign roles (shuffle roles array and assign to players by order)
    session.roleAssignation.clear();
    const rolesToAssign = shuffleArray(session.roles.slice()); // clone + shuffle
    for (let i = 0; i < session.players.length && i < rolesToAssign.length; i++) {
      const p = session.players[i];
      const role = rolesToAssign[i];
      session.roleAssignation.set(p.userId, role);
      // emit role privately to connected socket
      io.to(p.id).emit('your-role', role);
    }

    io.to(code).emit('start-game');
    console.log(`Game started in room ${code}`);
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
