import React, { useState } from 'react';
import {
  SLOT_SYMBOLS,
  SlotSymbolId,
  canPlaceBet,
  spinSlotReels,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface SlotsGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

export const SlotsGame: React.FC<SlotsGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  const [wager, setWager] = useState<number>(200);
  const [reels, setReels] = useState<[SlotSymbolId, SlotSymbolId, SlotSymbolId]>(['SEVEN', 'SEVEN', 'SEVEN']);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [outcomeText, setOutcomeText] = useState<string>('Line up Triple Red 7s for the 250X Grand Jackpot!');
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerSpin = () => {
    if (spinning) return;
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient chips! Enable Underground Credit in Cashier or lower wager.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    setSpinning(true);
    setLastWinAmount(0);
    soundEngine.playChipClick();

    const nonBlankIds = SLOT_SYMBOLS.filter((s) => s.id !== 'BLANKS').map((s) => s.id);
    const cycleInterval = setInterval(() => {
      setReels([
        nonBlankIds[Math.floor(Math.random() * nonBlankIds.length)],
        nonBlankIds[Math.floor(Math.random() * nonBlankIds.length)],
        nonBlankIds[Math.floor(Math.random() * nonBlankIds.length)],
      ]);
    }, 75);

    setTimeout(() => {
      clearInterval(cycleInterval);
      const result = spinSlotReels();
      const payout = Math.round(wager * result.multiplier);
      setReels(result.reels);
      setSpinning(false);
      setLastWinAmount(payout);
      setOutcomeText(
        payout > 0
          ? `${result.outcomeLabel} — Won ${payout.toLocaleString()} Chips!`
          : `${result.outcomeLabel} — Try again!`
      );

      if (payout > 0) {
        soundEngine.playWinChime(result.multiplier >= 18);
      } else {
        soundEngine.playLossThud();
      }

      onSettleBet(
        wager,
        payout,
        `Velvet Slots: ${result.outcomeLabel} — ${
          payout > 0 ? `Won ${payout.toLocaleString()}` : `Lost ${wager.toLocaleString()}`
        } chips`
      );
    }, 520);
  };

  const getSymbolDisplay = (id: SlotSymbolId) => {
    return SLOT_SYMBOLS.find((s) => s.id === id) || SLOT_SYMBOLS[0];
  };

  return (
    <div className="w-full max-w-[1260px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Paytable & Wager Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#1c0f08] border border-amber-500/30 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-amber-300">Velvet Originals</div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              VELVET 777 SLOTS
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full font-mono-tabular text-xs font-bold text-amber-200 bg-amber-950 border border-amber-400/40">
            MAX 250X
          </span>
        </div>

        {/* Paytable */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-amber-200/80">Official Reel Paytable</div>
          {SLOT_SYMBOLS.filter((s) => s.threeKindMultiplier > 0).map((sym) => (
            <div
              key={sym.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs"
            >
              <span className="font-bold text-white">
                {sym.label} {sym.label} {sym.label} ({sym.id})
              </span>
              <span className="font-mono-tabular font-extrabold text-amber-300">
                {sym.threeKindMultiplier}X
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs">
            <span className="text-slate-300">Any Two 7s</span>
            <span className="font-mono-tabular font-bold text-amber-300">4X</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs">
            <span className="text-slate-300">Any Two Cherries</span>
            <span className="font-mono-tabular font-bold text-amber-300">1.5X</span>
          </div>
        </div>

        {/* Wager Input */}
        <div className="space-y-2">
          <label htmlFor="slots-wager" className="block text-xs font-semibold text-amber-100">
            Spin Wager (Chips)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="slots-wager"
              type="number"
              min={10}
              value={wager}
              onChange={(e) => setWager(Math.max(10, Math.round(Number(e.target.value) || 0)))}
              className="w-full rounded-xl bg-black/60 border border-amber-500/35 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
            />
            <button
              type="button"
              onClick={() => setWager((w) => Math.max(10, Math.floor(w / 2)))}
              className="px-3 py-2.5 rounded-xl bg-amber-950/80 border border-amber-500/30 text-xs font-mono-tabular font-bold text-amber-200 cursor-pointer"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => setWager((w) => w * 2)}
              className="px-3 py-2.5 rounded-xl bg-amber-950/80 border border-amber-500/30 text-xs font-mono-tabular font-bold text-amber-200 cursor-pointer"
            >
              2X
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
          onClick={triggerSpin}
          disabled={spinning}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-extrabold text-sm shadow-xl cursor-pointer"
        >
          {spinning ? 'Spinning Reels...' : `SPIN REELS (${wager.toLocaleString()} Chips)`}
        </button>
      </div>

      {/* Right Golden Mechanical Reel Cabinet */}
      <div
        className="lg:col-span-8 rounded-2xl border border-amber-400/40 p-8 flex flex-col items-center justify-between min-h-[430px]"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, #b45309 0%, #7c2d12 55%, #270e05 100%)',
        }}
      >
        <div className="text-center space-y-1">
          <div className="font-mono-tabular text-xs font-bold tracking-widest text-amber-200 uppercase">
            GRAND JACKPOT PAYS {(wager * 250).toLocaleString()} CHIPS
          </div>
          <h3 className="font-display text-2xl font-extrabold text-white">
            {outcomeText}
          </h3>
        </div>

        {/* 3 Golden Reel Windows */}
        <div className="my-6 relative flex items-center justify-center gap-4 sm:gap-6 p-5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-2xl border-2 border-amber-200">
          {/* Center Payline Indicator Diamonds */}
          <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rotate-45 border-2 border-amber-600 shadow-md" />
          <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rotate-45 border-2 border-amber-600 shadow-md" />

          {reels.map((symbolId, idx) => {
            const sym = getSymbolDisplay(symbolId);
            return (
              <div
                key={idx}
                className="w-24 sm:w-32 h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-slate-200 via-white to-slate-200 shadow-inner border-2 border-amber-600/40 flex flex-col items-center justify-center select-none overflow-hidden"
              >
                <span
                  className={`font-display text-4xl sm:text-6xl font-extrabold transition-transform duration-200 ${
                    spinning ? 'animate-velvet-slot-spin' : 'scale-100'
                  }`}
                  style={{ color: sym.color }}
                >
                  {sym.label}
                </span>
                <span className="text-[10px] font-mono-tabular font-bold text-slate-500 mt-1">
                  {sym.id}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/45 border border-amber-300/25 text-xs">
          <span className="text-amber-100">
            Last Spin Win:{' '}
            <strong className="font-mono-tabular text-amber-300">
              {lastWinAmount.toLocaleString()} Chips
            </strong>
          </span>
          <span className="font-mono-tabular text-amber-200/80">Single Center Payline</span>
        </div>
      </div>
    </div>
  );
};
