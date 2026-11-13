import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PreArrestSnapshot, STARTING_CHIPS } from '../game/rules';
import { soundEngine } from '../game/sound';

interface PrisonEscapeModalProps {
  snapshot: PreArrestSnapshot;
  currentAlias: string;
  onEscapeSuccess: (newIdentityAlias: string) => void;
  onServeSentenceReset: () => void;
}

interface EscapeStage {
  label: string;
  min: number;
  max: number;
  speed: number;
}

const ESCAPE_TIME_LIMIT_SEC = 14.0;

function generateHardEscapeStages(): EscapeStage[] {
  const specs = [
    { label: 'Stage 1 · Pick Maximum-Security Cell Lock', width: 15, speed: 1.95 },
    { label: 'Stage 2 · Evade Guard Tower Spotlight', width: 11, speed: 2.45 },
    { label: 'Stage 3 · Cut Electrified Razor Wire', width: 8, speed: 2.95 },
    { label: 'Stage 4 · Forge Sovereign Ghost Passport', width: 5.5, speed: 3.5 },
  ];

  return specs.map((spec) => {
    const min = Math.round(12 + Math.random() * (88 - spec.width - 12));
    return {
      label: spec.label,
      min,
      max: Number((min + spec.width).toFixed(1)),
      speed: spec.speed,
    };
  });
}

export const PrisonEscapeModal: React.FC<PrisonEscapeModalProps> = ({
  snapshot,
  currentAlias,
  onEscapeSuccess,
  onServeSentenceReset,
}) => {
  const escapeStages = useMemo(() => generateHardEscapeStages(), []);
  const [newIdentityName, setNewIdentityName] = useState<string>(() => {
    const suffix = Math.floor(100 + Math.random() * 900);
    return `Phantom_${suffix}`;
  });
  const [escapeStage, setEscapeStage] = useState<number>(0);
  const [escapeStatus, setEscapeStatus] = useState<'READY' | 'ESCAPED' | 'FAILED'>('READY');
  const [lockdownStarted, setLockdownStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(ESCAPE_TIME_LIMIT_SEC);
  const [failureMsg, setFailureMsg] = useState<string>(
    'CAUGHT IN THE YARD SPOTLIGHT! (1/1 Escape Try Used)'
  );

  const posRef = useRef<number>(Math.random() < 0.5 ? 10 : 90);
  const dirRef = useRef<number>(posRef.current < 50 ? 1 : -1);
  const stageRef = useRef<number>(0);
  const pinElRef = useRef<HTMLDivElement | null>(null);
  stageRef.current = escapeStage;

  useEffect(() => {
    if (escapeStatus !== 'READY') return;

    let rafId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      const st = escapeStages[stageRef.current] || escapeStages[0];
      // Guard spotlight sweeps faster across the center yard
      const centerFactor = 1 + (1 - Math.abs(posRef.current - 50) / 50) * 0.28;
      posRef.current += dirRef.current * st.speed * centerFactor * (dt * 0.088);

      if (posRef.current >= 98) {
        posRef.current = 98;
        dirRef.current = -1;
      } else if (posRef.current <= 2) {
        posRef.current = 2;
        dirRef.current = 1;
      }

      if (pinElRef.current) {
        pinElRef.current.style.left = `${posRef.current}%`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [escapeStatus, escapeStages]);

  // Once the first cell lock is breached, the 14.0s Lockdown Clock ticks relentlessly!
  useEffect(() => {
    if (!lockdownStarted || escapeStatus !== 'READY') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          soundEngine.playLossThud();
          setFailureMsg('LOCKDOWN SIREN TIMEOUT! Yard Perimeter Sealed — Escape Failed!');
          setEscapeStatus('FAILED');
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [lockdownStarted, escapeStatus]);

  const handleStrikeEscapeStep = () => {
    if (escapeStatus !== 'READY') return;
    if (!lockdownStarted) {
      setLockdownStarted(true);
    }

    const current = escapeStages[escapeStage];
    const hit = posRef.current >= current.min && posRef.current <= current.max;

    if (hit) {
      soundEngine.playWinChime(escapeStage === escapeStages.length - 1);
      if (escapeStage + 1 >= escapeStages.length) {
        setEscapeStatus('ESCAPED');
        setTimeout(() => {
          onEscapeSuccess(newIdentityName.trim() || `Ghost_${Math.floor(100 + Math.random() * 900)}`);
        }, 550);
      } else {
        posRef.current = Math.random() < 0.5 ? 6 : 94;
        dirRef.current = posRef.current < 50 ? 1 : -1;
        setEscapeStage((prev) => prev + 1);
      }
    } else {
      // Unforgiving: 1 missed lock = instant failure, solitary confinement!
      soundEngine.playLossThud();
      setFailureMsg(
        `SPOTTED AT ${current.label.toUpperCase()} (${posRef.current.toFixed(1)}% missed ${current.min}%–${current.max}%)! Escape Failed!`
      );
      setEscapeStatus('FAILED');
    }
  };

  const currentStage = escapeStages[escapeStage] || escapeStages[0];
  const keptChips = Math.max(STARTING_CHIPS, snapshot.savedChips);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Federal Prison and Escape Minigame"
      className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#16070a] border-2 border-rose-500 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white font-mono-tabular text-xs font-extrabold uppercase tracking-wider">
            {snapshot.arrestReason === 'CASINO_HEIST_CAUGHT'
              ? 'CAUGHT ROBBING THE CASINO — INSTANT ARREST'
              : 'FEDERAL GAMING COMMISSION WARRANT EXECUTED'}
          </span>
          <span className="text-xs font-mono-tabular text-rose-300">
            Inmate Alias: <strong>{currentAlias}</strong>
          </span>
        </div>

        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            {snapshot.arrestReason === 'CASINO_HEIST_CAUGHT'
              ? 'LOCKED IN MAXIMUM-SECURITY DETENTION'
              : 'ARRESTED FOR DEFAULTING ON 10M+ DEBT'}
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
            You have <strong className="text-amber-300">ONE UNFORGIVING TRY</strong> across{' '}
            <strong className="text-white">4 high-security locks</strong> to escape and forge a{' '}
            <strong className="text-emerald-300">New Identity</strong>. Succeed to keep your previous money &amp; items —{' '}
            <strong className="text-rose-400">one slip or timeout sends you to solitary!</strong>
          </p>
        </div>

        {/* Impounded Fortune Summary */}
        <div className="grid grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-300 uppercase">Saved Chips (Keep on Escape)</div>
            <div className="font-mono-tabular text-sm font-extrabold text-amber-300 mt-0.5">
              {keptChips.toLocaleString()} Chips
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-300 uppercase">Saved Cash (Keep on Escape)</div>
            <div className="font-mono-tabular text-sm font-extrabold text-emerald-400 mt-0.5">
              ${snapshot.savedCash.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/50 border border-rose-500/30">
            <div className="text-[10px] text-rose-300 uppercase">Luxury Assets Impounded</div>
            <div className="font-mono-tabular text-sm font-extrabold text-white mt-0.5">
              {snapshot.savedOwnedItems.length} Items
            </div>
          </div>
        </div>

        {/* ONE-TRY PRISON ESCAPE MINIGAME */}
        <div className="rounded-2xl bg-[#0b1310] border border-emerald-500/35 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
            <div>
              <div className="text-[10px] font-mono-tabular uppercase tracking-wider text-emerald-400">
                HARDCORE PRISON BREAK · 1 TRY ONLY · NO BRIBES
              </div>
              <h3 className="font-display text-base font-bold text-white">
                ESCAPE 4 LOCKS &amp; FORGE NEW IDENTITY
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-2.5 py-1 rounded-lg border font-mono-tabular text-xs font-extrabold ${
                  lockdownStarted && timeLeft <= 5
                    ? 'bg-rose-900 border-rose-400 text-white animate-pulse'
                    : 'bg-black/50 border-amber-400/40 text-amber-300'
                }`}
              >
                {lockdownStarted ? `${timeLeft.toFixed(1)}s` : `${ESCAPE_TIME_LIMIT_SEC.toFixed(0)}s ARMING`}
              </div>

              {/* New Identity Alias Input */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="forged-identity-input" className="text-[11px] text-slate-300 whitespace-nowrap">
                  New ID:
                </label>
                <input
                  id="forged-identity-input"
                  data-testid="prison-new-identity-input"
                  type="text"
                  maxLength={18}
                  disabled={lockdownStarted}
                  value={newIdentityName}
                  onChange={(e) => setNewIdentityName(e.target.value)}
                  className="w-32 px-2.5 py-1 rounded-lg bg-[#050b08] border border-amber-400/50 text-xs font-bold text-amber-200 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* 4 Escape Checkpoints */}
          <div className="grid grid-cols-4 gap-2">
            {escapeStages.map((st, idx) => {
              const cleared = idx < escapeStage || escapeStatus === 'ESCAPED';
              const current = idx === escapeStage && escapeStatus === 'READY';
              return (
                <div
                  key={st.label}
                  className={`p-2 rounded-xl border text-center ${
                    cleared
                      ? 'bg-emerald-900/50 border-emerald-400 text-emerald-300'
                      : current
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-black/40 border-white/10 text-slate-500'
                  }`}
                >
                  <div className="font-mono-tabular text-[10px] font-bold">LOCK {idx + 1}/4</div>
                  <div className="text-[11px] font-extrabold">
                    {cleared ? 'BYPASSED ✓' : current ? 'ACTIVE' : 'SEALED'}
                  </div>
                </div>
              );
            })}
          </div>

          {escapeStatus === 'READY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-bold text-emerald-300">{currentStage.label}</span>
                <span className="font-mono-tabular text-amber-300 whitespace-nowrap">
                  Window: {currentStage.min}% – {currentStage.max}%
                </span>
              </div>

              {/* Fast Guard Spotlight Timing Bar */}
              <div className="relative w-full h-11 rounded-xl bg-slate-950 border-2 border-emerald-500/30 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/55 border-x-2 border-emerald-300 flex items-center justify-center"
                  style={{
                    left: `${currentStage.min}%`,
                    width: `${currentStage.max - currentStage.min}%`,
                  }}
                >
                  <span className="text-[9px] font-mono-tabular font-extrabold text-emerald-100 uppercase">
                    SLIP
                  </span>
                </div>

                <div
                  ref={pinElRef}
                  className="absolute top-0 bottom-0 w-2 -ml-1 bg-amber-300 shadow-[0_0_14px_#fde047] rounded-full"
                  style={{ left: '10%' }}
                />
              </div>

              <button
                type="button"
                data-testid="prison-escape-strike-btn"
                onClick={handleStrikeEscapeStep}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg cursor-pointer"
              >
                {lockdownStarted
                  ? `BREACH LOCK (${escapeStage + 1}/4) — NO MISSES!`
                  : `STRIKE LOCK 1/4 & START ${ESCAPE_TIME_LIMIT_SEC.toFixed(0)}S BREAKOUT!`}
              </button>
            </div>
          )}

          {escapeStatus === 'ESCAPED' && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center text-emerald-200 font-bold text-sm">
              PRISON BREAK SUCCESSFUL! Escaping as {newIdentityName} with all your money intact...
            </div>
          )}

          {escapeStatus === 'FAILED' && (
            <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500 text-center space-y-1">
              <div className="text-rose-300 font-extrabold text-sm">
                {failureMsg}
              </div>
              <div className="text-xs text-rose-200/80">
                The guards threw you in solitary confinement. Your one escape chance is gone — serve your sentence and restart at 1,000 chips.
              </div>
            </div>
          )}
        </div>

        {/* Fallback: Serve Sentence & Restart at 1,000 Chips */}
        <button
          type="button"
          data-start="true"
          data-testid="serve-sentence-btn"
          onClick={onServeSentenceReset}
          className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-slate-200 font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
        >
          SURRENDER &amp; SERVE SENTENCE (RESTART AT {STARTING_CHIPS.toLocaleString()} CHIPS) →
        </button>
      </div>
    </div>
  );
};
