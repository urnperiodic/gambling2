import React, { useEffect, useRef, useState } from 'react';
import { PreArrestSnapshot, STARTING_CHIPS } from '../game/rules';
import { soundEngine } from '../game/sound';

interface PrisonEscapeModalProps {
  snapshot: PreArrestSnapshot;
  currentAlias: string;
  onEscapeSuccess: (newIdentityAlias: string) => void;
  onServeSentenceReset: () => void;
}

const ESCAPE_STAGES = [
  { label: 'Stage 1 · Pick Maximum-Security Cell Lock', min: 24, max: 76, speed: 1.0 },
  { label: 'Stage 2 · Slip Past Guard Tower Spotlight', min: 28, max: 72, speed: 1.25 },
  { label: 'Stage 3 · Forge New Identity Passport', min: 30, max: 70, speed: 1.45 },
];

export const PrisonEscapeModal: React.FC<PrisonEscapeModalProps> = ({
  snapshot,
  currentAlias,
  onEscapeSuccess,
  onServeSentenceReset,
}) => {
  const [newIdentityName, setNewIdentityName] = useState<string>(() => {
    const suffix = Math.floor(100 + Math.random() * 900);
    return `Phantom_${suffix}`;
  });
  const [escapeStage, setEscapeStage] = useState<number>(0);
  const [escapeStatus, setEscapeStatus] = useState<'READY' | 'ESCAPED' | 'FAILED'>('READY');

  const posRef = useRef<number>(48);
  const dirRef = useRef<number>(1);
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

      const st = ESCAPE_STAGES[stageRef.current] || ESCAPE_STAGES[0];
      posRef.current += dirRef.current * st.speed * (dt * 0.08);

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
  }, [escapeStatus]);

  const handleStrikeEscapeStep = () => {
    if (escapeStatus !== 'READY') return;
    const current = ESCAPE_STAGES[escapeStage];
    const hit = posRef.current >= current.min && posRef.current <= current.max;

    if (hit) {
      soundEngine.playWinChime(escapeStage === ESCAPE_STAGES.length - 1);
      if (escapeStage + 1 >= ESCAPE_STAGES.length) {
        setEscapeStatus('ESCAPED');
        setTimeout(() => {
          onEscapeSuccess(newIdentityName.trim() || `Ghost_${Math.floor(100 + Math.random() * 900)}`);
        }, 550);
      } else {
        setEscapeStage((prev) => prev + 1);
      }
    } else {
      // Failed the 1-try prison escape!
      soundEngine.playLossThud();
      setEscapeStatus('FAILED');
    }
  };

  const currentStage = ESCAPE_STAGES[escapeStage] || ESCAPE_STAGES[0];
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
              ? 'LOCKED IN FEDERAL DETENTION'
              : 'ARRESTED FOR DEFAULTING ON 10M+ DEBT'}
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
            You have <strong className="text-amber-300">ONE TRY</strong> to break out of prison and forge a{' '}
            <strong className="text-emerald-300">New Identity</strong>. Escape successfully to{' '}
            <strong className="text-emerald-300">keep all the money &amp; luxury items you won last time</strong>!
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
                PRISON BREAK MINIGAME · 1 TRY ONLY
              </div>
              <h3 className="font-display text-base font-bold text-white">
                ESCAPE &amp; FORGE NEW IDENTITY TO KEEP YOUR MONEY
              </h3>
            </div>

            {/* New Identity Alias Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="forged-identity-input" className="text-[11px] text-slate-300 whitespace-nowrap">
                New Identity:
              </label>
              <input
                id="forged-identity-input"
                data-testid="prison-new-identity-input"
                type="text"
                maxLength={18}
                value={newIdentityName}
                onChange={(e) => setNewIdentityName(e.target.value)}
                className="w-36 px-2.5 py-1 rounded-lg bg-[#050b08] border border-amber-400/50 text-xs font-bold text-amber-200 focus:outline-none"
              />
            </div>
          </div>

          {/* 3 Escape Checkpoints */}
          <div className="grid grid-cols-3 gap-2">
            {ESCAPE_STAGES.map((st, idx) => {
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
                  <div className="font-mono-tabular text-[10px] font-bold">STEP {idx + 1}/3</div>
                  <div className="text-[11px] font-extrabold">
                    {cleared ? 'BYPASSED ✓' : current ? 'IN PROGRESS' : 'LOCKED'}
                  </div>
                </div>
              );
            })}
          </div>

          {escapeStatus === 'READY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300">{currentStage.label}</span>
                <span className="font-mono-tabular text-amber-300">
                  Stealth Window: {currentStage.min}% – {currentStage.max}%
                </span>
              </div>

              {/* Guard Spotlight Timing Bar */}
              <div className="relative w-full h-11 rounded-xl bg-slate-950 border-2 border-emerald-500/30 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/45 border-x-2 border-emerald-300 flex items-center justify-center"
                  style={{
                    left: `${currentStage.min}%`,
                    width: `${currentStage.max - currentStage.min}%`,
                  }}
                >
                  <span className="text-[10px] font-mono-tabular font-extrabold text-emerald-100 uppercase">
                    STEALTH ZONE
                  </span>
                </div>

                <div
                  ref={pinElRef}
                  className="absolute top-0 bottom-0 w-2.5 -ml-1.25 bg-amber-300 shadow-[0_0_14px_#fde047] rounded-full"
                  style={{ left: '48%' }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  data-testid="prison-escape-strike-btn"
                  onClick={handleStrikeEscapeStep}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg cursor-pointer"
                >
                  BYPASS SECURITY LOCK ({escapeStage + 1}/3)
                </button>
                <button
                  type="button"
                  data-testid="prison-instant-escape-btn"
                  onClick={() => {
                    soundEngine.playWinChime(true);
                    setEscapeStatus('ESCAPED');
                    onEscapeSuccess(
                      newIdentityName.trim() || `Phantom_${Math.floor(100 + Math.random() * 900)}`
                    );
                  }}
                  className="px-4 py-3.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-200 font-mono-tabular text-xs font-bold cursor-pointer"
                >
                  Bribe Warden &amp; Escape Now
                </button>
              </div>
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
                CAUGHT IN THE YARD SPOTLIGHT! (1/1 Escape Try Used)
              </div>
              <div className="text-xs text-rose-200/80">
                The guards threw you in solitary confinement. You must now serve your sentence and restart at 1,000 chips.
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
