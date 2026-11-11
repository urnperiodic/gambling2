import React, { useState } from 'react';
import {
  BaccaratBetSide,
  PlayingCard,
  canPlaceBet,
  createShoe,
  dealBaccaratRound,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface BaccaratGameProps {
  chips: number;
  creditLineEnabled: boolean;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

export const BaccaratGame: React.FC<BaccaratGameProps> = ({
  chips,
  creditLineEnabled,
  onSettleBet,
}) => {
  const [wager, setWager] = useState<number>(250);
  const [selectedSide, setSelectedSide] = useState<BaccaratBetSide>('PLAYER');
  const [playerCards, setPlayerCards] = useState<PlayingCard[]>([]);
  const [bankerCards, setBankerCards] = useState<PlayingCard[]>([]);
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [bankerScore, setBankerScore] = useState<number | null>(null);
  const [outcomeBanner, setOutcomeBanner] = useState<string>('Select Player (2x), Banker (1.95x), or Tie (9x) and Deal.');
  const [beadRoad, setBeadRoad] = useState<('PLAYER' | 'BANKER' | 'TIE')[]>(['BANKER', 'PLAYER', 'PLAYER', 'BANKER', 'TIE', 'BANKER']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDealRound = () => {
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient balance! Enable Credit Line in Cashier or lower wager.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playCardSnap();

    const res = dealBaccaratRound(createShoe(2));
    setPlayerCards(res.playerCards);
    setBankerCards(res.bankerCards);
    setPlayerScore(res.playerTotal);
    setBankerScore(res.bankerTotal);
    setBeadRoad((prev) => [res.winner, ...prev.slice(0, 11)]);

    let payout = 0;
    if (selectedSide === 'PLAYER' && res.winner === 'PLAYER') {
      payout = wager * 2;
    } else if (selectedSide === 'BANKER' && res.winner === 'BANKER') {
      payout = Math.round(wager * 1.95);
    } else if (selectedSide === 'TIE' && res.winner === 'TIE') {
      payout = wager * 9;
    } else if ((selectedSide === 'PLAYER' || selectedSide === 'BANKER') && res.winner === 'TIE') {
      payout = wager; // Push on tie for Player/Banker bets
    } else if (selectedSide === 'PLAYER_PAIR' && res.playerPair) {
      payout = wager * 12;
    } else if (selectedSide === 'BANKER_PAIR' && res.bankerPair) {
      payout = wager * 12;
    }

    if (payout > wager) {
      soundEngine.playWinChime(payout >= wager * 5);
      setOutcomeBanner(
        `${res.winner} WINS (${res.playerTotal} vs ${res.bankerTotal})! You won ${payout.toLocaleString()} chips!`
      );
    } else if (payout === wager) {
      setOutcomeBanner(`TIE HAND (${res.playerTotal} to ${res.bankerTotal}) — Wager pushed & returned.`);
    } else {
      soundEngine.playLossThud();
      setOutcomeBanner(`${res.winner} WINS (${res.playerTotal} vs ${res.bankerTotal}). House collects ${wager.toLocaleString()} chips.`);
    }

    onSettleBet(
      wager,
      payout,
      `Monte Carlo Baccarat (${selectedSide}): ${res.winner} (${res.playerTotal}-${res.bankerTotal}) — Return ${payout.toLocaleString()} chips`
    );
  };

  const renderCard = (c: PlayingCard) => {
    const isRed = c.suit === '♥' || c.suit === '♦';
    return (
      <div
        key={c.id}
        className="w-16 h-24 rounded-xl bg-white border-2 border-amber-300 p-2 shadow-lg flex flex-col justify-between animate-velvet-card-deal"
      >
        <div className={`font-mono-tabular text-xs font-extrabold ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
          {c.rank}
          {c.suit}
        </div>
        <div className={`text-center text-2xl ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{c.suit}</div>
        <div className={`font-mono-tabular text-xs font-extrabold text-right ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
          {c.rank}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1260px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Betting Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-amber-500/25 p-5 space-y-5">
        <div>
          <div className="text-xs font-medium text-amber-300">Velvet Originals · Punto Banco 9</div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            MONTE CARLO BACCARAT
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Closest hand to 9 wins. Tens and Court cards count as 0.
          </p>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Select Betting Position</span>
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { id: 'PLAYER', label: 'PUNTO (PLAYER) · Pays 2.00X' },
                { id: 'BANKER', label: 'BANCO (BANKER) · Pays 1.95X' },
                { id: 'TIE', label: 'EGALITE (TIE 8:1) · Pays 9.00X' },
                { id: 'PLAYER_PAIR', label: 'PLAYER PAIR SIDE BET · Pays 12X' },
                { id: 'BANKER_PAIR', label: 'BANKER PAIR SIDE BET · Pays 12X' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  soundEngine.playChipClick();
                  setSelectedSide(opt.id);
                }}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold text-left border cursor-pointer ${
                  selectedSide === opt.id
                    ? 'bg-amber-400 text-slate-950 border-white'
                    : 'bg-[#07110d] text-slate-200 border-emerald-500/20 hover:border-amber-400/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="baccarat-wager" className="block text-xs font-semibold text-slate-300">
            Wager (Chips)
          </label>
          <input
            id="baccarat-wager"
            type="number"
            min={25}
            value={wager}
            onChange={(e) => setWager(Math.max(25, Math.round(Number(e.target.value) || 0)))}
            className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleDealRound}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-xl cursor-pointer"
        >
          DEAL COUP ({wager.toLocaleString()} Chips on {selectedSide})
        </button>
      </div>

      {/* Right Punto Banco Felt Table */}
      <div className="lg:col-span-8 rounded-2xl bg-[#081d15] border border-amber-500/30 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-emerald-500/20">
          <span className="text-xs font-bold text-amber-200">{outcomeBanner}</span>
          <div className="flex items-center gap-1.5">
            {beadRoad.map((r, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-full font-mono-tabular text-[10px] font-extrabold flex items-center justify-center ${
                  r === 'PLAYER'
                    ? 'bg-sky-600 text-white'
                    : r === 'BANKER'
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {r[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          {/* Player Hand */}
          <div className="rounded-2xl bg-black/35 border border-sky-400/30 p-5 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-display text-sm font-bold text-sky-300">PUNTO (PLAYER)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-200 font-mono-tabular text-sm font-extrabold">
                {playerScore ?? '-'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 min-h-[100px]">
              {playerCards.length === 0 ? (
                <span className="text-xs text-slate-500">Ready to deal</span>
              ) : (
                playerCards.map((c) => renderCard(c))
              )}
            </div>
          </div>

          {/* Banker Hand */}
          <div className="rounded-2xl bg-black/35 border border-rose-400/30 p-5 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-display text-sm font-bold text-rose-300">BANCO (BANKER)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-200 font-mono-tabular text-sm font-extrabold">
                {bankerScore ?? '-'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 min-h-[100px]">
              {bankerCards.length === 0 ? (
                <span className="text-xs text-slate-500">Ready to deal</span>
              ) : (
                bankerCards.map((c) => renderCard(c))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
