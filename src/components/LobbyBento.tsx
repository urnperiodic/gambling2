import React from 'react';
import { GameId, LUXURY_CATALOG, LuxuryItem, PlayerAccountState } from '../game/rules';
import { LuxuryItemVisual } from './LuxuryItemVisual';

interface LobbyBentoProps {
  onSelectGame: (game: GameId) => void;
  account: PlayerAccountState;
  onOpenLuxury: () => void;
  onOpenMultiplayer: () => void;
  onOpenHeist: () => void;
  roomCode: string;
  onlineCount: number;
}

function VelvetFlameBadge({ colorClass = 'text-emerald-400/90' }: { colorClass?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide whitespace-nowrap ${colorClass}`}>
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C10.5 6 7 8.5 7 13.5C7 17.09 9.91 20 13.5 20C16.54 20 19 17.54 19 14.5C19 11.5 17 8.5 15.5 6.5C15 9 13.5 10 12.5 10C13 7.5 13 4.5 12 2Z"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(245, 158, 11, 0.2)"
        />
      </svg>
      <span>Velvet Originals</span>
    </div>
  );
}

export const LobbyBento: React.FC<LobbyBentoProps> = ({
  onSelectGame,
  account,
  onOpenLuxury,
  onOpenMultiplayer,
  onOpenHeist,
  roomCode,
  onlineCount,
}) => {
  const ownedLuxuryObjects = account.ownedItems
    .map((id) => LUXURY_CATALOG.find((item) => item.id === id))
    .filter((i): i is LuxuryItem => Boolean(i));

  const showcaseItems =
    ownedLuxuryObjects.length > 0
      ? ownedLuxuryObjects.slice(0, 4)
      : [
          LUXURY_CATALOG.find((i) => i.id === 'vip-gold')!,
          LUXURY_CATALOG.find((i) => i.id === 'car-gt3rs')!,
          LUXURY_CATALOG.find((i) => i.id === 'est-penthouse')!,
          LUXURY_CATALOG.find((i) => i.id === 'car-tourbillon')!,
        ];

  return (
    <div className="w-full max-w-[1340px] mx-auto px-4 sm:px-6 py-4 space-y-5 bg-[#070d0a]">
      {/* Main 4-Column Velvet Originals Bento Grid — Collision-Proof & Animated */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* COLUMN 1: PLINKO PYRAMID (Tall Left Card) */}
        <button
          type="button"
          onClick={() => onSelectGame('PLINKO')}
          aria-label="Play Plinko Pyramid"
          className="group rounded-[26px] p-5 text-left flex flex-col justify-between border border-emerald-500/25 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[410px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400"
          style={{
            background: 'linear-gradient(180deg, #0b3b2c 0%, #0d4432 50%, #1c3a1f 100%)',
          }}
        >
          <div className="min-w-0">
            <h2 className="font-display text-base 2xl:text-lg font-bold tracking-wide text-white uppercase whitespace-nowrap">
              PLINKO PYRAMID
            </h2>
            <div className="mt-1">
              <VelvetFlameBadge colorClass="text-emerald-300/90" />
            </div>
          </div>

          {/* Center Animated Plinko Pyramid Illustration */}
          <div className="my-4 w-full flex flex-col items-center justify-center select-none">
            <div className="w-6 h-6 rounded-full mb-3 bg-amber-400 border-2 border-amber-200 animate-velvet-plinko-ball" />
            <div className="space-y-2.5 flex flex-col items-center">
              {[2, 3, 4, 5].map((count, rIdx) => (
                <div key={rIdx} className="flex items-center gap-3">
                  {Array.from({ length: count }).map((_, pIdx) => (
                    <span
                      key={pIdx}
                      className="w-2.5 h-2.5 rounded-full bg-amber-200 animate-velvet-peg"
                      style={{ animationDelay: `${(rIdx * 0.25 + pIdx * 0.12).toFixed(2)}s` }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom Multiplier Buckets: 5-Column Grid Guaranteed Never to Overflow */}
            <div className="mt-4 w-full max-w-[215px] grid grid-cols-5 gap-1 font-mono-tabular text-[10px] font-extrabold text-center">
              <span className="py-1 rounded-md bg-[#e11d48] text-white shadow">110x</span>
              <span className="py-1 rounded-md bg-[#f59e0b] text-slate-950 shadow">24x</span>
              <span className="py-1 rounded-md bg-[#fbbf24] text-slate-950 shadow">4x</span>
              <span className="py-1 rounded-md bg-[#f59e0b] text-slate-950 shadow">24x</span>
              <span className="py-1 rounded-md bg-[#e11d48] text-white shadow">110x</span>
            </div>
          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs font-semibold text-amber-300 tracking-wide whitespace-nowrap">
              1–5 Players
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-200 bg-black/45 border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors whitespace-nowrap">
              Play →
            </span>
          </div>
        </button>

        {/* COLUMN 2: ROULETTE (Top) + BRASS DICE (Bottom) */}
        <div className="flex flex-col gap-4 justify-between">
          {/* ROULETTE */}
          <button
            type="button"
            onClick={() => onSelectGame('ROULETTE')}
            aria-label="Play Roulette"
            className="group flex-1 rounded-[26px] p-5 text-left flex flex-col justify-between border border-emerald-500/20 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[197px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400"
            style={{
              background: 'linear-gradient(145deg, #0b1914 0%, #0d261d 100%)',
            }}
          >
            <div className="min-w-0">
              <h2 className="font-display text-base 2xl:text-lg font-bold tracking-wide text-white uppercase whitespace-nowrap">
                ROULETTE
              </h2>
              <div className="mt-1">
                <VelvetFlameBadge colorClass="text-slate-400" />
              </div>
            </div>

            {/* Animated Pockets 22 | 0 | 4 */}
            <div className="my-1 flex items-center justify-center gap-2.5 select-none">
              <div className="w-10 h-14 rounded-xl bg-[#e11d48] border border-rose-300/30 flex items-end justify-center pb-2 animate-velvet-float-delayed">
                <span className="font-mono-tabular text-xs font-bold text-white">22</span>
              </div>
              <div className="w-12 h-16 rounded-xl bg-[#059669] border-2 border-amber-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex flex-col items-center justify-between py-2 animate-velvet-float">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-bounce" />
                <span className="font-mono-tabular text-sm font-bold text-white">0</span>
              </div>
              <div className="w-10 h-14 rounded-xl bg-[#18181b] border border-white/15 flex items-end justify-center pb-2 animate-velvet-float-delayed">
                <span className="font-mono-tabular text-xs font-bold text-white">4</span>
              </div>
            </div>
          </button>

          {/* BRASS DICE */}
          <button
            type="button"
            onClick={() => onSelectGame('DICE')}
            aria-label="Play Brass Dice"
            className="group flex-1 rounded-[26px] p-5 text-left flex flex-col justify-between border border-emerald-500/20 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[197px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400"
            style={{
              background: 'linear-gradient(135deg, #0d231b 0%, #1c2616 100%)',
            }}
          >
            <div className="min-w-0">
              <h2 className="font-display text-base 2xl:text-lg font-bold tracking-wide text-white uppercase whitespace-nowrap">
                BRASS DICE
              </h2>
              <div className="mt-1">
                <VelvetFlameBadge colorClass="text-slate-400" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-full font-mono-tabular text-[10px] font-bold tracking-wider text-emerald-300 bg-emerald-950 border border-emerald-500/35 whitespace-nowrap shrink-0">
                98.0X MAX
              </span>

              {/* Pair of Animated Tilted Brass Dice */}
              <div className="flex items-center gap-2 pr-1 select-none shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400 p-1.5 border border-amber-200 shadow-md flex items-center justify-center animate-velvet-dice-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#be123c]" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-300 p-2 border border-amber-100 shadow-md grid grid-cols-2 gap-1 place-items-center animate-velvet-dice-right">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* COLUMN 3: BLACKJACK 21 (Top) + VIDEO POKER (Bottom) */}
        <div className="flex flex-col gap-4 justify-between">
          {/* BLACKJACK 21 */}
          <button
            type="button"
            onClick={() => onSelectGame('BLACKJACK')}
            aria-label="Play Blackjack 21"
            className="group flex-1 rounded-[26px] p-5 text-left flex flex-col justify-between border border-amber-500/25 hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[197px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400"
            style={{
              background: 'linear-gradient(135deg, #3a2710 0%, #241a0e 60%, #12241a 100%)',
            }}
          >
            <div className="min-w-0">
              <h2 className="font-display text-base 2xl:text-lg font-bold tracking-wide text-white uppercase whitespace-nowrap">
                BLACKJACK 21
              </h2>
              <div className="mt-1">
                <VelvetFlameBadge colorClass="text-amber-200/80" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider text-amber-200 bg-black/35 border border-amber-400/25 whitespace-nowrap shrink-0">
                1–5 SEATS
              </span>

              {/* Fanned & Swaying A♠ and K♦ Cards */}
              <div className="flex items-center -space-x-2 pr-1 select-none shrink-0">
                <div className="w-10 h-13 rounded-lg bg-white text-slate-950 p-1.5 border border-slate-200 shadow-md flex flex-col justify-between animate-velvet-card-left">
                  <div className="text-[10px] font-bold leading-none">A♠</div>
                  <div className="text-center text-xs leading-none">♠</div>
                </div>
                <div className="w-10 h-13 rounded-lg bg-amber-400 text-slate-950 p-1.5 border border-amber-200 shadow-md flex flex-col justify-between animate-velvet-card-right">
                  <div className="text-[10px] font-bold leading-none">K♦</div>
                  <div className="text-center text-xs text-rose-700 leading-none">♦</div>
                </div>
              </div>
            </div>
          </button>

          {/* VIDEO POKER */}
          <button
            type="button"
            onClick={() => onSelectGame('VIDEO_POKER')}
            aria-label="Play Video Poker and Texas Holdem"
            className="group flex-1 rounded-[26px] p-5 text-left flex flex-col justify-between border border-emerald-500/25 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[197px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400"
            style={{
              background: 'linear-gradient(135deg, #08271d 0%, #071d16 100%)',
            }}
          >
            <div className="min-w-0">
              <h2 className="font-display text-base 2xl:text-lg font-bold tracking-wide text-white uppercase whitespace-nowrap">
                VIDEO POKER
              </h2>
              <div className="mt-1">
                <VelvetFlameBadge colorClass="text-emerald-300/80" />
              </div>
            </div>

            {/* 4 Royal Cards with 800X Labels — Staggered Floating Wave */}
            <div className="mt-2 w-full max-w-[190px] mx-auto grid grid-cols-4 gap-1.5 select-none">
              {(['J♠', 'Q♠', 'K♠', 'A♠'] as const).map((cardText, cIdx) => (
                <div
                  key={cardText}
                  className="h-12 rounded-lg bg-white border-2 border-amber-400 p-1 flex flex-col items-center justify-between shadow animate-velvet-float"
                  style={{ animationDelay: `${(cIdx * 0.2).toFixed(1)}s` }}
                >
                  <span className="text-[10px] font-extrabold text-slate-900 leading-none">
                    {cardText}
                  </span>
                  <span className="w-full text-center rounded bg-amber-400 text-[8px] font-mono-tabular font-extrabold text-slate-950 py-0.5">
                    800X
                  </span>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* COLUMN 4: SLOTS (Tall Right Card) */}
        <button
          type="button"
          onClick={() => onSelectGame('SLOTS')}
          aria-label="Play Slots"
          className="group rounded-[26px] p-5 text-left flex flex-col justify-between border border-amber-400/35 hover:border-amber-300/75 transition-all duration-300 hover:-translate-y-1 cursor-pointer min-h-[410px] overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-300"
          style={{
            background: 'linear-gradient(180deg, #b45309 0%, #9a3412 55%, #431407 100%)',
          }}
        >
          <div className="min-w-0">
            <h2 className="font-display text-base xl:text-xl font-bold tracking-wider text-white uppercase whitespace-nowrap truncate">
              SLOTS
            </h2>
            <div className="mt-1">
              <VelvetFlameBadge colorClass="text-amber-100/90" />
            </div>
          </div>

          {/* Center Golden Reel Window with Red 7 */}
          <div className="my-4 flex items-center justify-center select-none">
            <div className="relative w-26 h-30 rounded-2xl p-2 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 border-2 border-amber-100 shadow-xl flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-300 animate-velvet-float">
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border border-amber-500" />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border border-amber-500" />
              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center shadow-inner">
                <span className="font-display text-5xl font-extrabold text-[#dc2626]">
                  7
                </span>
              </div>
            </div>
          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="font-mono-tabular text-xs font-bold tracking-wider text-amber-100 uppercase whitespace-nowrap">
              MAX 250X
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-100 bg-black/45 border border-amber-300/35 group-hover:bg-amber-300 group-hover:text-slate-950 transition-colors whitespace-nowrap">
              Spin →
            </span>
          </div>
        </button>
      </div>

      {/* Second Row: 3 Additional Velvet Originals High-Stakes Games (Royal Wheel, Mines, Baccarat) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 7. ROYAL WHEEL 50X */}
        <button
          type="button"
          onClick={() => onSelectGame('WHEEL')}
          aria-label="Play Royal Wheel 50X"
          className="group rounded-2xl p-5 text-left flex items-center justify-between gap-3 border border-amber-500/25 hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-[#12160c] overflow-hidden"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="font-display text-base xl:text-lg font-bold text-white uppercase whitespace-nowrap truncate">
              ROYAL WHEEL 50X
            </div>
            <VelvetFlameBadge colorClass="text-amber-300/80" />
            <div className="pt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full font-mono-tabular text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                24 POCKETS · 50X JACKPOT
              </span>
            </div>
          </div>
          {/* Mini Rotating Fortune Wheel SVG */}
          <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0 animate-velvet-spin-slow">
            <circle cx="32" cy="32" r="28" fill="#091510" stroke="#fbbf24" strokeWidth="3" />
            <path d="M32 32 L32 4 A28 28 0 0 1 56 18 Z" fill="#e11d48" />
            <path d="M32 32 L56 18 A28 28 0 0 1 56 46 Z" fill="#10b981" />
            <path d="M32 32 L56 46 A28 28 0 0 1 32 60 Z" fill="#eab308" />
            <path d="M32 32 L32 60 A28 28 0 0 1 8 46 Z" fill="#3b82f6" />
            <path d="M32 32 L8 46 A28 28 0 0 1 8 18 Z" fill="#a855f7" />
            <path d="M32 32 L8 18 A28 28 0 0 1 32 4 Z" fill="#eab308" />
            <circle cx="32" cy="32" r="9" fill="#091510" stroke="#fef08a" strokeWidth="2" />
            <text x="32" y="35" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="bold">
              50X
            </text>
          </svg>
        </button>

        {/* 8. DIAMOND MINES */}
        <button
          type="button"
          onClick={() => onSelectGame('MINES')}
          aria-label="Play Diamond Mines"
          className="group rounded-2xl p-5 text-left flex items-center justify-between gap-3 border border-emerald-500/25 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-[#0a1e16] overflow-hidden"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="font-display text-base xl:text-lg font-bold text-white uppercase whitespace-nowrap truncate">
              DIAMOND MINES
            </div>
            <VelvetFlameBadge colorClass="text-emerald-300/80" />
            <div className="pt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full font-mono-tabular text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                5x5 VAULT GRID
              </span>
            </div>
          </div>
          {/* 2x2 Animated Mini Vault Preview */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0 select-none animate-velvet-float">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 border border-amber-300 flex items-center justify-center text-xs shadow">
              💎
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#0f2e22] border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400">
              ?
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-700 border border-rose-300 flex items-center justify-center text-xs shadow">
              💣
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-600 border border-amber-300 flex items-center justify-center text-xs shadow">
              💎
            </span>
          </div>
        </button>

        {/* 9. MONTE CARLO BACCARAT */}
        <button
          type="button"
          onClick={() => onSelectGame('BACCARAT')}
          aria-label="Play Monte Carlo Baccarat"
          className="group rounded-2xl p-5 text-left flex items-center justify-between gap-3 border border-rose-500/25 hover:border-rose-400/60 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-[#190d12] overflow-hidden"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="font-display text-base xl:text-lg font-bold text-white uppercase whitespace-nowrap truncate">
              BACCARAT 9
            </div>
            <VelvetFlameBadge colorClass="text-rose-300/80" />
            <div className="pt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full font-mono-tabular text-[10px] font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30 whitespace-nowrap">
                PUNTO BANCO · 9:1 TIE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <div className="w-9 h-12 rounded-lg bg-sky-700 border border-sky-300 flex flex-col items-center justify-center text-white font-mono-tabular text-xs font-extrabold shadow animate-velvet-float">
              <span>P</span>
              <span>9</span>
            </div>
            <div className="w-9 h-12 rounded-lg bg-rose-700 border border-rose-300 flex flex-col items-center justify-center text-white font-mono-tabular text-xs font-extrabold shadow animate-velvet-float-delayed">
              <span>B</span>
              <span>8</span>
            </div>
          </div>
        </button>
      </div>

      {/* Third Row: Visual Luxury Garage & Estate Showroom */}
      <div className="rounded-2xl bg-[#0c1813] border border-emerald-500/20 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-amber-300">
              {ownedLuxuryObjects.length > 0
                ? `Your Acquired Luxury Collection (${ownedLuxuryObjects.length} Owned)`
                : 'Featured Velvet Boutique Showroom · Cashout Chips to USD ($) to Acquire'}
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              VIP MEMBERSHIPS, SUPERCARS, REAL ESTATE &amp; GOLD DECKS
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenHeist}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow"
            >
              {account.heistAttempted ? 'Casino Vault (1 Try Used)' : 'Rob Casino Vault (1 Try) →'}
            </button>
            <button
              type="button"
              onClick={onOpenLuxury}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              Open Luxury Boutique →
            </button>
            <button
              type="button"
              onClick={onOpenMultiplayer}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              Room {roomCode} ({onlineCount} Online) →
            </button>
          </div>
        </div>

        {/* 4 Visual Luxury Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {showcaseItems.map((item) => {
            const isOwned = account.ownedItems.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={onOpenLuxury}
                className="rounded-xl bg-[#07110d] border border-emerald-500/20 hover:border-amber-400/50 p-3 space-y-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
              >
                <LuxuryItemVisual itemId={item.id} className="w-full h-24" />
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-xs font-bold text-white truncate">
                    {item.name}
                  </span>
                  <span
                    className={`font-mono-tabular text-[10px] font-extrabold shrink-0 ${
                      isOwned ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {isOwned ? 'OWNED ✓' : `$${(item.priceCash / 1000).toLocaleString()}K`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
