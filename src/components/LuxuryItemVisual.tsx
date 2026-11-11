import React from 'react';

interface LuxuryItemVisualProps {
  itemId: string;
  className?: string;
}

export const LuxuryItemVisual: React.FC<LuxuryItemVisualProps> = ({
  itemId,
  className = 'w-full h-32',
}) => {
  switch (itemId) {
    case 'vip-silver':
    case 'vip-gold':
    case 'vip-obsidian': {
      const isGold = itemId === 'vip-gold';
      const isObsidian = itemId === 'vip-obsidian';
      const bgGrad = isObsidian
        ? 'linear-gradient(135deg, #18181b 0%, #09090b 60%, #4c0519 100%)'
        : isGold
        ? 'linear-gradient(135deg, #fde047 0%, #eab308 50%, #a16207 100%)'
        : 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 55%, #475569 100%)';
      const borderCol = isObsidian ? '#f43f5e' : isGold ? '#fef08a' : '#cbd5e1';
      const textCol = isObsidian ? '#fda4af' : '#09090b';

      return (
        <div
          className={`${className} rounded-xl p-3 flex items-center justify-center bg-[#050c09] border border-emerald-500/15 overflow-hidden select-none`}
        >
          <div
            className="w-48 h-26 rounded-xl p-3 flex flex-col justify-between shadow-xl border"
            style={{ background: bgGrad, borderColor: borderCol, color: textCol }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[10px] font-extrabold tracking-widest uppercase">
                VELVET SYNDICATE
              </span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4.5 rounded bg-amber-200/80 border border-black/20" />
              <span className="font-mono-tabular text-[10px] font-bold tracking-widest">
                {isObsidian ? '0001 • SOVEREIGN' : isGold ? '8888 • BULLION' : '4290 • SILVER'}
              </span>
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-85">
              {isObsidian ? 'OBSIDIAN BLACK KEY' : isGold ? '24K GOLD MEMBER' : 'PRIORITY FLOOR PASS'}
            </div>
          </div>
        </div>
      );
    }

    case 'car-gt3rs':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#071f17] to-[#050e0b] border border-emerald-500/25 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            {/* Road Reflection */}
            <ellipse cx="120" cy="82" rx="95" ry="6" fill="rgba(16, 185, 129, 0.2)" />
            {/* Rear GT Wing */}
            <path d="M22 44 L36 44 L32 58 L26 58 Z" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <rect x="16" y="40" width="24" height="4" rx="1.5" fill="#10b981" />
            {/* Aerodynamic Coupe Body */}
            <path
              d="M25 65 L38 50 L78 46 L112 32 L158 34 L192 50 L218 56 L222 72 L198 76 L42 76 L22 72 Z"
              fill="#10b981"
              stroke="#6ee7b7"
              strokeWidth="1.5"
            />
            {/* Cabin Glass */}
            <path d="M84 46 L114 35 L154 37 L178 49 Z" fill="#091510" stroke="#34d399" strokeWidth="1" />
            {/* Side Carbon Vent & Stripe */}
            <path d="M62 68 L175 68" stroke="#064e3b" strokeWidth="3" />
            <polygon points="145,54 162,54 158,64 142,64" fill="#064e3b" />
            {/* Forged Magnesium Gold Wheels */}
            <circle cx="65" cy="74" r="14" fill="#09090b" stroke="#fbbf24" strokeWidth="3" />
            <circle cx="65" cy="74" r="5" fill="#f59e0b" />
            <circle cx="182" cy="74" r="14" fill="#09090b" stroke="#fbbf24" strokeWidth="3" />
            <circle cx="182" cy="74" r="5" fill="#f59e0b" />
          </svg>
        </div>
      );

    case 'car-spectre':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#231909] to-[#0a0805] border border-amber-500/25 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            <ellipse cx="120" cy="83" rx="98" ry="6" fill="rgba(245, 158, 11, 0.22)" />
            {/* Long Coachwork Body */}
            <path
              d="M18 60 L30 48 L72 46 L96 33 L156 33 L180 46 L220 48 L224 72 L205 76 L26 76 Z"
              fill="#18181b"
              stroke="#fbbf24"
              strokeWidth="1.8"
            />
            {/* Two-Tone Champagne Upper */}
            <path d="M30 48 L220 48 L222 57 L24 57 Z" fill="#f59e0b" opacity="0.85" />
            {/* Cabin */}
            <path d="M98 36 L152 36 L172 46 L78 46 Z" fill="#09090b" stroke="#fde047" strokeWidth="1.2" />
            {/* Upright Pantheon Grille */}
            <rect x="218" y="49" width="6" height="19" rx="1" fill="#fef08a" />
            {/* Luxury Dish Wheels */}
            <circle cx="60" cy="74" r="14" fill="#09090b" stroke="#fde047" strokeWidth="3" />
            <circle cx="60" cy="74" r="7" fill="#d97706" />
            <circle cx="186" cy="74" r="14" fill="#09090b" stroke="#fde047" strokeWidth="3" />
            <circle cx="186" cy="74" r="7" fill="#d97706" />
          </svg>
        </div>
      );

    case 'car-tourbillon':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#280919] to-[#090508] border border-pink-500/30 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            <ellipse cx="120" cy="83" rx="98" ry="6" fill="rgba(236, 72, 153, 0.25)" />
            {/* Hypercar Low Slung Silhouette */}
            <path
              d="M18 66 L42 46 L96 32 L152 32 L202 52 L226 62 L220 75 L24 75 Z"
              fill="#0f172a"
              stroke="#f43f5e"
              strokeWidth="2"
            />
            {/* Signature C-Line */}
            <path
              d="M95 33 C135 33, 145 72, 100 72"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Canopy */}
            <path d="M88 45 L108 35 L148 35 L176 48 Z" fill="#be123c" opacity="0.55" />
            {/* Hypercar Wheels */}
            <circle cx="62" cy="74" r="15" fill="#09090b" stroke="#f43f5e" strokeWidth="3" />
            <circle cx="62" cy="74" r="5" fill="#fbbf24" />
            <circle cx="184" cy="74" r="15" fill="#09090b" stroke="#f43f5e" strokeWidth="3" />
            <circle cx="184" cy="74" r="5" fill="#fbbf24" />
          </svg>
        </div>
      );

    case 'est-penthouse':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#081c29] to-[#061017] border border-sky-500/30 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            {/* Night Stars & Moon */}
            <circle cx="38" cy="22" r="8" fill="#fde047" opacity="0.8" />
            {/* Triplex Sky Tower */}
            <rect x="75" y="16" width="90" height="66" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Glowing Penthouse Terraces */}
            <rect x="65" y="24" width="110" height="12" rx="2" fill="#0284c7" stroke="#bae6fd" strokeWidth="1" />
            <rect x="70" y="42" width="100" height="12" rx="2" fill="#0369a1" stroke="#7dd3fc" strokeWidth="1" />
            <rect x="82" y="60" width="76" height="14" rx="1" fill="#fbbf24" opacity="0.8" />
            {/* Harbor Water Reflection */}
            <path d="M10 84 L230 84" stroke="#38bdf8" strokeWidth="2" />
            <path d="M40 90 L200 90" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 4" />
          </svg>
        </div>
      );

    case 'est-villa':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#1f102b] to-[#09060e] border border-purple-500/30 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            {/* Classical Pediment Roof */}
            <polygon points="120,14 55,40 185,40" fill="#d97706" stroke="#fef08a" strokeWidth="1.5" />
            {/* Palazzo Facade */}
            <rect x="62" y="40" width="116" height="42" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Arched Windows & Columns */}
            {[76, 98, 120, 142, 164].map((x) => (
              <rect key={x} x={x - 5} y="48" width="10" height="28" rx="5" fill="#fde047" opacity="0.85" />
            ))}
            {/* Cypress Trees */}
            <ellipse cx="42" cy="58" rx="7" ry="24" fill="#047857" />
            <ellipse cx="198" cy="58" rx="7" ry="24" fill="#047857" />
            {/* Lake Como Water */}
            <path d="M15 84 L225 84" stroke="#a855f7" strokeWidth="2.5" />
          </svg>
        </div>
      );

    case 'est-island':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#291d06] to-[#07171c] border border-amber-400/35 flex items-center justify-center p-2 overflow-hidden`}
        >
          <svg viewBox="0 0 240 100" className="w-full h-full max-w-[220px]">
            {/* Golden Sun */}
            <circle cx="120" cy="48" r="28" fill="#f59e0b" opacity="0.35" />
            {/* Island Mound */}
            <path d="M35 76 Q120 38 205 76 Z" fill="#059669" stroke="#34d399" strokeWidth="1.5" />
            {/* Resort Sanctuary Villa */}
            <rect x="102" y="44" width="36" height="18" rx="2" fill="#fef08a" />
            <polygon points="120,32 95,44 145,44" fill="#d97706" />
            {/* Superyacht on Right */}
            <path d="M168 72 L218 72 L210 80 L172 80 Z" fill="#ffffff" stroke="#38bdf8" strokeWidth="1" />
            <path d="M178 65 L204 65 L208 72 L175 72 Z" fill="#bae6fd" />
            {/* Turquoise Lagoon */}
            <rect x="10" y="76" width="220" height="12" rx="4" fill="#0284c7" opacity="0.65" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-b from-[#0c241b] to-[#06110d] border border-amber-400/30 flex items-center justify-center p-2 overflow-hidden`}
        >
          <div className="flex items-center gap-2">
            <div className="w-12 h-18 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 border-2 border-white p-1.5 flex flex-col justify-between text-slate-950 font-extrabold text-xs shadow-lg -rotate-6">
              <span>A♠</span>
              <span className="text-center text-base">♠</span>
            </div>
            <div className="w-12 h-18 rounded-lg bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-amber-300 p-1.5 flex flex-col justify-between text-white font-extrabold text-xs shadow-lg rotate-6">
              <span>K♦</span>
              <span className="text-center text-base text-amber-300">♦</span>
            </div>
          </div>
        </div>
      );
  }
};
