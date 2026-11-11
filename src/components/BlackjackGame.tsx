import React, { useState } from 'react';
import {
  PlayingCard,
  calculateBlackjackHand,
  canPlaceBet,
  createShoe,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface BlackjackGameProps {
  chips: number;
  creditLineEnabled: boolean;
  equippedCardBack: string;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

interface SeatHand {
  cards: PlayingCard[];
  bet: number;
  status: 'PLAYING' | 'STOOD' | 'BUST' | 'BLACKJACK' | 'DOUBLED';
  outcomeText?: string;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  chips,
  creditLineEnabled,
  equippedCardBack,
  onSettleBet,
}) => {
  const [shoe, setShoe] = useState<PlayingCard[]>(() => createShoe(6));
  const [seatCount, setSeatCount] = useState<number>(1);
  const [wagerPerSeat, setWagerPerSeat] = useState<number>(250);
  const [phase, setPhase] = useState<'BETTING' | 'PLAYER_TURN' | 'RESOLVED'>('BETTING');
  const [dealerCards, setDealerCards] = useState<PlayingCard[]>([]);
  const [seats, setSeats] = useState<SeatHand[]>([]);
  const [activeSeatIdx, setActiveSeatIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const drawFromShoe = (currentShoe: PlayingCard[], count: number): [PlayingCard[], PlayingCard[]] => {
    let working = currentShoe.length < 30 ? createShoe(6) : [...currentShoe];
    const drawn = working.slice(0, count);
    working = working.slice(count);
    return [drawn, working];
  };

  const startDeal = () => {
    const totalWager = wagerPerSeat * seatCount;
    if (!canPlaceBet(chips, totalWager, creditLineEnabled)) {
      setErrorMsg('Insufficient chips for selected seats. Enable Credit Line in Cashier or lower bet.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playCardSnap();

    const needed = seatCount * 2 + 2;
    const [drawn, nextShoe] = drawFromShoe(shoe, needed);
    setShoe(nextShoe);

    const newSeats: SeatHand[] = [];
    let cursor = 0;
    for (let s = 0; s < seatCount; s++) {
      const c1 = drawn[cursor++];
      const c2 = drawn[cursor++];
      const handCalc = calculateBlackjackHand([c1, c2]);
      newSeats.push({
        cards: [c1, c2],
        bet: wagerPerSeat,
        status: handCalc.isBlackjack ? 'BLACKJACK' : 'PLAYING',
      });
    }

    const dCards = [drawn[cursor++], drawn[cursor++]];
    setDealerCards(dCards);
    setSeats(newSeats);

    const firstPlayable = newSeats.findIndex((s) => s.status === 'PLAYING');
    if (firstPlayable === -1) {
      resolveDealerAndSettle(newSeats, dCards, nextShoe);
    } else {
      setActiveSeatIdx(firstPlayable);
      setPhase('PLAYER_TURN');
    }
  };

  const advanceSeatOrResolve = (updatedSeats: SeatHand[], currentShoe: PlayingCard[]) => {
    const nextIdx = updatedSeats.findIndex((s, i) => i >= activeSeatIdx && s.status === 'PLAYING');
    if (nextIdx !== -1) {
      setActiveSeatIdx(nextIdx);
    } else {
      resolveDealerAndSettle(updatedSeats, dealerCards, currentShoe);
    }
  };

  const handleHit = () => {
    if (phase !== 'PLAYER_TURN') return;
    soundEngine.playCardSnap();
    const [drawn, nextShoe] = drawFromShoe(shoe, 1);
    setShoe(nextShoe);

    const updated = [...seats];
    const current = { ...updated[activeSeatIdx] };
    current.cards = [...current.cards, drawn[0]];
    const calc = calculateBlackjackHand(current.cards);
    if (calc.isBust) {
      current.status = 'BUST';
    } else if (calc.total === 21) {
      current.status = 'STOOD';
    }
    updated[activeSeatIdx] = current;
    setSeats(updated);
    advanceSeatOrResolve(updated, nextShoe);
  };

  const handleStand = () => {
    if (phase !== 'PLAYER_TURN') return;
    soundEngine.playChipClick();
    const updated = [...seats];
    updated[activeSeatIdx] = { ...updated[activeSeatIdx], status: 'STOOD' };
    setSeats(updated);
    advanceSeatOrResolve(updated, shoe);
  };

  const handleDouble = () => {
    if (phase !== 'PLAYER_TURN') return;
    const currentSeat = seats[activeSeatIdx];
    if (currentSeat.cards.length !== 2) return;

    const currentTotalBet = seats.reduce((s, h) => s + h.bet, 0);
    if (!canPlaceBet(chips, currentTotalBet + currentSeat.bet, creditLineEnabled)) {
      setErrorMsg('Insufficient balance to Double Down.');
      return;
    }

    soundEngine.playCardSnap();
    const [drawn, nextShoe] = drawFromShoe(shoe, 1);
    setShoe(nextShoe);

    const updated = [...seats];
    const newCards = [...currentSeat.cards, drawn[0]];
    const calc = calculateBlackjackHand(newCards);
    updated[activeSeatIdx] = {
      ...currentSeat,
      cards: newCards,
      bet: currentSeat.bet * 2,
      status: calc.isBust ? 'BUST' : 'DOUBLED',
    };
    setSeats(updated);
    advanceSeatOrResolve(updated, nextShoe);
  };

  const resolveDealerAndSettle = (
    finalSeats: SeatHand[],
    initialDealerCards: PlayingCard[],
    currentShoe: PlayingCard[]
  ) => {
    let workingShoe = [...currentShoe];
    let dCards = [...initialDealerCards];

    const anyLiveHand = finalSeats.some((s) => s.status !== 'BUST');
    if (anyLiveHand) {
      let dCalc = calculateBlackjackHand(dCards);
      // Dealer hits on soft 17 or less than 17
      while (dCalc.total < 17 || (dCalc.total === 17 && dCalc.isSoft)) {
        const [drawn, rem] = drawFromShoe(workingShoe, 1);
        workingShoe = rem;
        dCards.push(drawn[0]);
        dCalc = calculateBlackjackHand(dCards);
      }
    }

    setShoe(workingShoe);
    setDealerCards(dCards);

    const dFinal = calculateBlackjackHand(dCards);
    let totalWager = 0;
    let totalPayout = 0;

    const evaluatedSeats = finalSeats.map((seat) => {
      totalWager += seat.bet;
      const pCalc = calculateBlackjackHand(seat.cards);

      if (pCalc.isBust) {
        return { ...seat, outcomeText: `Bust (${pCalc.total}) — Lost ${seat.bet.toLocaleString()}` };
      }
      if (pCalc.isBlackjack && !dFinal.isBlackjack) {
        const winPay = Math.round(seat.bet * 2.5);
        totalPayout += winPay;
        return { ...seat, outcomeText: `BLACKJACK 3:2! Won ${winPay.toLocaleString()}` };
      }
      if (dFinal.isBlackjack && !pCalc.isBlackjack) {
        return { ...seat, outcomeText: `Dealer Blackjack — Lost ${seat.bet.toLocaleString()}` };
      }
      if (dFinal.isBust || pCalc.total > dFinal.total) {
        const winPay = seat.bet * 2;
        totalPayout += winPay;
        return { ...seat, outcomeText: `Won ${winPay.toLocaleString()} (${pCalc.total} vs ${dFinal.total})` };
      }
      if (pCalc.total === dFinal.total) {
        totalPayout += seat.bet;
        return { ...seat, outcomeText: `Push (${pCalc.total}) — Returned ${seat.bet.toLocaleString()}` };
      }
      return { ...seat, outcomeText: `Lost (${pCalc.total} vs ${dFinal.total})` };
    });

    setSeats(evaluatedSeats);
    setPhase('RESOLVED');

    if (totalPayout > totalWager) {
      soundEngine.playWinChime(totalPayout >= totalWager * 2.2);
    } else if (totalPayout < totalWager) {
      soundEngine.playLossThud();
    }

    onSettleBet(
      totalWager,
      totalPayout,
      `Blackjack 21 (${seatCount} seat${seatCount > 1 ? 's' : ''}): Wagered ${totalWager.toLocaleString()}, Return ${totalPayout.toLocaleString()} chips`
    );
  };

  const renderCard = (card: PlayingCard, hidden = false) => {
    const isGoldDeck = equippedCardBack === 'cos-gold-deck';
    const isCrimsonDeck = equippedCardBack === 'cos-crimson-deck';

    if (hidden) {
      return (
        <div
          key={card.id}
          className={`w-16 h-24 rounded-xl border-2 shadow-lg flex items-center justify-center animate-velvet-card-deal ${
            isGoldDeck
              ? 'bg-gradient-to-br from-amber-400 to-amber-700 border-amber-200'
              : isCrimsonDeck
              ? 'bg-gradient-to-br from-rose-700 to-rose-950 border-rose-300'
              : 'bg-gradient-to-br from-emerald-800 to-emerald-950 border-amber-400/60'
          }`}
        >
          <span className="font-display text-xs font-bold text-amber-200">V</span>
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div
        key={card.id}
        className={`w-16 h-24 rounded-xl p-2 shadow-xl flex flex-col justify-between border-2 animate-velvet-card-deal ${
          isGoldDeck
            ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`font-mono-tabular text-xs font-extrabold leading-none ${
            isRed ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {card.rank}
          {card.suit}
        </div>
        <div className={`text-center text-2xl leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
          {card.suit}
        </div>
        <div
          className={`font-mono-tabular text-xs font-extrabold leading-none text-right ${
            isRed ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {card.rank}
        </div>
      </div>
    );
  };

  const dealerCalc = calculateBlackjackHand(dealerCards);

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Betting & Seat Controls */}
      <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-amber-500/25 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-amber-300">Velvet Originals</div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              BLACKJACK 21
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-amber-200 bg-black/40 border border-amber-400/30">
            1–3 SEATS · 3:2 BJ
          </span>
        </div>

        {/* Wager Per Seat */}
        <div className="space-y-2">
          <label htmlFor="bj-wager" className="block text-xs font-semibold text-slate-300">
            Wager Per Seat (Chips)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="bj-wager"
              type="number"
              min={25}
              disabled={phase === 'PLAYER_TURN'}
              value={wagerPerSeat}
              onChange={(e) => setWagerPerSeat(Math.max(25, Math.round(Number(e.target.value) || 0)))}
              className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white disabled:opacity-50"
            />
            <button
              type="button"
              disabled={phase === 'PLAYER_TURN'}
              onClick={() => setWagerPerSeat((w) => w * 2)}
              className="px-3 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer disabled:opacity-50"
            >
              2X
            </button>
          </div>
        </div>

        {/* Active Seats (Multi-Hand) */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">Active Table Seats</span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((cnt) => (
              <button
                key={cnt}
                type="button"
                disabled={phase === 'PLAYER_TURN'}
                onClick={() => setSeatCount(cnt)}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                  seatCount === cnt
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : 'bg-[#07110d] text-slate-300 border-emerald-500/20'
                }`}
              >
                {cnt} {cnt === 1 ? 'Seat' : 'Seats'}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {phase !== 'PLAYER_TURN' ? (
          <button
            type="button"
            onClick={startDeal}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
          >
            Deal Blackjack Hands ({(wagerPerSeat * seatCount).toLocaleString()} Chips)
          </button>
        ) : (
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-amber-300">
              Playing Seat #{activeSeatIdx + 1}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleHit}
                className="py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer shadow"
              >
                Hit Card
              </button>
              <button
                type="button"
                onClick={handleStand}
                className="py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer shadow"
              >
                Stand
              </button>
            </div>
            <button
              type="button"
              disabled={seats[activeSeatIdx]?.cards.length !== 2}
              onClick={handleDouble}
              className="w-full py-2.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 disabled:opacity-40 text-purple-100 font-semibold text-xs border border-purple-400/30 cursor-pointer"
            >
              Double Down (2X Wager, 1 Final Card)
            </button>
          </div>
        )}
      </div>

      {/* Right Felt Table */}
      <div
        className="lg:col-span-8 rounded-2xl border border-amber-500/30 p-6 min-h-[450px] flex flex-col justify-between"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(16, 85, 58, 0.85) 0%, rgba(8, 28, 20, 0.98) 100%)',
        }}
      >
        {/* Dealer Zone */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-200/90">
            <span>Velvet Dealer (Hits Soft 17)</span>
            {dealerCards.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 font-mono-tabular text-white">
                {phase === 'PLAYER_TURN' ? `${dealerCards[0].value} + ?` : dealerCalc.total}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2.5 min-h-[96px]">
            {dealerCards.length === 0 ? (
              <div className="text-xs text-emerald-300/60">Click &quot;Deal Blackjack Hands&quot; to begin.</div>
            ) : (
              dealerCards.map((c, idx) => renderCard(c, phase === 'PLAYER_TURN' && idx === 1))
            )}
          </div>
        </div>

        {/* Center Felt Rule Banner */}
        <div className="my-4 py-2 border-y border-amber-400/20 text-center">
          <span className="font-display text-xs tracking-widest text-amber-300/80 uppercase">
            BLACKJACK PAYS 3 TO 2 · DEALER MUST DRAW TO 16 AND HIT SOFT 17
          </span>
        </div>

        {/* Player Seats Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-${ Math.max(1, seats.length) } gap-4`}>
          {seats.map((seat, idx) => {
            const calc = calculateBlackjackHand(seat.cards);
            const isActive = phase === 'PLAYER_TURN' && activeSeatIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-4 flex flex-col items-center space-y-3 border transition-all ${
                  isActive
                    ? 'bg-emerald-900/60 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-black/30 border-emerald-500/25'
                }`}
              >
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="font-bold text-amber-200">Seat #{idx + 1}</span>
                  <span className="font-mono-tabular font-extrabold text-white px-2 py-0.5 rounded bg-emerald-950">
                    Total: {calc.total}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {seat.cards.map((c) => renderCard(c))}
                </div>

                <div className="text-xs font-medium text-center text-emerald-200">
                  {seat.outcomeText || `Bet: ${seat.bet.toLocaleString()} Chips`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
