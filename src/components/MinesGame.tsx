import React, { useState } from 'react';
import {
  calculateMinesMultiplier,
  canPlaceBet,
  createMinesBoard,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface MinesGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

export const MinesGame: React.FC<MinesGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  const [wager, setWager] = useState<number>(200);
  const [mineCount, setMineCount] = useState<number>(5);
  const [board, setBoard] = useState<boolean[]>(() => createMinesBoard(5));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [gameState, setGameState] = useState<'IDLE' | 'ACTIVE' | 'BUSTED' | 'CASHED'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentMult = calculateMinesMultiplier(mineCount, revealed.size);
  const nextMult = calculateMinesMultiplier(mineCount, revealed.size + 1);
  const currentPayout = Math.round(wager * currentMult);

  const startRound = () => {
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient balance! Enable Credit Line in Cashier or lower wager.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playChipClick();
    setBoard(createMinesBoard(mineCount));
    setRevealed(new Set());
    setGameState('ACTIVE');
  };

  const handleTileClick = (idx: number) => {
    if (gameState !== 'ACTIVE' || revealed.has(idx)) return;

    const isMine = board[idx];
    const nextRevealed = new Set(revealed);
    nextRevealed.add(idx);
    setRevealed(nextRevealed);

    if (isMine) {
      setGameState('BUSTED');
      soundEngine.playLossThud();
      onSettleBet(
        wager,
        0,
        `Diamond Mines (${mineCount} bombs): Triggered Syndicate Mine! Lost ${wager.toLocaleString()} chips`
      );
    } else {
      soundEngine.playPegPing(nextRevealed.size / 15);
      const safeRemaining = 25 - mineCount - nextRevealed.size;
      if (safeRemaining === 0) {
        // Cleared entire board!
        const maxMult = calculateMinesMultiplier(mineCount, nextRevealed.size);
        const winPay = Math.round(wager * maxMult);
        setGameState('CASHED');
        soundEngine.playWinChime(true);
        onSettleBet(
          wager,
          winPay,
          `Diamond Mines PERFECT CLEAR (${maxMult}x) for ${winPay.toLocaleString()} chips!`
        );
      }
    }
  };

  const handleCashout = () => {
    if (gameState !== 'ACTIVE' || revealed.size === 0) return;
    setGameState('CASHED');
    soundEngine.playWinChime(currentMult >= 3);
    onSettleBet(
      wager,
      currentPayout,
      `Diamond Mines: Cashed out ${revealed.size} gems (${currentMult}x) for ${currentPayout.toLocaleString()} chips!`
    );
  };

  return (
    <div className="w-full max-w-[1260px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-emerald-500/25 p-5 space-y-5">
        <div>
          <div className="text-xs font-medium text-emerald-400">Velvet Originals · Vault Sweeper</div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            DIAMOND MINES
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Uncover emerald diamonds across the 25-vault grid. Cash out anytime before hitting a Syndicate Bomb.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="mines-wager" className="block text-xs font-semibold text-slate-300">
            Vault Wager (Chips)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="mines-wager"
              type="number"
              min={25}
              disabled={gameState === 'ACTIVE'}
              value={wager}
              onChange={(e) => setWager(Math.max(25, Math.round(Number(e.target.value) || 0)))}
              className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
            />
            <button
              type="button"
              disabled={gameState === 'ACTIVE'}
              onClick={() => setWager((w) => w * 2)}
              className="px-3 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
            >
              2X
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Syndicate Bombs (1–24)</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 3, 5, 10, 18].map((cnt) => (
              <button
                key={cnt}
                type="button"
                disabled={gameState === 'ACTIVE'}
                onClick={() => setMineCount(cnt)}
                className={`py-2 rounded-lg font-mono-tabular text-xs font-bold cursor-pointer ${
                  mineCount === cnt
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-[#07110d] text-slate-300 border border-emerald-500/20'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#07110d] border border-emerald-500/20">
          <div>
            <div className="text-[10px] text-slate-400">Current Multiplier</div>
            <div className="font-mono-tabular text-base font-extrabold text-amber-300">
              {currentMult.toFixed(2)}x
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Next Diamond Tile</div>
            <div className="font-mono-tabular text-base font-extrabold text-emerald-400">
              {nextMult.toFixed(2)}x
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {gameState === 'ACTIVE' ? (
          <button
            type="button"
            disabled={revealed.size === 0}
            onClick={handleCashout}
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-sm shadow-xl cursor-pointer"
          >
            CASH OUT ({currentPayout.toLocaleString()} Chips · {currentMult.toFixed(2)}x)
          </button>
        ) : (
          <button
            type="button"
            onClick={startRound}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-xl cursor-pointer"
          >
            START VAULT SWEEP ({wager.toLocaleString()} Chips)
          </button>
        )}
      </div>

      {/* Right 5x5 Vault Grid */}
      <div className="lg:col-span-8 rounded-2xl bg-[#081611] border border-emerald-500/25 p-6 flex flex-col items-center">
        <div className="w-full max-w-[440px] grid grid-cols-5 gap-2.5">
          {board.map((isMine, idx) => {
            const isOpened = revealed.has(idx);
            const showAll = gameState === 'BUSTED' || gameState === 'CASHED';

            let bg = 'bg-[#0e291f] hover:bg-[#14382b] border-emerald-500/30';
            if (isOpened && !isMine) bg = 'bg-emerald-600 border-amber-300';
            else if (isOpened && isMine) bg = 'bg-rose-600 border-rose-300';
            else if (showAll && isMine) bg = 'bg-rose-950/70 border-rose-500/40 opacity-75';

            return (
              <button
                key={idx}
                type="button"
                aria-label={`Vault Tile ${idx + 1}`}
                disabled={gameState !== 'ACTIVE' || isOpened}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-colors cursor-pointer ${bg}`}
              >
                {(isOpened || showAll) && (
                  <span>{isMine ? '💣' : '💎'}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
