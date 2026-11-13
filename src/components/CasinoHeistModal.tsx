import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlayerAccountState } from '../game/rules';
import { soundEngine } from '../game/sound';

interface CasinoHeistModalProps {
  account: PlayerAccountState;
  onClose: () => void;
  onHeistSuccess: (chipsStolen: number, cashStolen: number) => void;
  onHeistCaughtInstantArrest: () => void;
}

interface TumblerZone {
  label: string;
  min: number;
  max: number;
  speed: number;
}

const HEIST_TIME_LIMIT_SEC = 15.0;

function generateHardTumblers(): TumblerZone[] {
  const specs = [
    { label: 'Lock 1 · Thermal Laser Matrix', width: 15, speed: 1.95 },
    { label: 'Lock 2 · Biometric Iris Scanner', width: 11, speed: 2.4 },
    { label: 'Lock 3 · Dual Seismic Tumblers', width: 8, speed: 2.95 },
    { label: 'Lock 4 · Sovereign Bullion Core', width: 5.5, speed: 3.45 },
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

export const CasinoHeistModal: React.FC<CasinoHeistModalProps> = ({
  account,
  onClose,
  onHeistSuccess,
  onHeistCaughtInstantArrest,
}) => {
  const alreadyUsed = Boolean(account.heistAttempted);
  const tumblers = useMemo(() => generateHardTumblers(), []);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVE' | 'WON' | 'CAUGHT'>(
    alreadyUsed ? 'WON' : 'ACTIVE'
  );
  const [timeLeft, setTimeLeft] = useState<number>(HEIST_TIME_LIMIT_SEC);
  const [missReason, setMissReason] = useState<string>(
    'LASER ALARM TRIPPED! Casino SWAT Team deployed — Instant Arrest!'
  );

  const posRef = useRef<number>(Math.random() < 0.5 ? 12 : 88);
  const dirRef = useRef<number>(posRef.current < 50 ? 1 : -1);
  const stageRef = useRef<number>(0);
  const pinElRef = useRef<HTMLDivElement | null>(null);
  const caughtTriggeredRef = useRef<boolean>(false);
  stageRef.current = stageIndex;

  useEffect(() => {
    if (alreadyUsed || status !== 'ACTIVE') return;

    let rafId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      const currentTumbler = tumblers[stageRef.current] || tumblers[0];
      // Dynamic speed surge near the middle makes timing genuinely demanding
      const centerDist = Math.abs(posRef.current - 50) / 50;
      const surge = 1 + (1 - centerDist) * 0.25;
      posRef.current += dirRef.current * currentTumbler.speed * surge * (dt * 0.088);

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
  }, [alreadyUsed, status, tumblers]);

  // Strict SWAT breach countdown timer
  useEffect(() => {
    if (alreadyUsed || status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        if (next <= 0 && !caughtTriggeredRef.current) {
          caughtTriggeredRef.current = true;
          soundEngine.playArrestSiren();
          setMissReason('SECURITY TIMER EXPIRED! Vault sealed & Casino SWAT breached — Instant Arrest!');
          setStatus('CAUGHT');
          setTimeout(() => {
            onHeistCaughtInstantArrest();
          }, 650);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [alreadyUsed, status, onHeistCaughtInstantArrest]);

  const handleLockTumbler = () => {
    if (alreadyUsed || status !== 'ACTIVE' || caughtTriggeredRef.current) return;
    const currentTumbler = tumblers[stageIndex];
    const hit = posRef.current >= currentTumbler.min && posRef.current <= currentTumbler.max;

    if (hit) {
      soundEngine.playWinChime(stageIndex === tumblers.length - 1);
      if (stageIndex + 1 >= tumblers.length) {
        setStatus('WON');
        setTimeout(() => {
          onHeistSuccess(350_000, 150_000);
        }, 700);
      } else {
        // Randomize next starting side so you cannot predict rhythm effortlessly
        posRef.current = Math.random() < 0.5 ? 5 : 95;
        dirRef.current = posRef.current < 50 ? 1 : -1;
        setStageIndex((prev) => prev + 1);
      }
    } else {
      // Unforgiving: 1 miss = Instant Arrest!
      caughtTriggeredRef.current = true;
      soundEngine.playArrestSiren();
      setMissReason(
        `TRIPPED ${currentTumbler.label.toUpperCase()} (${posRef.current.toFixed(1)}% missed ${currentTumbler.min}%–${currentTumbler.max}%) — Instant Arrest!`
      );
      setStatus('CAUGHT');
      setTimeout(() => {
        onHeistCaughtInstantArrest();
      }, 650);
    }
  };

  const currentTumbler = tumblers[stageIndex] || tumblers[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rob the Casino Vault Minigame"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl rounded-3xl bg-[#120b0e] border-2 border-rose-500/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1c0d13] border-b border-rose-500/30 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-rose-400 block">
              ONE TRY PER IDENTITY · ZERO MARGIN FOR ERROR
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              ROB THE VELVET CASINO VAULT
            </h2>
          </div>
          {status === 'ACTIVE' && stageIndex === 0 && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 cursor-pointer shrink-0"
            >
              Back Out ✕
            </button>
          )}
          {status === 'ACTIVE' && stageIndex > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-500/50 text-[11px] font-mono-tabular font-bold text-rose-300 shrink-0">
              LOCKED IN — NO RETREAT
            </span>
          )}
        </div>

        <div className="p-6 space-y-5">
          {alreadyUsed ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono-tabular text-xs font-bold">
                HEIST TRY ALREADY USED FOR IDENTITY: {account.alias}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                You only get <strong className="text-white">one try</strong> to rob the casino per identity.
                If you get arrested and escape prison with a <strong className="text-emerald-300">New Identity</strong>, your vault record resets!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Return to Casino Floor
              </button>
            </div>
          ) : (
            <>
              {/* Stakes & Countdown */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">
                    Vault Haul
                  </div>
                  <div className="font-mono-tabular text-xs sm:text-sm font-extrabold text-white mt-0.5">
                    +350K Chips &amp; +$150K
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40">
                  <div className="text-[10px] uppercase font-bold text-rose-300">
                    Single Miss
                  </div>
                  <div className="font-mono-tabular text-xs sm:text-sm font-extrabold text-rose-400 mt-0.5">
                    INSTANT ARREST
                  </div>
                </div>
                <div
                  className={`p-3 rounded-2xl border ${
                    timeLeft <= 5
                      ? 'bg-rose-900/70 border-rose-400 animate-pulse'
                      : 'bg-amber-950/50 border-amber-500/40'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-300">
                    SWAT Breach Timer
                  </div>
                  <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-white mt-0.5">
                    {timeLeft.toFixed(1)}s
                  </div>
                </div>
              </div>

              {/* 4 Vault Lock Progress Pills */}
              <div className="grid grid-cols-4 gap-2">
                {tumblers.map((t, idx) => {
                  const done = idx < stageIndex || status === 'WON';
                  const active = idx === stageIndex && status === 'ACTIVE';
                  return (
                    <div
                      key={t.label}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        done
                          ? 'bg-emerald-900/50 border-emerald-400 text-emerald-300'
                          : active
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-black/40 border-white/10 text-slate-500'
                      }`}
                    >
                      <div className="font-mono-tabular text-[10px] font-extrabold uppercase">
                        LOCK {idx + 1}/4
                      </div>
                      <div className="text-[11px] font-bold mt-0.5">
                        {done ? 'CRACKED ✓' : active ? 'ARMED' : 'SEALED'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Precision Timing Bar */}
              <div className="rounded-2xl bg-[#090608] border border-rose-500/30 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-bold text-amber-300">{currentTumbler.label}</span>
                  <span className="font-mono-tabular text-emerald-400 font-bold whitespace-nowrap">
                    Window: {currentTumbler.min}% – {currentTumbler.max}%
                  </span>
                </div>

                <div className="relative w-full h-12 rounded-xl bg-rose-950/80 border-2 border-rose-500/40 overflow-hidden">
                  {/* Razor-Narrow Safe Green Target Window */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/55 border-x-2 border-emerald-300 flex items-center justify-center"
                    style={{
                      left: `${currentTumbler.min}%`,
                      width: `${currentTumbler.max - currentTumbler.min}%`,
                    }}
                  >
                    <span className="text-[9px] font-mono-tabular font-extrabold text-emerald-100 uppercase">
                      HIT
                    </span>
                  </div>

                  {/* Fast Laser Pin */}
                  <div
                    ref={pinElRef}
                    className="absolute top-0 bottom-0 w-2 -ml-1 bg-amber-300 shadow-[0_0_15px_#fde047] rounded-full"
                    style={{ left: '12%' }}
                  />
                </div>

                {status === 'ACTIVE' && (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      data-testid="heist-lock-btn"
                      onClick={handleLockTumbler}
                      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-extrabold text-sm tracking-wider uppercase shadow-xl cursor-pointer"
                    >
                      CRACK LOCK {stageIndex + 1}/4 NOW!
                    </button>
                    <button
                      type="button"
                      data-testid="heist-trip-alarm-btn"
                      onClick={() => {
                        if (caughtTriggeredRef.current) return;
                        caughtTriggeredRef.current = true;
                        soundEngine.playArrestSiren();
                        setStatus('CAUGHT');
                        setTimeout(() => {
                          onHeistCaughtInstantArrest();
                        }, 300);
                      }}
                      className="px-4 py-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-mono-tabular text-xs font-bold cursor-pointer"
                    >
                      Surrender (Instant Arrest)
                    </button>
                  </div>
                )}

                {status === 'WON' && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center text-emerald-200 font-bold text-sm">
                    VAULT CRACKED! Escaping with +350,000 Chips &amp; +$150,000 Cash...
                  </div>
                )}

                {status === 'CAUGHT' && (
                  <div className="p-3 rounded-xl bg-rose-600/30 border border-rose-400 text-center text-rose-200 font-bold text-sm">
                    {missReason}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
