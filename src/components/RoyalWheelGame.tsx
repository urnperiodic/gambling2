import React, { useState } from 'react';
import {
  ROYAL_WHEEL_SEGMENTS,
  RoyalWheelMult,
  canPlaceBet,
  spinRoyalWheel,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface RoyalWheelGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

const WHEEL_BET_OPTIONS: { mult: RoyalWheelMult; label: string; color: string; count: number }[] = [
  { mult: 1, label: '1x Gold', color: '#eab308', count: 4 },
  { mult: 2, label: '2x Emerald', color: '#10b981', count: 8 },
  { mult: 5, label: '5x Sapphire', color: '#3b82f6', count: 6 },
  { mult: 10, label: '10x Amethyst', color: '#a855f7', count: 4 },
  { mult: 50, label: '50x Jackpot Crown', color: '#e11d48', count: 2 },
];

export const RoyalWheelGame: React.FC<RoyalWheelGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  // Single segment selection only (radio behavior)
  const [selectedSegment, setSelectedSegment] = useState<RoyalWheelMult>(2);
  const [wager, setWager] = useState<number>(100);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    multiplier: RoyalWheelMult;
    pickedSegment: RoyalWheelMult;
    payout: number;
    wager: number;
  } | null>(null);
  const [history, setHistory] = useState<RoyalWheelMult[]>([2, 5, 2, 10, 1, 2, 50, 5]);

  const selectSingleSegment = (mult: RoyalWheelMult) => {
    if (spinning) return;
    soundEngine.playChipClick();
    setSelectedSegment(mult);
  };

  const handleSpinWheel = () => {
    if (spinning || wager <= 0) return;
    if (!canPlaceBet(chips, wager, creditLineEnabled)) return;

    soundEngine.playChipClick();
    setSpinning(true);
    setLastResult(null);

    const outcome = spinRoyalWheel();
    const segCount = ROYAL_WHEEL_SEGMENTS.length;
    const sliceDeg = 360 / segCount;
    const targetSegmentAngle = 360 - (outcome.segmentIndex * sliceDeg + sliceDeg / 2);
    const fullSpins = 5 * 360;
    const nextRot = rotationDeg + fullSpins + ((targetSegmentAngle - (rotationDeg % 360) + 360) % 360);
    setRotationDeg(nextRot);

    const lockedSegment = selectedSegment;
    const lockedWager = wager;

    setTimeout(() => {
      const won = outcome.multiplier === lockedSegment;
      const payout = won ? lockedWager * (outcome.multiplier + 1) : 0;

      if (payout > 0) {
        soundEngine.playWinChime(outcome.multiplier >= 10);
      } else {
        soundEngine.playLossThud();
      }

      setSpinning(false);
      setLastResult({
        multiplier: outcome.multiplier,
        pickedSegment: lockedSegment,
        payout,
        wager: lockedWager,
      });
      setHistory((prev) => [outcome.multiplier, ...prev.slice(0, 9)]);
      onSettleBet(
        lockedWager,
        payout,
        `Royal Wheel (Picked ${lockedSegment}x) landed on ${outcome.multiplier}x (${
          payout > 0 ? `Won ${payout.toLocaleString()}` : `Lost ${lockedWager.toLocaleString()}`
        })`
      );
    }, 1800);
  };

  const potentialReturn = wager * (selectedSegment + 1);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Betting Controls */}
        <div className="lg:col-span-5 rounded-3xl bg-[#0c1a14] border border-emerald-500/20 p-6 flex flex-col justify-between space-y-5 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-amber-400 block">
                  VELVET ORIGINALS · SINGLE-SEGMENT WHEEL
                </span>
                <h2 className="font-display text-2xl font-bold text-white tracking-wide">
                  ROYAL WHEEL 50X
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono-tabular font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                PICK 1 SEGMENT
              </span>
            </div>

            {/* Wager Amount Controls */}
            <div className="space-y-2">
              <label htmlFor="wheel-wager-input" className="block text-xs font-semibold text-slate-300">
                Wager Amount (Chips)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="wheel-wager-input"
                  type="number"
                  min={10}
                  disabled={spinning}
                  value={wager}
                  onChange={(e) => setWager(Math.max(10, Math.round(Number(e.target.value) || 0)))}
                  className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2 font-mono-tabular text-sm font-bold text-white"
                />
                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => setWager((w) => Math.max(10, Math.floor(w / 2)))}
                  className="px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
                >
                  1/2
                </button>
                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => setWager((w) => w * 2)}
                  className="px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
                >
                  2X
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[25, 100, 500, 2500, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={spinning}
                    onClick={() => {
                      soundEngine.playChipClick();
                      setWager(val);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono-tabular text-[11px] font-bold border transition-all cursor-pointer ${
                      wager === val
                        ? 'bg-amber-400 text-slate-950 border-amber-200 shadow'
                        : 'bg-[#07110d] text-slate-300 border-emerald-500/25 hover:border-amber-400/40'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}K` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Single-Select Multiplier Segment Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Choose 1 Target Segment (Only 1 Active)</span>
                <span className="font-mono-tabular text-amber-300 font-bold">
                  Picked: {selectedSegment}x
                </span>
              </div>

              <div className="space-y-2" role="radiogroup" aria-label="Select One Wheel Segment">
                {WHEEL_BET_OPTIONS.map((opt) => {
                  const isSelected = selectedSegment === opt.mult;
                  return (
                    <button
                      key={opt.mult}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={spinning}
                      onClick={() => selectSingleSegment(opt.mult)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-[#10291f] border-amber-400 shadow-lg scale-[1.01]'
                          : 'bg-[#07120e] hover:bg-[#0d2119] border-emerald-500/20 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-8 rounded-lg flex items-center justify-center font-mono-tabular text-xs font-extrabold text-white shadow"
                          style={{ backgroundColor: opt.color }}
                        >
                          {opt.mult}x
                        </span>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">{opt.label}</div>
                          <div className="text-[10px] text-slate-400">
                            {opt.count}/24 Pockets · Pays {opt.mult}:1
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono-tabular">
                        {isSelected ? (
                          <div>
                            <div className="text-xs font-extrabold text-amber-300">
                              SELECTED ✓
                            </div>
                            <div className="text-[10px] text-emerald-300">
                              Wins {(wager * (opt.mult + 1)).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-500">
                            Select 1
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-emerald-500/15">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Betting <strong className="text-white">{wager.toLocaleString()}</strong> on{' '}
                <strong className="text-amber-300">{selectedSegment}x</strong>
              </span>
              <span className="font-mono-tabular font-extrabold text-emerald-400">
                Win: {potentialReturn.toLocaleString()} Chips
              </span>
            </div>

            <button
              type="button"
              disabled={spinning || wager <= 0 || !canPlaceBet(chips, wager, creditLineEnabled)}
              onClick={handleSpinWheel}
              className="w-full py-4 rounded-2xl font-display text-sm font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg disabled:opacity-40 cursor-pointer"
            >
              {spinning
                ? 'WHEEL SPINNING...'
                : `SPIN ON ${selectedSegment}X (${wager.toLocaleString()} CHIPS)`}
            </button>
          </div>
        </div>

        {/* Right Wheel Visual Stage */}
        <div className="lg:col-span-7 rounded-3xl bg-[#07120e] border border-emerald-500/25 p-6 flex flex-col items-center justify-between shadow-2xl">
          {/* History Strip */}
          <div className="w-full flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/15">
            <span className="text-xs text-slate-400 font-semibold">Recent Wheel Stops:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {history.map((m, i) => {
                const cfg = WHEEL_BET_OPTIONS.find((o) => o.mult === m)!;
                return (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg font-mono-tabular text-xs font-bold text-white"
                    style={{ backgroundColor: cfg.color }}
                  >
                    {m}x
                  </span>
                );
              })}
            </div>
          </div>

          {/* SVG 24-Segment Wheel */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Top Golden Pointer */}
            <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-300 drop-shadow-lg" />

            <div
              className="w-72 h-72 sm:w-88 sm:h-88 rounded-full border-4 border-amber-400 shadow-2xl transition-transform duration-[1800ms] ease-out"
              style={{ transform: `rotate(${rotationDeg}deg)` }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {ROYAL_WHEEL_SEGMENTS.map((mult, idx) => {
                  const total = ROYAL_WHEEL_SEGMENTS.length;
                  const startAngle = (idx * 360) / total - 90;
                  const endAngle = ((idx + 1) * 360) / total - 90;
                  const rad1 = (startAngle * Math.PI) / 180;
                  const rad2 = (endAngle * Math.PI) / 180;
                  const x1 = 100 + 98 * Math.cos(rad1);
                  const y1 = 100 + 98 * Math.sin(rad1);
                  const x2 = 100 + 98 * Math.cos(rad2);
                  const y2 = 100 + 98 * Math.sin(rad2);
                  const midAngle = (startAngle + endAngle) / 2;
                  const midRad = (midAngle * Math.PI) / 180;
                  const tx = 100 + 74 * Math.cos(midRad);
                  const ty = 100 + 74 * Math.sin(midRad);
                  const cfg = WHEEL_BET_OPTIONS.find((o) => o.mult === mult)!;

                  return (
                    <g key={idx}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 98 98 0 0 1 ${x2} ${y2} Z`}
                        fill={cfg.color}
                        stroke="#050b08"
                        strokeWidth="1.2"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill="#ffffff"
                        fontSize="7.5"
                        fontWeight="800"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                      >
                        {mult}x
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="24" fill="#091510" stroke="#fbbf24" strokeWidth="3" />
                <text
                  x="100"
                  y="104"
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="Cinzel, serif"
                >
                  {selectedSegment}X
                </text>
              </svg>
            </div>
          </div>

          {/* Outcome Banner */}
          <div className="w-full text-center min-h-[36px]">
            {lastResult ? (
              <div
                className={`inline-block px-4 py-1.5 rounded-xl font-mono-tabular text-xs font-extrabold ${
                  lastResult.payout > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                }`}
              >
                Wheel Stopped on {lastResult.multiplier}x (You Picked {lastResult.pickedSegment}x) ·{' '}
                {lastResult.payout > 0
                  ? `YOU WON +${lastResult.payout.toLocaleString()} CHIPS!`
                  : `Missed (-${lastResult.wager.toLocaleString()} Chips)`}
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Pick one segment ({selectedSegment}x selected) and spin the wheel
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
