import React, { useState } from 'react';
import {
  ROULETTE_WHEEL_ORDER,
  RouletteBet,
  RouletteBetType,
  canPlaceBet,
  evaluateRouletteBet,
  getRouletteColor,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface RouletteGameProps {
  chips: number;
  creditLineEnabled: boolean;
  sharedHistory: number[];
  onSettleBet: (wager: number, payout: number, summary: string, rouletteNum?: number) => void;
}

const CHIP_DENOMS = [25, 100, 500, 2500, 10000, 100000];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  chips,
  creditLineEnabled,
  sharedHistory,
  onSettleBet,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [winningNum, setWinningNum] = useState<number | null>(0);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [lastOutcomeMsg, setLastOutcomeMsg] = useState<string>('Place chips on the European felt to spin.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalWager = bets.reduce((sum, b) => sum + b.amount, 0);

  const addBet = (type: RouletteBetType, label: string, number?: number) => {
    if (spinning) return;
    if (!canPlaceBet(chips, totalWager + selectedChip, creditLineEnabled)) {
      setErrorMsg('Insufficient chip balance for this bet. Enable Credit Line in Cashier or clear bets.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playChipClick();

    setBets((prev) => {
      const existingIdx = prev.findIndex((b) => b.type === type && b.number === number);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: updated[existingIdx].amount + selectedChip,
        };
        return updated;
      }
      return [...prev, { type, number, amount: selectedChip, label }];
    });
  };

  const clearBets = () => {
    if (spinning) return;
    setBets([]);
    setErrorMsg(null);
  };

  const doubleBets = () => {
    if (spinning || bets.length === 0) return;
    if (!canPlaceBet(chips, totalWager * 2, creditLineEnabled)) {
      setErrorMsg('Cannot double bets: exceeds credit limit.');
      return;
    }
    soundEngine.playChipClick();
    setBets((prev) => prev.map((b) => ({ ...b, amount: b.amount * 2 })));
  };

  const handleSpin = () => {
    if (spinning || bets.length === 0) return;
    if (!canPlaceBet(chips, totalWager, creditLineEnabled)) {
      setErrorMsg('Insufficient balance to spin.');
      return;
    }
    setErrorMsg(null);
    setSpinning(true);
    soundEngine.playChipClick();

    const winIndex = Math.floor(Math.random() * ROULETTE_WHEEL_ORDER.length);
    const landedNumber = ROULETTE_WHEEL_ORDER[winIndex];
    const sliceDeg = 360 / ROULETTE_WHEEL_ORDER.length;
    const nextAngle = wheelAngle + 1440 + (360 - winIndex * sliceDeg);
    setWheelAngle(nextAngle);

    setTimeout(() => {
      setSpinning(false);
      setWinningNum(landedNumber);

      let grossPayout = 0;
      for (const b of bets) {
        grossPayout += evaluateRouletteBet(b, landedNumber);
      }

      const color = getRouletteColor(landedNumber);
      const net = grossPayout - totalWager;

      if (grossPayout > 0) {
        soundEngine.playWinChime(grossPayout >= totalWager * 5);
        setLastOutcomeMsg(
          `Ball landed on ${landedNumber} (${color})! Payout: ${grossPayout.toLocaleString()} chips (${
            net >= 0 ? `+${net.toLocaleString()}` : net.toLocaleString()
          })`
        );
      } else {
        soundEngine.playLossThud();
        setLastOutcomeMsg(`Ball landed on ${landedNumber} (${color}). House collects ${totalWager.toLocaleString()} chips.`);
      }

      onSettleBet(
        totalWager,
        grossPayout,
        `Roulette landed on ${landedNumber} (${color}) — ${
          grossPayout > 0 ? `Won ${grossPayout.toLocaleString()}` : `Lost ${totalWager.toLocaleString()}`
        } chips`,
        landedNumber
      );
    }, 950);
  };

  const getNumberBetAmount = (num: number) => {
    const found = bets.find((b) => b.type === 'STRAIGHT' && b.number === num);
    return found ? found.amount : 0;
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: European Wheel + Chip Rack + Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1914] border border-emerald-500/20 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-400">Velvet Originals</div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              EUROPEAN ROULETTE
            </h2>
          </div>
          {winningNum !== null && (
            <div
              className={`px-3.5 py-2 rounded-xl font-mono-tabular text-lg font-extrabold border ${
                winningNum === 0
                  ? 'bg-emerald-600 text-white border-amber-300'
                  : getRouletteColor(winningNum) === 'RED'
                  ? 'bg-rose-600 text-white border-rose-300'
                  : 'bg-zinc-900 text-white border-white/30'
              }`}
            >
              {winningNum}
            </div>
          )}
        </div>

        {/* Animated SVG Roulette Wheel */}
        <div className="relative flex items-center justify-center py-2">
          <div className="relative w-56 h-56 rounded-full border-4 border-amber-400/50 bg-[#07110d] shadow-2xl flex items-center justify-center overflow-hidden">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transition-transform duration-900 ease-out"
              style={{ transform: `rotate(${wheelAngle}deg)` }}
            >
              {ROULETTE_WHEEL_ORDER.map((num, idx) => {
                const startAngle = (idx * 360) / 37;
                const endAngle = ((idx + 1) * 360) / 37;
                const rad1 = ((startAngle - 90) * Math.PI) / 180;
                const rad2 = ((endAngle - 90) * Math.PI) / 180;
                const x1 = 100 + 95 * Math.cos(rad1);
                const y1 = 100 + 95 * Math.sin(rad1);
                const x2 = 100 + 95 * Math.cos(rad2);
                const y2 = 100 + 95 * Math.sin(rad2);
                const color =
                  num === 0 ? '#059669' : getRouletteColor(num) === 'RED' ? '#e11d48' : '#18181b';

                return (
                  <path
                    key={num}
                    d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#d4af37"
                    strokeWidth="0.6"
                  />
                );
              })}
              <circle cx="100" cy="100" r="52" fill="#091510" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="100" cy="100" r="18" fill="#d97706" />
            </svg>
            {/* Top Pointer Ball */}
            <div className="absolute top-2.5 w-3.5 h-3.5 rounded-full bg-amber-300 ring-2 ring-white shadow-lg" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-mono-tabular text-xl font-extrabold text-amber-200">
                {spinning ? '...' : winningNum ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Select Chip Denomination */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">Select Chip Value</div>
          <div className="grid grid-cols-3 gap-2">
            {CHIP_DENOMS.map((denom) => (
              <button
                key={denom}
                type="button"
                onClick={() => {
                  soundEngine.playChipClick();
                  setSelectedChip(denom);
                }}
                className={`py-2 px-2 rounded-xl font-mono-tabular text-xs font-bold border transition-all cursor-pointer ${
                  selectedChip === denom
                    ? 'bg-amber-400 text-slate-950 border-white scale-105 shadow'
                    : 'bg-[#07110d] text-amber-200 border-emerald-500/25 hover:border-amber-400/50'
                }`}
              >
                {denom >= 1000 ? `${denom / 1000}K` : denom}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Total Wager & Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Table Bet:</span>
            <span className="font-mono-tabular font-bold text-amber-300 text-sm">
              {totalWager.toLocaleString()} Chips
            </span>
          </div>
          <button
            type="button"
            disabled={spinning || bets.length === 0}
            onClick={handleSpin}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
          >
            {spinning ? 'Spinning Wheel...' : `Spin Wheel (${totalWager.toLocaleString()} Chips)`}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={doubleBets}
              disabled={spinning || bets.length === 0}
              className="py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 disabled:opacity-40 text-emerald-100 text-xs font-semibold border border-emerald-500/30 cursor-pointer"
            >
              2X Double Bets
            </button>
            <button
              type="button"
              onClick={clearBets}
              disabled={spinning || bets.length === 0}
              className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Clear Felt
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive European Roulette Felt Table */}
      <div className="lg:col-span-8 rounded-2xl bg-[#081b14] border border-emerald-500/30 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
          <p className="text-xs font-medium text-emerald-200">{lastOutcomeMsg}</p>
          {/* Recent Numbers Strip */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">History:</span>
            {sharedHistory.slice(0, 9).map((num, idx) => (
              <span
                key={idx}
                className={`w-6 h-6 rounded-md font-mono-tabular text-[11px] font-bold flex items-center justify-center ${
                  num === 0
                    ? 'bg-emerald-600 text-white'
                    : getRouletteColor(num) === 'RED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900 text-slate-200 border border-white/15'
                }`}
              >
                {num}
              </span>
            ))}
          </div>
        </div>

        {/* Main 0 + 1-36 Felt Grid */}
        <div className="grid grid-cols-13 gap-1.5 select-none">
          {/* Zero Column */}
          <button
            type="button"
            onClick={() => addBet('STRAIGHT', 'Straight 0', 0)}
            className="col-span-1 row-span-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-2 border-amber-300/60 flex flex-col items-center justify-center text-white font-mono-tabular font-extrabold text-base cursor-pointer relative min-h-[144px]"
          >
            <span>0</span>
            {getNumberBetAmount(0) > 0 && (
              <span className="mt-1 px-1.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[10px] font-bold">
                {getNumberBetAmount(0)}
              </span>
            )}
          </button>

          {/* 36 Numbers in 3 Rows x 12 Columns */}
          {[3, 2, 1].map((rowRem) => (
            <React.Fragment key={rowRem}>
              {Array.from({ length: 12 }).map((_, colIdx) => {
                const num = colIdx * 3 + (rowRem === 3 ? 3 : rowRem === 2 ? 2 : 1);
                const isRed = getRouletteColor(num) === 'RED';
                const betAmt = getNumberBetAmount(num);
                const isWinner = winningNum === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => addBet('STRAIGHT', `Straight ${num}`, num)}
                    className={`h-12 rounded-lg font-mono-tabular text-xs sm:text-sm font-bold text-white border transition-transform hover:scale-105 flex flex-col items-center justify-center cursor-pointer relative ${
                      isRed
                        ? 'bg-gradient-to-b from-rose-600 to-rose-700 border-rose-400/40'
                        : 'bg-gradient-to-b from-zinc-800 to-zinc-950 border-white/15'
                    } ${isWinner ? 'ring-2 ring-amber-300 scale-105' : ''}`}
                  >
                    <span>{num}</span>
                    {betAmt > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-extrabold shadow">
                        {betAmt >= 1000 ? `${betAmt / 1000}k` : betAmt}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Dozens Row (2 to 1) */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { type: 'DOZEN_1', label: '1st 12 (1–12) · 3X' },
              { type: 'DOZEN_2', label: '2nd 12 (13–24) · 3X' },
              { type: 'DOZEN_3', label: '3rd 12 (25–36) · 3X' },
            ] as const
          ).map((d) => {
            const activeBet = bets.find((b) => b.type === d.type);
            return (
              <button
                key={d.type}
                type="button"
                onClick={() => addBet(d.type, d.label)}
                className="py-2.5 px-3 rounded-xl bg-[#0b241b] hover:bg-emerald-900/60 border border-emerald-500/30 text-xs font-bold text-emerald-100 flex items-center justify-between cursor-pointer"
              >
                <span>{d.label}</span>
                {activeBet && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono-tabular text-[10px] font-extrabold">
                    {activeBet.amount.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Outside Even-Money Bets (2X) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {(
            [
              { type: 'LOW', label: '1–18 (2X)', style: 'bg-[#0b241b] border-emerald-500/30' },
              { type: 'EVEN', label: 'EVEN (2X)', style: 'bg-[#0b241b] border-emerald-500/30' },
              { type: 'RED', label: 'RED ♦ (2X)', style: 'bg-rose-700/80 border-rose-400/50' },
              { type: 'BLACK', label: 'BLACK ♠ (2X)', style: 'bg-zinc-900 border-white/25' },
              { type: 'ODD', label: 'ODD (2X)', style: 'bg-[#0b241b] border-emerald-500/30' },
              { type: 'HIGH', label: '19–36 (2X)', style: 'bg-[#0b241b] border-emerald-500/30' },
            ] as const
          ).map((outside) => {
            const activeBet = bets.find((b) => b.type === outside.type);
            return (
              <button
                key={outside.type}
                type="button"
                onClick={() => addBet(outside.type, outside.label)}
                className={`py-3 px-2 rounded-xl border text-xs font-bold text-white flex flex-col items-center justify-center gap-1 hover:brightness-110 cursor-pointer ${outside.style}`}
              >
                <span>{outside.label}</span>
                {activeBet && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono-tabular text-[10px] font-extrabold">
                    {activeBet.amount.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
