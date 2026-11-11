import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, '.data');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface SavedAccountRecord {
  code: string;
  updatedAt: number;
  state: Record<string, unknown>;
}

function loadSavesFromDisk(): Record<string, SavedAccountRecord> {
  try {
    if (fs.existsSync(SAVES_FILE)) {
      const raw = fs.readFileSync(SAVES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read saves file:', err);
  }
  return {};
}

function writeSavesToDisk(saves: Record<string, SavedAccountRecord>) {
  try {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write saves file:', err);
  }
}

const accountSaves: Record<string, SavedAccountRecord> = loadSavesFromDisk();

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Multiplayer Room State (Server-Authoritative)
interface RoomPlayer {
  id: string;
  alias: string;
  chips: number;
  cash: number;
  vipTier: string;
  activeGame: string;
  avatarColor: string;
  ws: WebSocket;
}

interface RoomFeedEvent {
  id: string;
  timestamp: number;
  playerAlias: string;
  game: string;
  wager: number;
  multiplier: number;
  payout: number;
  summary: string;
}

interface RoomDuel {
  id: string;
  creatorId: string;
  creatorAlias: string;
  gameType: 'DICE_DUEL' | 'HIGH_CARD_HOLDEM' | 'ROULETTE_CLASH';
  stake: number;
  status: 'OPEN' | 'RESOLVED';
  challengerId?: string;
  challengerAlias?: string;
  winnerId?: string;
  winnerAlias?: string;
  resultSummary?: string;
  details?: {
    creatorRoll: number;
    challengerRoll: number;
  };
  createdAt: number;
}

interface RoomChatMessage {
  id: string;
  timestamp: number;
  senderId: string;
  senderAlias: string;
  vipTier: string;
  avatarColor: string;
  text: string;
  isSystem?: boolean;
}

interface MultiplayerRoom {
  code: string;
  players: Map<string, RoomPlayer>;
  feed: RoomFeedEvent[];
  duels: RoomDuel[];
  chatMessages: RoomChatMessage[];
  sharedRouletteHistory: number[];
}

const rooms = new Map<string, MultiplayerRoom>();

function getOrCreateRoom(code: string): MultiplayerRoom {
  const normalized = code.trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      code: normalized,
      players: new Map(),
      feed: [
        {
          id: 'welcome-1',
          timestamp: Date.now(),
          playerAlias: 'Velvet Floor Pitboss',
          game: 'Lounge',
          wager: 0,
          multiplier: 1,
          payout: 0,
          summary: `Room ${normalized} opened. Share code ${normalized} with friends to gamble together.`,
        },
      ],
      duels: [],
      chatMessages: [
        {
          id: 'chat-welcome-1',
          timestamp: Date.now(),
          senderId: 'system',
          senderAlias: 'Floor Host',
          vipTier: 'House',
          avatarColor: '#10b981',
          text: `Welcome to Room ${normalized}! Chat with friends and watch live table action here.`,
          isSystem: true,
        },
      ],
      sharedRouletteHistory: [0, 32, 15, 19, 4, 21, 2, 25],
    };
    rooms.set(normalized, room);
  }
  return room;
}

function serializeRoom(room: MultiplayerRoom) {
  return {
    code: room.code,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      alias: p.alias,
      chips: p.chips,
      cash: p.cash,
      vipTier: p.vipTier,
      activeGame: p.activeGame,
      avatarColor: p.avatarColor,
    })),
    feed: room.feed.slice(0, 30),
    duels: room.duels.slice(0, 15),
    chatMessages: room.chatMessages.slice(-50),
    sharedRouletteHistory: room.sharedRouletteHistory.slice(0, 12),
  };
}

function broadcastRoomState(room: MultiplayerRoom) {
  const payload = JSON.stringify({
    type: 'room:state',
    room: serializeRoom(room),
  });
  for (const player of room.players.values()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

function broadcastToRoom(room: MultiplayerRoom, message: Record<string, unknown>) {
  const payload = JSON.stringify(message);
  for (const player of room.players.values()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Save Account via Code
  app.post('/api/save', (req, res) => {
    const { code: existingCode, state } = req.body || {};
    if (!state || typeof state !== 'object') {
      res.status(400).json({ error: 'Invalid account state payload' });
      return;
    }

    let saveCode =
      typeof existingCode === 'string' && existingCode.trim().length >= 4
        ? existingCode.trim().toUpperCase()
        : '';

    if (!saveCode) {
      saveCode = `VLV-${generateCode(6)}`;
      while (accountSaves[saveCode]) {
        saveCode = `VLV-${generateCode(6)}`;
      }
    }

    accountSaves[saveCode] = {
      code: saveCode,
      updatedAt: Date.now(),
      state,
    };
    writeSavesToDisk(accountSaves);

    res.json({
      ok: true,
      code: saveCode,
      updatedAt: accountSaves[saveCode].updatedAt,
    });
  });

  // Load Account via Code
  app.get('/api/save/:code', (req, res) => {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    const record = accountSaves[rawCode] || accountSaves[`VLV-${rawCode}`];
    if (!record) {
      res.status(404).json({ error: 'Save code not found. Double-check your code or import a JSON backup.' });
      return;
    }
    res.json({
      ok: true,
      code: record.code,
      updatedAt: record.updatedAt,
      state: record.state,
    });
  });

  // Health & Active Rooms Snapshot
  app.get('/api/rooms', (_req, res) => {
    const activeRooms = Array.from(rooms.values())
      .filter((r) => r.players.size > 0)
      .map((r) => ({
        code: r.code,
        playerCount: r.players.size,
        openDuels: r.duels.filter((d) => d.status === 'OPEN').length,
      }));
    res.json({ rooms: activeRooms });
  });

  const httpServer = createServer(app);

  // Attach WebSocket Server on /ws
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'room:join') {
          const roomCode = (msg.roomCode || 'VELVET').toString().trim().toUpperCase().slice(0, 10);
          const playerId = (msg.playerId || `p-${generateCode(6)}`).toString();

          // Leave old room if switching
          if (currentRoomCode && currentPlayerId && currentRoomCode !== roomCode) {
            const oldRoom = rooms.get(currentRoomCode);
            if (oldRoom) {
              oldRoom.players.delete(currentPlayerId);
              broadcastRoomState(oldRoom);
            }
          }

          currentRoomCode = roomCode;
          currentPlayerId = playerId;

          const room = getOrCreateRoom(roomCode);
          const existing = room.players.get(playerId);
          room.players.set(playerId, {
            id: playerId,
            alias: (msg.alias || 'High Roller').toString().slice(0, 24),
            chips: typeof msg.chips === 'number' ? msg.chips : 1000,
            cash: typeof msg.cash === 'number' ? msg.cash : 0,
            vipTier: (msg.vipTier || 'Member').toString(),
            activeGame: (msg.activeGame || 'Lobby').toString(),
            avatarColor: (msg.avatarColor || '#d4af37').toString(),
            ws,
          });

          if (!existing) {
            room.feed.unshift({
              id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              playerAlias: (msg.alias || 'High Roller').toString().slice(0, 24),
              game: 'Lounge',
              wager: 0,
              multiplier: 1,
              payout: 0,
              summary: `${(msg.alias || 'High Roller').toString().slice(0, 24)} joined room ${roomCode}`,
            });
          }

          broadcastRoomState(room);
        } else if (msg.type === 'player:sync') {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          if (typeof msg.alias === 'string') player.alias = msg.alias.slice(0, 24);
          if (typeof msg.chips === 'number') player.chips = msg.chips;
          if (typeof msg.cash === 'number') player.cash = msg.cash;
          if (typeof msg.vipTier === 'string') player.vipTier = msg.vipTier;
          if (typeof msg.activeGame === 'string') player.activeGame = msg.activeGame;
          broadcastRoomState(room);
        } else if (msg.type === 'game:broadcast') {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          const eventId = (msg.id || `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).toString();

          if (!room.feed.some((e) => e.id === eventId)) {
            room.feed.unshift({
              id: eventId,
              timestamp: Date.now(),
              playerAlias: player ? player.alias : (msg.playerAlias || 'Player'),
              game: (msg.game || 'Table').toString(),
              wager: Number(msg.wager) || 0,
              multiplier: Number(msg.multiplier) || 0,
              payout: Number(msg.payout) || 0,
              summary: (msg.summary || '').toString().slice(0, 140),
            });
            if (room.feed.length > 40) room.feed.length = 40;
          }

          if (typeof msg.rouletteNumber === 'number') {
            room.sharedRouletteHistory.unshift(msg.rouletteNumber);
            if (room.sharedRouletteHistory.length > 15) room.sharedRouletteHistory.length = 15;
          }

          broadcastRoomState(room);
        } else if (msg.type === 'chat:send') {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          const text = (msg.text || '').toString().trim().slice(0, 240);
          if (!text) return;

          const chatMsg: RoomChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            senderId: currentPlayerId,
            senderAlias: player ? player.alias : (msg.alias || 'Player').toString().slice(0, 24),
            vipTier: player ? player.vipTier : 'Member',
            avatarColor: player ? player.avatarColor : '#fbbf24',
            text,
          };

          room.chatMessages.push(chatMsg);
          if (room.chatMessages.length > 60) {
            room.chatMessages = room.chatMessages.slice(-60);
          }
          broadcastRoomState(room);
        } else if (msg.type === 'duel:create') {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          const stake = Math.max(50, Math.round(Number(msg.stake) || 100));
          const duelId = `duel-${Date.now()}-${generateCode(4)}`;
          const gameType =
            msg.gameType === 'HIGH_CARD_HOLDEM' || msg.gameType === 'ROULETTE_CLASH'
              ? msg.gameType
              : 'DICE_DUEL';

          const newDuel: RoomDuel = {
            id: duelId,
            creatorId: player.id,
            creatorAlias: player.alias,
            gameType,
            stake,
            status: 'OPEN',
            createdAt: Date.now(),
          };
          room.duels.unshift(newDuel);

          room.feed.unshift({
            id: `feed-${duelId}`,
            timestamp: Date.now(),
            playerAlias: player.alias,
            game: 'Friend Duel',
            wager: stake,
            multiplier: 2,
            payout: stake * 2,
            summary: `${player.alias} posted a ${stake.toLocaleString()} chip ${gameType.replace(/_/g, ' ')} challenge!`,
          });

          broadcastRoomState(room);
        } else if (msg.type === 'duel:accept') {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const duel = room.duels.find((d) => d.id === msg.duelId && d.status === 'OPEN');
          if (!duel) return;

          const challenger = room.players.get(currentPlayerId);
          const isHouseChallenger = msg.vsHouseChallenger === true;

          const challengerId = isHouseChallenger ? 'velvet-vip-challenger' : challenger?.id || 'challenger';
          const challengerAlias = isHouseChallenger
            ? 'Donatello (VIP High Roller)'
            : challenger?.alias || 'Friend';

          // Authoritative roll (with slight edge when challenging Donatello VIP so it's never too easy)
          let creatorScore = Math.floor(Math.random() * 100) + 1;
          let challengerScore = Math.floor(Math.random() * 100) + 1;
          if (isHouseChallenger && Math.random() < 0.08) {
            challengerScore = Math.min(100, creatorScore + Math.floor(Math.random() * 12) + 1);
          }
          if (creatorScore === challengerScore) {
            challengerScore = creatorScore > 50 ? creatorScore - 1 : creatorScore + 1;
          }

          const creatorWon = creatorScore > challengerScore;
          duel.status = 'RESOLVED';
          duel.challengerId = challengerId;
          duel.challengerAlias = challengerAlias;
          duel.winnerId = creatorWon ? duel.creatorId : challengerId;
          duel.winnerAlias = creatorWon ? duel.creatorAlias : challengerAlias;
          duel.details = {
            creatorRoll: creatorScore,
            challengerRoll: challengerScore,
          };
          duel.resultSummary = `${duel.winnerAlias} won ${(duel.stake * 2).toLocaleString()} chips (${creatorScore} vs ${challengerScore})`;

          room.feed.unshift({
            id: `res-${duel.id}`,
            timestamp: Date.now(),
            playerAlias: duel.winnerAlias,
            game: 'Friend Duel',
            wager: duel.stake,
            multiplier: 2,
            payout: duel.stake * 2,
            summary: duel.resultSummary,
          });

          broadcastToRoom(room, {
            type: 'duel:resolved',
            duel,
          });
          broadcastRoomState(room);
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && currentPlayerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentPlayerId);
          broadcastRoomState(room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Velvet Originals Server listening on http://localhost:${PORT}`);
  });
}

startServer();
