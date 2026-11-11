import React, { useState } from 'react';
import { PlayerAccountState } from '../game/rules';
import { soundEngine } from '../game/sound';
import { RoomDuelItem, RoomFeedItem, RoomPlayerView } from './MultiplayerModal';

export interface RoomChatItem {
  id: string;
  timestamp: number;
  senderId: string;
  senderAlias: string;
  vipTier: string;
  avatarColor: string;
  text: string;
  isSystem?: boolean;
}

interface SideChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  account: PlayerAccountState;
  roomCode: string;
  wsConnected: boolean;
  players: RoomPlayerView[];
  chatMessages: RoomChatItem[];
  feed: RoomFeedItem[];
  duels: RoomDuelItem[];
  onSendChat: (text: string) => void;
  onJoinRoomCode: (code: string) => void;
  onCreateQuickDuel: (stake: number) => void;
  onAcceptDuel: (duelId: string, vsHouse?: boolean) => void;
}

export const SideChatDrawer: React.FC<SideChatDrawerProps> = ({
  isOpen,
  onToggle,
  account,
  roomCode,
  wsConnected,
  players,
  chatMessages,
  feed,
  duels,
  onSendChat,
  onJoinRoomCode,
  onCreateQuickDuel,
  onAcceptDuel,
}) => {
  const [chatText, setChatText] = useState<string>('');
  const [sideTab, setSideTab] = useState<'CHAT' | 'DUELS' | 'PLAYERS'>('CHAT');
  const [roomInput, setRoomInput] = useState<string>(roomCode);

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    soundEngine.playChipClick();
    onSendChat(chatText.trim());
    setChatText('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Open Room Chat Sidebar"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 px-2.5 py-4 rounded-l-2xl bg-[#0c1f18] hover:bg-emerald-900 border-y border-l border-amber-400/40 shadow-2xl text-xs font-bold text-amber-300 flex flex-col items-center gap-1.5 cursor-pointer"
      >
        <span>💬</span>
        <span className="writing-vertical-lr text-[11px] tracking-wider uppercase">
          Chat ({Math.max(1, players.length)})
        </span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Live Multiplayer Room Chat and Activity Sidebar"
      className="w-full lg:w-72 shrink-0 bg-[#081510] border-l border-emerald-500/20 flex flex-col justify-between h-auto lg:min-h-[calc(100vh-58px)]"
    >
      {/* Top Room Header */}
      <div className="p-3.5 border-b border-emerald-500/20 space-y-2.5 bg-[#06100c]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-tabular uppercase text-emerald-400">
              {wsConnected ? 'Live Socket Connected' : 'Syncing Room'} · {Math.max(1, players.length)} Online
            </div>
            <div className="font-display text-sm font-bold text-white">
              ROOM: <span className="text-amber-300 font-mono-tabular">{roomCode}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse Chat Sidebar"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer"
          >
            Hide →
          </button>
        </div>

        {/* Quick Room Code Switcher */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            aria-label="Switch Room Code"
            maxLength={10}
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            placeholder="Room Code"
            className="w-full rounded-lg bg-[#0c1d16] border border-emerald-500/30 px-2.5 py-1 font-mono-tabular text-xs font-bold text-white uppercase"
          />
          <button
            type="button"
            onClick={() => {
              if (roomInput.trim()) {
                soundEngine.playChipClick();
                onJoinRoomCode(roomInput.trim().toUpperCase());
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold whitespace-nowrap cursor-pointer"
          >
            Join
          </button>
        </div>

        {/* Sub-Tabs: Chat | Friend Duels | Room Players */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#040a07] border border-emerald-500/15">
          {(
            [
              { id: 'CHAT', label: `Chat (${chatMessages.length})` },
              { id: 'DUELS', label: `Duels (${duels.filter((d) => d.status === 'OPEN').length})` },
              { id: 'PLAYERS', label: `Friends (${Math.max(1, players.length)})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSideTab(t.id)}
              className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                sideTab === t.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Middle Scrollable Body */}
      <div className="flex-1 p-3.5 overflow-y-auto max-h-[420px] lg:max-h-[calc(100vh-270px)] space-y-2.5">
        {sideTab === 'CHAT' && (
          <>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl text-xs space-y-1 ${
                  msg.isSystem
                    ? 'bg-emerald-950/60 border border-emerald-500/25 text-emerald-200'
                    : msg.senderId === account.playerId
                    ? 'bg-amber-500/15 border border-amber-400/30 text-white'
                    : 'bg-[#0c1d16] border border-emerald-500/15 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-300 truncate">{msg.senderAlias}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{msg.vipTier}</span>
                </div>
                <p className="text-xs leading-relaxed break-words">{msg.text}</p>
              </div>
            ))}

            {/* Recent Table Wins Ticker in Chat */}
            {feed.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="px-2.5 py-1.5 rounded-lg bg-black/35 border border-emerald-500/15 text-[11px] text-emerald-300/90"
              >
                🎲 {ev.summary}
              </div>
            ))}
          </>
        )}

        {sideTab === 'DUELS' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                onCreateQuickDuel(250);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
            >
              + Post 250 Chip Friend Dice Duel
            </button>
            {duels.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                No friend duels posted yet.
              </div>
            ) : (
              duels.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-[#0c1d16] border border-emerald-500/20 space-y-2 text-xs"
                >
                  <div className="font-bold text-white">
                    {d.creatorAlias} · {d.stake.toLocaleString()} Chips
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    {d.status === 'OPEN' ? 'Open Challenge' : d.resultSummary}
                  </div>
                  {d.status === 'OPEN' && (
                    <div className="flex gap-1.5">
                      {d.creatorId !== account.playerId && (
                        <button
                          type="button"
                          onClick={() => onAcceptDuel(d.id, false)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Accept
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onAcceptDuel(d.id, true)}
                        className="flex-1 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold text-[11px] cursor-pointer"
                      >
                        Roll vs VIP
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {sideTab === 'PLAYERS' && (
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-[#0c1d16] border border-emerald-500/15 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {p.alias} {p.id === account.playerId ? '(You)' : ''}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {p.vipTier} · {p.activeGame}
                  </div>
                </div>
                <div className="font-mono-tabular font-bold text-amber-300">
                  {p.chips.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Chat Input Form + Quick Reactions */}
      <div className="p-3 border-t border-emerald-500/20 bg-[#06100c] space-y-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {['GG! 🔥', 'All-in! 💎', 'Join my Duel!', 'Hit 110x!'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                onSendChat(preset);
              }}
              className="px-2 py-1 rounded-md bg-[#0c1d16] hover:bg-emerald-900 text-[10px] font-semibold text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            aria-label="Room Chat Message"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder={`Chat in ${roomCode}...`}
            className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </aside>
  );
};
