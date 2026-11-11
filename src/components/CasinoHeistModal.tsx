import React, { useEffect, useRef, useState } from 'react';
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

const TUMBLERS: TumblerZone[] = [
  { label: 'Tumbler 1 · Outer Vault Laser Grid', min: 26, max: 74, speed: 1.05 },
  { label: 'Tumbler 2 · Biometric Retina Lock', min: 30, max: 70, speed: 1.35 },
  { label: 'Tumbler 3 · Master Bullion Bolt', min: 32, max: 68, speed: 1.65 },
];

export const CasinoHeistModal: React.FC<CasinoHeistModalProps> = ({
  account,
  onClose,
  onHeistSuccess,
  onHeistCaughtInstantArrest,
}) => {
  const alreadyUsed = Boolean(account.heistAttempted);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVE' | 'WON' | 'CAUGHT'>(
    alreadyUsed ? 'WON' : 'ACTIVE'
  );

  const posRef = useRef<number>(48);
  const dirRef = useRef<number>(1);
  const stageRef = useRef<number>(0);
  const pinElRef = useRef<HTMLDivElement | null>(null);
  stageRef.current = stageIndex;

  useEffect(() => {
    if (alreadyUsed || status !== 'ACTIVE') return;

    let rafId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      const currentTumbler = TUMBLERS[stageRef.current] || TUMBLERS[0];
      posRef.current += dirRef.current * currentTumbler.speed * (dt * 0.085);

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
  }, [alreadyUsed, status]);

  const handleLockTumbler = () => {
    if (alreadyUsed || status !== 'ACTIVE') return;
    const currentTumbler = TUMBLERS[stageIndex];
    const hit = posRef.current >= currentTumbler.min && posRef.current <= currentTumbler.max;

    if (hit) {
      soundEngine.playWinChime(stageIndex === TUMBLERS.length - 1);
      if (stageIndex + 1 >= TUMBLERS.length) {
        setStatus('WON');
        setTimeout(() => {
          onHeistSuccess(500_000, 250_000);
        }, 700);
      } else {
        setStageIndex((prev) => prev + 1);
      }
    } else {
      // Caught at the casino -> Instant Arrest!
      soundEngine.playArrestSiren();
      setStatus('CAUGHT');
      setTimeout(() => {
        onHeistCaughtInstantArrest();
      }, 650);
    }
  };

  const currentTumbler = TUMBLERS[stageIndex] || TUMBLERS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rob the Casino Vault Minigame"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl rounded-3xl bg-[#120b0e] border-2 border-rose-500/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1c0d13] border-b border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-rose-400 block">
              ONE TRY PER IDENTITY · HIGH-RISK COVERT OPERATION
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              ROB THE VELVET CASINO VAULT
            </h2>
          </div>
          {status === 'ACTIVE' && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 cursor-pointer"
            >
              Abort ✕
            </button>
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
              {/* Stakes & Warning */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">
                    Vault Heist Payout (If Successful)
                  </div>
                  <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-white mt-0.5">
                    +500,000 Chips &amp; +$250,000 Cash
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40">
                  <div className="text-[10px] uppercase font-bold text-rose-300">
                    Penalty If Caught (1 Try Only)
                  </div>
                  <div className="font-mono-tabular text-sm sm:text-base font-extrabold text-rose-400 mt-0.5">
                    INSTANT FEDERAL ARREST
                  </div>
                </div>
              </div>

              {/* 3 Vault Tumbler Progress Pills */}
              <div className="grid grid-cols-3 gap-2">
                {TUMBLERS.map((t, idx) => {
                  const done = idx < stageIndex || status === 'WON';
                  const active = idx === stageIndex && status === 'ACTIVE';
                  return (
                    <div
                      key={t.label}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        done
                          ? 'bg-emerald-900/50 border-emerald-400 text-emerald-300'
                          : active
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-black/40 border-white/10 text-slate-500'
                      }`}
                    >
                      <div className="font-mono-tabular text-[10px] font-extrabold uppercase">
                        LOCK {idx + 1}/3
                      </div>
                      <div className="text-xs font-bold mt-0.5">
                        {done ? 'CRACKED ✓' : active ? 'ARMED' : 'LOCKED'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Laser Timing Bar */}
              <div className="rounded-2xl bg-[#090608] border border-rose-500/30 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{currentTumbler.label}</span>
                  <span className="font-mono-tabular text-emerald-400 font-bold">
                    Sweet Spot: {currentTumbler.min}% – {currentTumbler.max}%
                  </span>
                </div>

                <div className="relative w-full h-12 rounded-xl bg-rose-950/80 border-2 border-rose-500/40 overflow-hidden">
                  {/* Safe Green Target Window */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/45 border-x-2 border-emerald-300 flex items-center justify-center"
                    style={{
                      left: `${currentTumbler.min}%`,
                      width: `${currentTumbler.max - currentTumbler.min}%`,
                    }}
                  >
                    <span className="text-[10px] font-mono-tabular font-extrabold text-emerald-100 uppercase tracking-wider">
                      SAFE ZONE
                    </span>
                  </div>

                  {/* Moving Laser Pin */}
                  <div
                    ref={pinElRef}
                    className="absolute top-0 bottom-0 w-2.5 -ml-1.25 bg-amber-300 shadow-[0_0_15px_#fde047] rounded-full"
                    style={{ left: '48%' }}
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
                      CRACK TUMBLER {stageIndex + 1}/3 NOW!
                    </button>
                    <button
                      type="button"
                      data-testid="heist-trip-alarm-btn"
                      onClick={() => {
                        soundEngine.playArrestSiren();
                        setStatus('CAUGHT');
                        setTimeout(() => {
                          onHeistCaughtInstantArrest();
                        }, 300);
                      }}
                      className="px-4 py-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-mono-tabular text-xs font-bold cursor-pointer"
                    >
                      Botch &amp; Trip Laser (Instant Arrest)
                    </button>
                  </div>
                )}

                {status === 'WON' && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center text-emerald-200 font-bold text-sm">
                    VAULT CRACKED! Escaping with +500,000 Chips &amp; +$250,000 Cash...
                  </div>
                )}

                {status === 'CAUGHT' && (
                  <div className="p-3 rounded-xl bg-rose-600/30 border border-rose-400 text-center text-rose-200 font-bold text-sm">
                    LASER ALARM TRIPPED! Casino SWAT Team deployed — Instant Arrest!
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
