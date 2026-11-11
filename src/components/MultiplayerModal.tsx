import React, { useState } from 'react';
import { PlayerAccountState } from '../game/rules';
import { soundEngine } from '../game/sound';

export interface RoomPlayerView {
  id: string;
  alias: string;
  chips: number;
  cash: number;
  vipTier: string;
  activeGame: string;
  avatarColor: string;
}

export interface RoomFeedItem {
  id: string;
  timestamp: number;
  playerAlias: string;
  game: string;
  wager: number;
  multiplier: number;
  payout: number;
  summary: string;
}

export interface RoomDuelItem {
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
}

interface MultiplayerModalProps {
  account: PlayerAccountState;
  roomCode: string;
  wsConnected: boolean;
  players: RoomPlayerView[];
  feed: RoomFeedItem[];
  duels: RoomDuelItem[];
  onClose: () => void;
  onJoinRoomCode: (newCode: string) => void;
  onUpdateAlias: (newAlias: string) => void;
  onCreateDuel: (gameType: 'DICE_DUEL' | 'HIGH_CARD_HOLDEM' | 'ROULETTE_CLASH', stake: number) => void;
  onAcceptDuel: (duelId: string, vsHouseChallenger?: boolean) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  account,
  roomCode,
  wsConnected,
  players,
  feed,
  duels,
  onClose,
  onJoinRoomCode,
  onUpdateAlias,
  onCreateDuel,
  onAcceptDuel,
}) => {
  const [roomInput, setRoomInput] = useState<string>(roomCode);
  const [aliasInput, setAliasInput] = useState<string>(account.alias);
  const [duelStake, setDuelStake] = useState<number>(250);
  const [duelType, setDuelType] = useState<'DICE_DUEL' | 'HIGH_CARD_HOLDEM' | 'ROULETTE_CLASH'>('DICE_DUEL');
  const [copiedRoom, setCopiedRoom] = useState<boolean>(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Multiplayer High-Roller Lounge"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-[#0a1712] border border-emerald-500/35 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#07110d] border-b border-emerald-500/20 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-400">
              Real-Time WebSocket Room · Status: {wsConnected ? 'Connected' : 'Reconnecting'}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              MULTIPLAYER LOUNGE &amp; FRIEND DUELS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Multiplayer Modal"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[72vh] overflow-y-auto">
          {/* Left Column: Room Code & Connected Friends */}
          <div className="lg:col-span-5 space-y-5">
            {/* Room Code Switcher */}
            <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Active Room Code</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-mono-tabular font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  {copiedRoom ? 'Copied Code ✓' : `Copy "${roomCode}"`}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label="Room Code"
                  maxLength={10}
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3 py-2 font-mono-tabular text-sm font-bold text-white uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (roomInput.trim()) {
                      soundEngine.playChipClick();
                      onJoinRoomCode(roomInput.trim().toUpperCase());
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  Join / Create
                </button>
              </div>
            </div>

            {/* Player Alias */}
            <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-4 space-y-2">
              <label htmlFor="player-alias-input" className="block text-xs font-semibold text-slate-300">
                Your Table Alias
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="player-alias-input"
                  type="text"
                  maxLength={22}
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3 py-2 text-xs font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (aliasInput.trim()) {
                      onUpdateAlias(aliasInput.trim());
                      soundEngine.playChipClick();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Connected Players in Room */}
            <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-4 space-y-3">
              <div className="text-xs font-semibold text-emerald-300">
                Players in Room {roomCode} ({players.length})
              </div>
              <div className="space-y-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0c1d16] border border-emerald-500/15 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {p.alias} {p.id === account.playerId ? '(You)' : ''}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.vipTier} · Playing {p.activeGame}
                      </div>
                    </div>
                    <div className="font-mono-tabular font-bold text-amber-300">
                      {p.chips.toLocaleString()} Chips
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Head-to-Head Friend Wagers & Live Room Feed */}
          <div className="lg:col-span-7 space-y-5">
            {/* Post a Friend Duel Wager */}
            <div className="rounded-2xl bg-[#07110d] border border-amber-500/30 p-5 space-y-4">
              <div>
                <h3 className="font-display text-base font-bold text-amber-300">
                  Post Head-to-Head Friend Wager (Winner Takes 2X Pot)
                </h3>
                <p className="text-xs text-slate-400">
                  Create a live chip wager in Room {roomCode}. Any friend in this room can accept, or you can test immediately against Donatello (VIP High Roller).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="duel-type" className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Duel Format
                  </label>
                  <select
                    id="duel-type"
                    value={duelType}
                    onChange={(e) => setDuelType(e.target.value as typeof duelType)}
                    className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3 py-2 text-xs font-bold text-white"
                  >
                    <option value="DICE_DUEL">Brass Dice High-Roller Duel</option>
                    <option value="HIGH_CARD_HOLDEM">Texas Hold&apos;em Showdown</option>
                    <option value="ROULETTE_CLASH">Roulette Precision Spin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="duel-stake" className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Stake (Chips)
                  </label>
                  <input
                    id="duel-stake"
                    type="number"
                    min={50}
                    value={duelStake}
                    onChange={(e) => setDuelStake(Math.max(50, Math.round(Number(e.target.value) || 0)))}
                    className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3 py-2 font-mono-tabular text-xs font-bold text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playChipClick();
                  onCreateDuel(duelType, duelStake);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Post {duelStake.toLocaleString()} Chip Challenge to Room {roomCode}
              </button>

              {/* Active & Resolved Duels */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-300">Room Challenges</div>
                {duels.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    No active friend challenges yet. Post one above!
                  </div>
                ) : (
                  duels.slice(0, 5).map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0c1d16] border border-emerald-500/20 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {d.creatorAlias} · {d.gameType.replace(/_/g, ' ')} ({d.stake.toLocaleString()} Chips)
                        </div>
                        <div className="text-[11px] text-emerald-300">
                          {d.status === 'OPEN' ? 'Waiting for challenger...' : d.resultSummary}
                        </div>
                      </div>
                      {d.status === 'OPEN' && (
                        <div className="flex items-center gap-2">
                          {d.creatorId !== account.playerId && (
                            <button
                              type="button"
                              onClick={() => onAcceptDuel(d.id, false)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Accept Duel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onAcceptDuel(d.id, true)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 font-semibold text-xs cursor-pointer"
                          >
                            Roll vs VIP Challenger
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Room Table Feed */}
            <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-4 space-y-2.5">
              <div className="text-xs font-semibold text-emerald-300">Live Room Action Feed</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {feed.map((ev) => (
                  <div
                    key={ev.id}
                    className="px-3 py-1.5 rounded-lg bg-[#0c1d16] text-xs text-slate-300 flex items-center justify-between gap-2"
                  >
                    <span>{ev.summary}</span>
                    <span className="font-mono-tabular text-[10px] text-slate-500 shrink-0">
                      {ev.game}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
