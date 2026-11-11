import React, { useEffect, useRef, useState } from 'react';
import {
  PLINKO_MULTIPLIERS,
  PlinkoRisk,
  canPlaceBet,
  samplePlinkoPath,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface PlinkoGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

interface ActiveBall {
  id: string;
  wager: number;
  directions: number[];
  bucketIndex: number;
  multiplier: number;
  progress: number; // 0 to rows
  x: number;
  y: number;
  settled: boolean;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  const [wager, setWager] = useState<number>(100);
  const [rows, setRows] = useState<number>(8);
  const [risk, setRisk] = useState<PlinkoRisk>('HIGH');
  const [recentHits, setRecentHits] = useState<{ id: string; mult: number; profit: number }[]>([]);
  const [activeBucketFlash, setActiveBucketFlash] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<ActiveBall[]>([]);
  const settleCallbackRef = useRef(onSettleBet);
  settleCallbackRef.current = onSettleBet;

  const multipliers = PLINKO_MULTIPLIERS[risk][rows] || PLINKO_MULTIPLIERS.HIGH[8];

  const dropBall = (count = 1) => {
    const totalNeeded = wager * count;
    if (!canPlaceBet(chips, totalNeeded, creditLineEnabled)) {
      setErrorMsg('Insufficient chips! Enable Underground Credit in Cashier or lower your bet.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playChipClick();

    for (let i = 0; i < count; i++) {
      const sampled = samplePlinkoPath(rows, risk);
      ballsRef.current.push({
        id: `ball-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        wager,
        directions: sampled.directions,
        bucketIndex: sampled.bucketIndex,
        multiplier: sampled.multiplier,
        progress: -i * 0.35, // Stagger multi-ball drops smoothly
        x: 0,
        y: 0,
        settled: false,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle radial glow behind pyramid
      const grad = ctx.createRadialGradient(
        width / 2,
        height * 0.55,
        20,
        width / 2,
        height * 0.55,
        width * 0.45
      );
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.06)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const topMargin = 48;
      const bottomMargin = 68;
      const usableHeight = height - topMargin - bottomMargin;
      const rowSpacing = usableHeight / rows;
      const maxCols = rows + 2;
      const colSpacing = Math.min(48, (width - 80) / maxCols);

      // Draw Pyramid Pegs
      for (let r = 0; r < rows; r++) {
        const pegsInRow = r + 3;
        const rowY = topMargin + (r + 0.5) * rowSpacing;
        const rowWidth = (pegsInRow - 1) * colSpacing;
        const startX = width / 2 - rowWidth / 2;

        for (let c = 0; c < pegsInRow; c++) {
          const pegX = startX + c * colSpacing;
          ctx.beginPath();
          ctx.arc(pegX, rowY, rows <= 8 ? 5.5 : rows <= 12 ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fde68a';
          ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Update & Draw Active Balls
      const speed = rows <= 8 ? 4.8 : rows <= 12 ? 6.2 : 7.8;
      const remainingBalls: ActiveBall[] = [];

      for (const ball of ballsRef.current) {
        const prevFloor = Math.floor(ball.progress);
        ball.progress += dt * speed;
        const currentFloor = Math.floor(ball.progress);

        if (currentFloor > prevFloor && currentFloor >= 0 && currentFloor < rows) {
          soundEngine.playPegPing(currentFloor / rows);
        }

        if (ball.progress < 0) {
          remainingBalls.push(ball);
          continue;
        }

        const clampedProgress = Math.min(rows, ball.progress);
        const rIdx = Math.min(rows - 1, Math.floor(clampedProgress));
        const frac = clampedProgress - rIdx;

        // Calculate horizontal offset in peg units
        let rightCountBefore = 0;
        for (let i = 0; i < rIdx; i++) {
          rightCountBefore += ball.directions[i] || 0;
        }
        const currentDir = ball.directions[rIdx] ?? 0;

        const colOffsetBefore = rightCountBefore - rIdx / 2;
        const colOffsetAfter = rightCountBefore + currentDir - (rIdx + 1) / 2;
        const interpColOffset = colOffsetBefore + (colOffsetAfter - colOffsetBefore) * frac;

        // Parabolic bounce arc between rows
        const bounceArc = Math.sin(frac * Math.PI) * -6;
        const bx = width / 2 + interpColOffset * colSpacing;
        const by = topMargin + clampedProgress * rowSpacing + bounceArc;

        // Draw Ball
        ctx.beginPath();
        ctx.arc(bx, by, rows <= 8 ? 9 : 7, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 9);
        ballGrad.addColorStop(0, '#fef08a');
        ballGrad.addColorStop(0.5, '#f59e0b');
        ballGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = ballGrad;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (ball.progress >= rows && !ball.settled) {
          ball.settled = true;
          const payout = Math.round(ball.wager * ball.multiplier);
          const profit = payout - ball.wager;
          if (ball.multiplier >= 4) {
            soundEngine.playWinChime(ball.multiplier >= 24);
          }
          setActiveBucketFlash(ball.bucketIndex);
          setRecentHits((prev) => [
            { id: ball.id, mult: ball.multiplier, profit },
            ...prev.slice(0, 7),
          ]);
          settleCallbackRef.current(
            ball.wager,
            payout,
            `Plinko Pyramid (${risk}) hit ${ball.multiplier}x for ${payout.toLocaleString()} chips`
          );
        } else if (ball.progress < rows) {
          remainingBalls.push(ball);
        }
      }

      ballsRef.current = remainingBalls;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [rows, risk]);

  return (
    <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-emerald-500/20 p-5 space-y-5">
        <div>
          <div className="text-xs font-medium text-emerald-400">Velvet Originals</div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            PLINKO PYRAMID
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Center-weighted pyramid pegs. Edge slots pay up to 1,000x on 16-row High Risk.
          </p>
        </div>

        {/* Bet Amount Input */}
        <div className="space-y-2">
          <label htmlFor="plinko-wager" className="block text-xs font-semibold text-slate-300">
            Wager Per Ball (Chips)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="plinko-wager"
              type="number"
              min={10}
              step={50}
              value={wager}
              onChange={(e) => setWager(Math.max(10, Math.round(Number(e.target.value) || 0)))}
              className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => setWager((w) => Math.max(10, Math.floor(w / 2)))}
              className="px-3 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 hover:bg-emerald-900 cursor-pointer"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => setWager((w) => w * 2)}
              className="px-3 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 hover:bg-emerald-900 cursor-pointer"
            >
              2X
            </button>
            <button
              type="button"
              onClick={() => setWager(Math.max(100, chips > 0 ? chips : 100_000))}
              className="px-3 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/35 text-xs font-mono-tabular font-bold text-amber-300 hover:bg-amber-500/30 cursor-pointer"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Risk Level Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Volatility &amp; Risk</span>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#07110d] border border-emerald-500/20">
            {(['LOW', 'MEDIUM', 'HIGH'] as PlinkoRisk[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRisk(r)}
                className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  risk === r
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Pyramid Rows Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Pyramid Depth (Rows)</span>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#07110d] border border-emerald-500/20">
            {[8, 12, 16].map((rowCount) => (
              <button
                key={rowCount}
                type="button"
                onClick={() => setRows(rowCount)}
                className={`py-2 rounded-lg font-mono-tabular text-xs font-bold transition-colors cursor-pointer ${
                  rows === rowCount
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rowCount} Rows
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Primary Drop Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => dropBall(1)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
          >
            Drop Plinko Ball ({wager.toLocaleString()} Chips)
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => dropBall(5)}
              className="py-2.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 font-semibold text-xs border border-emerald-500/30 cursor-pointer"
            >
              Drop 5x Burst
            </button>
            <button
              type="button"
              onClick={() => dropBall(10)}
              className="py-2.5 rounded-xl bg-rose-900/70 hover:bg-rose-800 text-rose-100 font-semibold text-xs border border-rose-500/30 cursor-pointer"
            >
              Drop 10x High-Roller Volley
            </button>
          </div>
        </div>

        {/* Recent Drops Feed */}
        <div className="pt-2 border-t border-emerald-500/15 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Recent Multiplier Hits</div>
          {recentHits.length === 0 ? (
            <div className="text-xs text-slate-500">Drop a ball to record multiplier hits.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {recentHits.map((h) => (
                <span
                  key={h.id}
                  className={`px-2.5 py-1 rounded-lg font-mono-tabular text-xs font-bold ${
                    h.mult >= 10
                      ? 'bg-rose-600 text-white'
                      : h.mult >= 2
                      ? 'bg-amber-400 text-slate-950'
                      : h.mult >= 1
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {h.mult}x
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pyramid Canvas Stage */}
      <div className="lg:col-span-8 rounded-2xl bg-[#081510] border border-emerald-500/25 p-5 flex flex-col items-center justify-between">
        <canvas
          ref={canvasRef}
          width={760}
          height={430}
          data-testid="plinko-canvas"
          className="w-full max-w-[760px] h-auto aspect-[760/430]"
        />

        {/* Multiplier Buckets Strip */}
        <div className="w-full max-w-[720px] flex items-center justify-center gap-1 sm:gap-1.5 pt-2 overflow-x-auto">
          {multipliers.map((mult, idx) => {
            const isEdge = idx === 0 || idx === multipliers.length - 1;
            const isNearEdge = idx === 1 || idx === multipliers.length - 2;
            const isFlashing = activeBucketFlash === idx;

            let bgClass = 'bg-amber-300 text-slate-950';
            if (isEdge || mult >= 25) bgClass = 'bg-[#e11d48] text-white';
            else if (isNearEdge || mult >= 4) bgClass = 'bg-[#f59e0b] text-slate-950';
            else if (mult < 1) bgClass = 'bg-emerald-950 text-emerald-200 border border-emerald-500/30';

            return (
              <div
                key={idx}
                className={`flex-1 min-w-[34px] py-2 px-1 rounded-lg text-center font-mono-tabular text-[11px] font-extrabold transition-transform duration-150 ${bgClass} ${
                  isFlashing ? 'scale-115 ring-2 ring-white' : ''
                }`}
              >
                {mult}x
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
