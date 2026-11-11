import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ARREST_DEBT_THRESHOLD,
  GameId,
  LuxuryItem,
  PlayerAccountState,
  PreArrestSnapshot,
  STARTING_CHIPS,
  calculateCashoutBonusMultiplier,
  createInitialAccountState,
  executeArrestReset,
  executePrisonEscapeSuccess,
  settleBet,
  shouldArrestPlayer,
} from './game/rules';
import { soundEngine } from './game/sound';
import { LobbyBento } from './components/LobbyBento';
import { PlinkoGame } from './components/PlinkoGame';
import { RouletteGame } from './components/RouletteGame';
import { BrassDiceGame } from './components/BrassDiceGame';
import { BlackjackGame } from './components/BlackjackGame';
import { VideoPokerGame } from './components/VideoPokerGame';
import { SlotsGame } from './components/SlotsGame';
import { RoyalWheelGame } from './components/RoyalWheelGame';
import { MinesGame } from './components/MinesGame';
import { BaccaratGame } from './components/BaccaratGame';
import { CashierLuxuryModal } from './components/CashierLuxuryModal';
import {
  MultiplayerModal,
  RoomDuelItem,
  RoomFeedItem,
  RoomPlayerView,
} from './components/MultiplayerModal';
import { AccountVaultModal } from './components/AccountVaultModal';
import { RoomChatItem, SideChatDrawer } from './components/SideChatDrawer';
import { CasinoHeistModal } from './components/CasinoHeistModal';
import { PrisonEscapeModal } from './components/PrisonEscapeModal';

const LOCAL_STORAGE_KEY = 'velvet_originals_account_v1';

type ShellState = 'playing' | 'paused' | 'gameover';

export default function App() {
  const [shellState, setShellState] = useState<ShellState>('playing');

  const [account, setAccount] = useState<PlayerAccountState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.chips === 'number') {
          return { ...createInitialAccountState(), ...parsed };
        }
      }
    } catch {
      // Ignore storage errors
    }
    return createInitialAccountState();
  });

  const [activeGame, setActiveGame] = useState<GameId>('LOBBY');
  const [muted, setMuted] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<
    'NONE' | 'CASHIER' | 'MULTIPLAYER' | 'VAULT' | 'HEIST'
  >('NONE');
  const [sideChatOpen, setSideChatOpen] = useState<boolean>(true);
  const [editingTopAlias, setEditingTopAlias] = useState<boolean>(false);
  const [topAliasDraft, setTopAliasDraft] = useState<string>(account.alias);

  const [arrestSnapshot, setArrestSnapshot] = useState<PreArrestSnapshot | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  // Multiplayer WebSocket state
  const [roomCode, setRoomCode] = useState<string>('VELVET');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerView[]>([]);
  const [roomFeed, setRoomFeed] = useState<RoomFeedItem[]>([]);
  const [roomDuels, setRoomDuels] = useState<RoomDuelItem[]>([]);
  const [roomChatMessages, setRoomChatMessages] = useState<RoomChatItem[]>([]);
  const [sharedRouletteHistory, setSharedRouletteHistory] = useState<number[]>([
    0, 32, 15, 19, 4, 21, 2, 25,
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const accountRef = useRef(account);
  accountRef.current = account;
  const activeGameRef = useRef(activeGame);
  activeGameRef.current = activeGame;
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    setTopAliasDraft(account.alias);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(account));
    } catch {
      // Ignore storage errors
    }
  }, [account]);

  const showToast = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  const triggerArrest = useCallback(
    (
      debtOrChipsAmount: number,
      currentOwned: string[],
      reason: 'DEBT_DEFAULT' | 'CASINO_HEIST_CAUGHT' = 'DEBT_DEFAULT'
    ) => {
      soundEngine.playArrestSiren();
      const acc = accountRef.current;
      setArrestSnapshot({
        finalDebtOrChips: debtOrChipsAmount,
        // Preserve the positive chips, cash, and items won before arrest so escaping with a new identity keeps them!
        savedChips: Math.max(STARTING_CHIPS, acc.chips > 0 ? acc.chips : acc.biggestWin || STARTING_CHIPS),
        savedCash: Math.max(0, acc.cash),
        savedOwnedItems: [...currentOwned],
        handsPlayed: acc.handsPlayed,
        arrestReason: reason,
      });
      setOpenModal('NONE');
      setShellState('gameover');
    },
    []
  );

  // Connect to WebSocket room server
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) return;
        setWsConnected(true);
        const acc = accountRef.current;
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: roomCodeRef.current,
            playerId: acc.playerId,
            alias: acc.alias,
            chips: acc.chips,
            cash: acc.cash,
            vipTier: acc.vipTier,
            activeGame: activeGameRef.current,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room:state' && data.room) {
            setRoomPlayers(data.room.players || []);
            setRoomFeed(data.room.feed || []);
            setRoomDuels(data.room.duels || []);
            if (Array.isArray(data.room.chatMessages)) {
              setRoomChatMessages(data.room.chatMessages);
            }
            if (Array.isArray(data.room.sharedRouletteHistory)) {
              setSharedRouletteHistory(data.room.sharedRouletteHistory);
            }
          } else if (data.type === 'duel:resolved' && data.duel) {
            const duel: RoomDuelItem = data.duel;
            const myId = accountRef.current.playerId;
            if (duel.winnerId === myId) {
              soundEngine.playWinChime(true);
              setAccount((prev) => ({
                ...prev,
                chips: prev.chips + duel.stake,
                totalWon: prev.totalWon + duel.stake,
              }));
              showToast(`Friend Duel Victory! You won +${duel.stake.toLocaleString()} chips!`);
            } else if (duel.creatorId === myId || duel.challengerId === myId) {
              soundEngine.playLossThud();
              setAccount((prev) => {
                const nextChips = prev.chips - duel.stake;
                if (shouldArrestPlayer(nextChips)) {
                  setTimeout(() => triggerArrest(nextChips, prev.ownedItems), 50);
                }
                return {
                  ...prev,
                  chips: nextChips,
                };
              });
              showToast(`Friend Duel Defeat: -${duel.stake.toLocaleString()} chips.`);
            }
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWs, 2500);
      };
    };

    connectWs();
    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [showToast, triggerArrest]);

  // Sync player metadata to room when chips, alias, or game changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'player:sync',
          alias: account.alias,
          chips: account.chips,
          cash: account.cash,
          vipTier: account.vipTier,
          activeGame,
        })
      );
    }
  }, [account.alias, account.chips, account.cash, account.vipTier, activeGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (isInput) return;

      if (openModal !== 'NONE') {
        if (e.key === 'Escape') {
          setOpenModal('NONE');
        }
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (shellState === 'playing') {
          setShellState('paused');
        } else if (shellState === 'paused') {
          setShellState('playing');
        }
      } else if (e.key.toLowerCase() === 'm') {
        setMuted((prev) => {
          const next = !prev;
          soundEngine.muted = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shellState, openModal]);

  const handleSettleBet = useCallback(
    (wager: number, grossPayout: number, summary: string, rouletteNum?: number) => {
      setAccount((prev) => {
        const hasSilverVip = prev.ownedItems.includes('vip-silver');
        const settlement = settleBet(prev.chips, wager, grossPayout, hasSilverVip);
        const profit = Math.max(0, grossPayout - wager);

        if (profit >= wager * 5 && profit >= 1000) {
          confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
        }

        if (settlement.debtInterestCharged > 0) {
          showToast(
            `Syndicate Debt Vig Charged: -${settlement.debtInterestCharged.toLocaleString()} chips`
          );
        }

        if (settlement.arrested) {
          setTimeout(() => triggerArrest(settlement.nextChips, prev.ownedItems), 60);
        }

        return {
          ...prev,
          chips: settlement.nextChips,
          totalWagered: prev.totalWagered + wager,
          totalWon: prev.totalWon + grossPayout,
          biggestWin: Math.max(prev.biggestWin, profit),
          handsPlayed: prev.handsPlayed + 1,
        };
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'game:broadcast',
            game: activeGameRef.current,
            wager,
            payout: grossPayout,
            summary: `${accountRef.current.alias}: ${summary}`,
            rouletteNumber: rouletteNum,
          })
        );
      }
    },
    [showToast, triggerArrest]
  );

  const handleSendRoomChat = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat:send',
          alias: accountRef.current.alias,
          text,
        })
      );
    }
  }, []);

  const handleJoinRoomCode = useCallback(
    (newCode: string) => {
      setRoomCode(newCode);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: newCode,
            playerId: account.playerId,
            alias: account.alias,
            chips: account.chips,
            cash: account.cash,
            vipTier: account.vipTier,
            activeGame,
          })
        );
      }
    },
    [account.playerId, account.alias, account.chips, account.cash, account.vipTier, activeGame]
  );

  const handleCashoutChips = (chipAmount: number) => {
    setAccount((prev) => {
      if (chipAmount <= 0 || chipAmount > prev.chips) return prev;
      const mult = calculateCashoutBonusMultiplier(prev.ownedItems);
      const usdGain = Math.round(chipAmount * mult);
      return {
        ...prev,
        chips: prev.chips - chipAmount,
        cash: prev.cash + usdGain,
      };
    });
  };

  const handleBuyChipsWithCash = (cashAmount: number) => {
    setAccount((prev) => {
      if (cashAmount <= 0 || cashAmount > prev.cash) return prev;
      return {
        ...prev,
        cash: prev.cash - cashAmount,
        chips: prev.chips + cashAmount,
      };
    });
  };

  const handleTakeUndergroundLoan = (loanAmount: number) => {
    setAccount((prev) => {
      const debtAdded = Math.round(loanAmount * 1.1);
      const nextChips = prev.chips - debtAdded;
      if (shouldArrestPlayer(nextChips)) {
        setTimeout(() => triggerArrest(nextChips, prev.ownedItems), 60);
      }
      return {
        ...prev,
        cash: prev.cash + loanAmount,
        chips: nextChips,
        creditLineEnabled: true,
      };
    });
  };

  const handleBuyLuxuryItem = (item: LuxuryItem) => {
    setAccount((prev) => {
      if (prev.cash < item.priceCash || prev.ownedItems.includes(item.id)) return prev;
      const nextOwned = [...prev.ownedItems, item.id];
      let nextVip = prev.vipTier;
      if (nextOwned.includes('vip-obsidian')) nextVip = 'Obsidian Sovereign';
      else if (nextOwned.includes('vip-gold')) nextVip = 'Gold Bullion VIP';
      else if (nextOwned.includes('vip-silver')) nextVip = 'Silver Member';

      return {
        ...prev,
        cash: prev.cash - item.priceCash,
        ownedItems: nextOwned,
        vipTier: nextVip,
        equippedCardBack:
          item.category === 'COSMETICS' && item.id.includes('deck') ? item.id : prev.equippedCardBack,
        equippedTableFelt:
          item.category === 'COSMETICS' && item.id.includes('felt') ? item.id : prev.equippedTableFelt,
      };
    });
  };

  const handleEquipCosmetic = (item: LuxuryItem) => {
    setAccount((prev) => ({
      ...prev,
      equippedCardBack: item.id.includes('deck') ? item.id : prev.equippedCardBack,
      equippedTableFelt: item.id.includes('felt') ? item.id : prev.equippedTableFelt,
    }));
  };

  const handleServeSentenceAndRestart = () => {
    soundEngine.playChipClick();
    setAccount((prev) => executeArrestReset(prev));
    setArrestSnapshot(null);
    setActiveGame('LOBBY');
    setShellState('playing');
    showToast(`Served sentence. Reset to ${STARTING_CHIPS.toLocaleString()} chips.`);
  };

  const handleEscapePrisonWithNewIdentity = (newIdentityAlias: string) => {
    soundEngine.playWinChime(true);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    const snap: PreArrestSnapshot = arrestSnapshot ?? {
      finalDebtOrChips: account.chips,
      savedChips: Math.max(STARTING_CHIPS, account.chips),
      savedCash: account.cash,
      savedOwnedItems: account.ownedItems,
      handsPlayed: account.handsPlayed,
      arrestReason: 'CASINO_HEIST_CAUGHT',
    };
    setAccount((prev) => executePrisonEscapeSuccess(prev, snap, newIdentityAlias));
    setArrestSnapshot(null);
    setActiveGame('LOBBY');
    setShellState('playing');
    showToast(
      `Escaped Prison as "${newIdentityAlias}"! You kept your ${Math.max(
        STARTING_CHIPS,
        snap.savedChips
      ).toLocaleString()} chips & $${snap.savedCash.toLocaleString()} cash!`
    );
  };

  const handleHeistSuccess = (chipsStolen: number, cashStolen: number) => {
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
    setAccount((prev) => ({
      ...prev,
      chips: prev.chips + chipsStolen,
      cash: prev.cash + cashStolen,
      biggestWin: Math.max(prev.biggestWin, chipsStolen),
      heistAttempted: true,
    }));
    setOpenModal('NONE');
    showToast(
      `CASINO HEIST SUCCESS! Stole +${chipsStolen.toLocaleString()} Chips & +$${cashStolen.toLocaleString()} Cash!`
    );
  };

  const handleHeistCaughtInstantArrest = () => {
    setAccount((prev) => ({
      ...prev,
      heistAttempted: true,
    }));
    triggerArrest(accountRef.current.chips, accountRef.current.ownedItems, 'CASINO_HEIST_CAUGHT');
  };

  const saveTopAlias = () => {
    const trimmed = topAliasDraft.trim().slice(0, 20);
    if (trimmed) {
      setAccount((prev) => ({ ...prev, alias: trimmed }));
    }
    setEditingTopAlias(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between ${
        account.equippedTableFelt === 'cos-obsidian-felt' ? 'bg-[#06080c]' : 'bg-[#070d0a]'
      } text-[#f3f5f4] relative overflow-x-hidden`}
    >
      {/* =====================================================================
          UNIFIED PERIMETER GAME SHELL HUD DOCK (With Player Name at Top)
      ===================================================================== */}
      <div className="w-full bg-[#091510] border-b border-emerald-500/20 px-4 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
          {/* Left: Brand Emblem + Top Player Name Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setActiveGame('LOBBY');
              }}
              className="flex items-center gap-2 text-left group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-slate-950 font-display font-extrabold text-base shadow">
                V
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-xs font-bold tracking-wider text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                  VELVET FLOOR
                </div>
                <div className="text-[10px] text-emerald-400 font-mono-tabular whitespace-nowrap">
                  {account.vipTier}
                </div>
              </div>
            </button>

            {/* Top Player Identity / Name Control */}
            <div className="flex items-center bg-[#050c09] border border-amber-400/30 rounded-xl px-2.5 py-1">
              {editingTopAlias ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveTopAlias();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    aria-label="Edit Player Name"
                    maxLength={18}
                    autoFocus
                    value={topAliasDraft}
                    onChange={(e) => setTopAliasDraft(e.target.value)}
                    onBlur={saveTopAlias}
                    className="w-24 bg-[#0c1d16] text-xs font-bold text-amber-200 px-1.5 py-0.5 rounded border border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="text-[10px] font-bold text-emerald-400 px-1 cursor-pointer"
                  >
                    ✓
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  data-testid="top-player-name"
                  onClick={() => setEditingTopAlias(true)}
                  aria-label={`Player Name: ${account.alias} (Click to Rename)`}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white whitespace-nowrap cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{account.alias}</span>
                  <span className="text-[10px] text-slate-400">✎</span>
                </button>
              )}
            </div>
          </div>

          {/* Center: Hero-to-Kicker Tabular Numerals Readouts (Chips, Cash) */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                {account.chips < 0 ? 'SYNDICATE DEBT' : 'CHIPS BALANCE'}
              </div>
              <div
                data-testid="hud-chips"
                className={`font-mono-tabular text-sm sm:text-base font-extrabold leading-tight whitespace-nowrap ${
                  account.chips < 0 ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {Math.round(account.chips).toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                CASH VAULT ($)
              </div>
              <div
                data-testid="hud-cash"
                className="font-mono-tabular text-sm sm:text-base font-extrabold leading-tight text-emerald-400 whitespace-nowrap"
              >
                ${Math.round(account.cash).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Right: Action Modals + Utility Icon Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="top-rob-casino-btn"
              onClick={() => {
                soundEngine.playChipClick();
                setOpenModal('HEIST');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer shadow"
            >
              Rob Casino
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setOpenModal('CASHIER');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cashier &amp; Luxury
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setOpenModal('MULTIPLAYER');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/30 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Room: {roomCode}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setOpenModal('VAULT');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#0c1f18] hover:bg-emerald-900/70 text-slate-200 border border-emerald-500/25 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Save / Load
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                setMuted((prev) => {
                  const next = !prev;
                  soundEngine.muted = next;
                  return next;
                });
              }}
              className="w-8 h-8 rounded-xl bg-[#0c1d16] hover:bg-emerald-900/60 border border-emerald-500/25 flex items-center justify-center text-slate-300 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                {muted ? (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                ) : (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                setShellState((s) => (s === 'paused' ? 'playing' : 'paused'));
              }}
              className="w-8 h-8 rounded-xl bg-[#0c1d16] hover:bg-emerald-900/60 border border-emerald-500/25 flex items-center justify-center text-slate-300 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Debt Danger Warning Bar when Negative */}
      {account.chips < 0 && (
        <div className="w-full bg-rose-950/90 border-b border-rose-500/40 px-4 py-1.5 text-center text-xs text-rose-200 font-medium">
          SYNDICATE DEBT ACTIVE ({account.chips.toLocaleString()} Chips) — 3.5% Vig Applied on Losses · Federal Arrest at{' '}
          <strong className="font-mono-tabular text-rose-300">{ARREST_DEBT_THRESHOLD.toLocaleString()} (-10M)</strong> Chips!
        </div>
      )}

      {toastBanner && (
        <div className="fixed bottom-5 left-5 z-40 max-w-md px-4 py-3 rounded-2xl bg-[#0c1f18] border border-amber-400/50 shadow-2xl text-xs font-semibold text-amber-200">
          {toastBanner}
        </div>
      )}

      {/* =====================================================================
          MAIN BODY SPLIT: ACTIVE CASINO STAGE + SIDE ROOM CHAT DRAWER
      ===================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        <main className="flex-1 min-w-0 flex flex-col justify-start">
          {activeGame !== 'LOBBY' && (
            <div className="w-full max-w-[1340px] mx-auto px-4 sm:px-6 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playChipClick();
                  setActiveGame('LOBBY');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0c1a14] hover:bg-emerald-900/60 border border-emerald-500/25 text-xs font-bold text-emerald-300 cursor-pointer"
              >
                ← Back to Velvet Originals Floor
              </button>
              <div className="text-xs text-slate-400 font-mono-tabular">
                Player: <strong className="text-amber-300">{account.alias}</strong> · Hands: {account.handsPlayed} · Arrests: {account.arrestCount}
              </div>
            </div>
          )}

          {activeGame === 'LOBBY' && (
            <LobbyBento
              onSelectGame={(g) => {
                soundEngine.playChipClick();
                setActiveGame(g);
              }}
              account={account}
              onOpenLuxury={() => setOpenModal('CASHIER')}
              onOpenMultiplayer={() => setOpenModal('MULTIPLAYER')}
              onOpenHeist={() => setOpenModal('HEIST')}
              roomCode={roomCode}
              onlineCount={Math.max(1, roomPlayers.length)}
            />
          )}

          {activeGame === 'PLINKO' && (
            <PlinkoGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'ROULETTE' && (
            <RouletteGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              sharedHistory={sharedRouletteHistory}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'DICE' && (
            <BrassDiceGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'BLACKJACK' && (
            <BlackjackGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              equippedCardBack={account.equippedCardBack}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'VIDEO_POKER' && (
            <VideoPokerGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              equippedCardBack={account.equippedCardBack}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'SLOTS' && (
            <SlotsGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'WHEEL' && (
            <RoyalWheelGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'MINES' && (
            <MinesGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}

          {activeGame === 'BACCARAT' && (
            <BaccaratGame
              chips={account.chips}
              creditLineEnabled={account.creditLineEnabled}
              onSettleBet={handleSettleBet}
            />
          )}
        </main>

        {/* Right-Docked Multiplayer Chat & Room Activity Panel */}
        <SideChatDrawer
          isOpen={sideChatOpen}
          onToggle={() => setSideChatOpen((o) => !o)}
          account={account}
          roomCode={roomCode}
          wsConnected={wsConnected}
          players={roomPlayers}
          chatMessages={roomChatMessages}
          feed={roomFeed}
          duels={roomDuels}
          onSendChat={handleSendRoomChat}
          onJoinRoomCode={handleJoinRoomCode}
          onCreateQuickDuel={(stake) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'duel:create',
                  gameType: 'DICE_DUEL',
                  stake,
                })
              );
            }
          }}
          onAcceptDuel={(duelId, vsHouse) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'duel:accept',
                  duelId,
                  vsHouseChallenger: vsHouse,
                })
              );
            }
          }}
        />
      </div>

      {/* =====================================================================
          MODALS: CASHIER/LUXURY, MULTIPLAYER LOUNGE, ACCOUNT VAULT
      ===================================================================== */}
      {openModal === 'CASHIER' && (
        <CashierLuxuryModal
          account={account}
          onClose={() => setOpenModal('NONE')}
          onCashoutChips={handleCashoutChips}
          onBuyChipsWithCash={handleBuyChipsWithCash}
          onTakeUndergroundLoan={handleTakeUndergroundLoan}
          onToggleCreditLine={() =>
            setAccount((prev) => ({ ...prev, creditLineEnabled: !prev.creditLineEnabled }))
          }
          onBuyLuxuryItem={handleBuyLuxuryItem}
          onEquipCosmetic={handleEquipCosmetic}
        />
      )}

      {openModal === 'MULTIPLAYER' && (
        <MultiplayerModal
          account={account}
          roomCode={roomCode}
          wsConnected={wsConnected}
          players={roomPlayers}
          feed={roomFeed}
          duels={roomDuels}
          onClose={() => setOpenModal('NONE')}
          onJoinRoomCode={handleJoinRoomCode}
          onUpdateAlias={(newAlias) => setAccount((prev) => ({ ...prev, alias: newAlias }))}
          onCreateDuel={(gameType, stake) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'duel:create',
                  gameType,
                  stake,
                })
              );
            }
          }}
          onAcceptDuel={(duelId, vsHouseChallenger) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'duel:accept',
                  duelId,
                  vsHouseChallenger,
                })
              );
            }
          }}
        />
      )}

      {openModal === 'VAULT' && (
        <AccountVaultModal
          account={account}
          onClose={() => setOpenModal('NONE')}
          onRestoreAccount={(restored) => setAccount(restored)}
        />
      )}

      {openModal === 'HEIST' && (
        <CasinoHeistModal
          account={account}
          onClose={() => setOpenModal('NONE')}
          onHeistSuccess={handleHeistSuccess}
          onHeistCaughtInstantArrest={handleHeistCaughtInstantArrest}
        />
      )}

      {/* =====================================================================
          PAUSE MODAL ('paused' state)
      ===================================================================== */}
      {shellState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#0a1813] border border-amber-400/40 p-6 text-center space-y-5 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-white">VELVET FLOOR PAUSED</h2>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-[#07110d] border border-emerald-500/20">
                <div className="text-[11px] text-slate-400">Chip Balance</div>
                <div className="font-mono-tabular text-base font-bold text-amber-300">
                  {account.chips.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#07110d] border border-emerald-500/20">
                <div className="text-[11px] text-slate-400">Hands Played</div>
                <div className="font-mono-tabular text-base font-bold text-white">
                  {account.handsPlayed}
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShellState('playing')}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Resume Floor Action
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveGame('LOBBY');
                  setShellState('playing');
                }}
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Return to Velvet Floor Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          GAME OVER / FEDERAL PRISON & 1-TRY ESCAPE MINIGAME ('gameover' state)
      ===================================================================== */}
      {shellState === 'gameover' && (
        <PrisonEscapeModal
          snapshot={
            arrestSnapshot ?? {
              finalDebtOrChips: account.chips,
              savedChips: Math.max(STARTING_CHIPS, account.chips),
              savedCash: account.cash,
              savedOwnedItems: account.ownedItems,
              handsPlayed: account.handsPlayed,
              arrestReason: 'CASINO_HEIST_CAUGHT',
            }
          }
          currentAlias={account.alias}
          onEscapeSuccess={handleEscapePrisonWithNewIdentity}
          onServeSentenceReset={handleServeSentenceAndRestart}
        />
      )}
    </div>
  );
}
