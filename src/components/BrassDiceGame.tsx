import React, { useState } from 'react';
import {
  calculateDiceMultiplier,
  canPlaceBet,
  evaluateBrassDiceRoll,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface BrassDiceGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

export const BrassDiceGame: React.FC<BrassDiceGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  const [wager, setWager] = useState<number>(250);
  const [target, setTarget] = useState<number>(50);
  const [mode, setMode] = useState<'OVER' | 'UNDER'>('OVER');
  const [lastRoll, setLastRoll] = useState<number>(54);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [rolling, setRolling] = useState<boolean>(false);
  const [dieA, setDieA] = useState<number>(1);
  const [dieB, setDieB] = useState<number>(4);
  const [history, setHistory] = useState<{ id: string; roll: number; won: boolean; mult: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const multiplier = calculateDiceMultiplier(target, mode);
  const winChance = mode === 'UNDER' ? target : 100 - target;
  const potentialPayout = Math.round(wager * multiplier);

  const handleRollDice = () => {
    if (rolling) return;
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient chips. Enable Underground Credit in Cashier or lower your wager.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    setRolling(true);
    soundEngine.playChipClick();

    const rollTicker = setInterval(() => {
      setDieA(Math.floor(Math.random() * 6) + 1);
      setDieB(Math.floor(Math.random() * 6) + 1);
      setLastRoll(Math.floor(Math.random() * 100) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(rollTicker);
      // Player-favorable roll distribution
      const rolled = Math.floor(Math.random() * 100) + 1;
      const finalResult = evaluateBrassDiceRoll(rolled, target, mode);
      const payout = finalResult.won ? Math.round(wager * finalResult.multiplier) : 0;

      // Map 1-100 roll to visual 2d6 brass dice faces
      const d1 = Math.max(1, Math.min(6, Math.ceil((rolled / 100) * 6)));
      const d2 = ((rolled * 7) % 6) + 1;
      setDieA(d1);
      setDieB(d2);
      setLastRoll(rolled);
      setLastWon(finalResult.won);
      setRolling(false);

      if (finalResult.won) {
        soundEngine.playWinChime(finalResult.multiplier >= 5);
      } else {
        soundEngine.playLossThud();
      }

      setHistory((prev) => [
        { id: `d-${Date.now()}`, roll: rolled, won: finalResult.won, mult: finalResult.multiplier },
        ...prev.slice(0, 9),
      ]);

      onSettleBet(
        wager,
        payout,
        `Brass Dice rolled ${rolled} (${mode} ${target}) — ${
          finalResult.won ? `Won ${payout.toLocaleString()} (${finalResult.multiplier}x)` : `Lost ${wager.toLocaleString()}`
        } chips`
      );
    }, 440);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Betting Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-emerald-500/20 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-400">Velvet Originals</div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              BRASS DICE
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full font-mono-tabular text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/35">
            98.0X MAX
          </span>
        </div>

        {/* Wager Input */}
        <div className="space-y-2">
          <label htmlFor="dice-wager" className="block text-xs font-semibold text-slate-300">
            Wager Amount (Chips)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="dice-wager"
              type="number"
              min={10}
              value={wager}
              onChange={(e) => setWager(Math.max(10, Math.round(Number(e.target.value) || 0)))}
              className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
            />
            <button
              type="button"
              onClick={() => setWager((w) => Math.max(10, Math.floor(w / 2)))}
              className="px-3 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => setWager((w) => w * 2)}
              className="px-3 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
            >
              2X
            </button>
          </div>
        </div>

        {/* Roll Mode: OVER vs UNDER */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Roll Condition</span>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#07110d] border border-emerald-500/20">
            <button
              type="button"
              onClick={() => setMode('OVER')}
              className={`py-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'OVER' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roll Over {target}
            </button>
            <button
              type="button"
              onClick={() => setMode('UNDER')}
              className={`py-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'UNDER' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roll Under {target}
            </button>
          </div>
        </div>

        {/* Quick Preset Odds */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Quick High-Roller Presets</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('OVER');
                setTarget(50);
              }}
              className="py-2 rounded-lg bg-[#07110d] border border-emerald-500/25 font-mono-tabular text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer"
            >
              1.96x (50%)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('OVER');
                setTarget(90);
              }}
              className="py-2 rounded-lg bg-[#07110d] border border-emerald-500/25 font-mono-tabular text-xs font-semibold text-amber-300 hover:border-amber-400 cursor-pointer"
            >
              9.80x (10%)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('OVER');
                setTarget(99);
              }}
              className="py-2 rounded-lg bg-rose-950/60 border border-rose-500/40 font-mono-tabular text-xs font-bold text-rose-300 hover:border-rose-400 cursor-pointer"
            >
              98.0x (1%)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleRollDice}
          disabled={rolling}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
        >
          {rolling ? 'Rolling Brass Dice...' : `Roll Brass Dice (Win ${potentialPayout.toLocaleString()} Chips)`}
        </button>
      </div>

      {/* Right Dice Arena & Target Slider */}
      <div className="lg:col-span-8 rounded-2xl bg-[#081611] border border-emerald-500/25 p-6 space-y-6">
        {/* Recent Rolls Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Recent Rolls:</span>
          <div className="flex items-center gap-1.5">
            {history.length === 0 ? (
              <span className="text-xs text-slate-500">No rolls yet</span>
            ) : (
              history.map((h) => (
                <span
                  key={h.id}
                  className={`px-2.5 py-1 rounded-lg font-mono-tabular text-xs font-bold ${
                    h.won
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-950/90 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {h.roll}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Center Brass Dice Display */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-8">
          <div className="flex items-center gap-4">
            {[dieA, dieB].map((val, idx) => (
              <div
                key={idx}
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border-2 border-amber-100 shadow-2xl flex items-center justify-center transition-transform duration-200 ${
                  rolling
                    ? 'animate-velvet-dice-tumble'
                    : idx === 0
                    ? 'animate-velvet-dice-left'
                    : 'animate-velvet-dice-right'
                }`}
              >
                <span
                  className={`font-mono-tabular text-4xl font-extrabold ${
                    val === 1 ? 'text-rose-700' : 'text-slate-950'
                  }`}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="text-xs uppercase tracking-wider text-slate-400">Resulting Precision Roll</div>
            <div
              className={`font-mono-tabular text-5xl font-extrabold ${
                lastWon === null
                  ? 'text-amber-300'
                  : lastWon
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {lastRoll.toFixed(0)}
            </div>
            <div className="text-xs font-medium text-slate-300">
              {lastWon === null
                ? 'Ready to roll'
                : lastWon
                ? `WINNER! Paid ${multiplier}x`
                : `Missed target (${mode} ${target})`}
            </div>
          </div>
        </div>

        {/* Interactive Precision Target Slider */}
        <div className="space-y-3 bg-[#0c1f18] p-5 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">
              Target Threshold: <strong className="font-mono-tabular text-amber-300">{target}</strong>
            </span>
            <span className="text-emerald-300 font-mono-tabular">
              Win Chance: {winChance}% · Multiplier: {multiplier}x
            </span>
          </div>

          <input
            type="range"
            aria-label="Dice Target Threshold"
            min={1}
            max={99}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-amber-400"
          />

          <div className="flex justify-between font-mono-tabular text-[11px] text-slate-400">
            <span>1</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>99</span>
          </div>
        </div>

        {/* 3 Stat Tiles */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#0c1d16] border border-emerald-500/20 p-3.5">
            <div className="text-[11px] text-slate-400">Payout Multiplier</div>
            <div className="font-mono-tabular text-xl font-bold text-amber-300 mt-0.5">
              {multiplier.toFixed(2)}x
            </div>
          </div>
          <div className="rounded-xl bg-[#0c1d16] border border-emerald-500/20 p-3.5">
            <div className="text-[11px] text-slate-400">Win Probability</div>
            <div className="font-mono-tabular text-xl font-bold text-emerald-300 mt-0.5">
              {winChance}%
            </div>
          </div>
          <div className="rounded-xl bg-[#0c1d16] border border-emerald-500/20 p-3.5">
            <div className="text-[11px] text-slate-400">Potential Return</div>
            <div className="font-mono-tabular text-xl font-bold text-white mt-0.5">
              {potentialPayout.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
