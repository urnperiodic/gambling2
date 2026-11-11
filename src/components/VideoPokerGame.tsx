import React, { useState } from 'react';
import {
  PlayingCard,
  VideoPokerVariant,
  canPlaceBet,
  createShoe,
  evaluateBestSevenCardHoldem,
  evaluateFiveCardPokerHand,
} from '../game/rules';
import { soundEngine } from '../game/sound';

interface VideoPokerGameProps {
  chips: number;
  creditLineEnabled: boolean;
  equippedCardBack: string;
  onSettleBet: (wager: number, payout: number, summary: string) => void;
}

const JACKS_PAYTABLE = [
  { name: 'Royal Flush', mult: 800 },
  { name: 'Straight Flush', mult: 50 },
  { name: 'Four of a Kind', mult: 25 },
  { name: 'Full House', mult: 9 },
  { name: 'Flush', mult: 6 },
  { name: 'Straight', mult: 4 },
  { name: 'Three of a Kind', mult: 3 },
  { name: 'Two Pair', mult: 2 },
  { name: 'Jacks or Better', mult: 1 },
];

const DEUCES_PAYTABLE = [
  { name: 'Natural Royal Flush', mult: 800 },
  { name: 'Four Deuces (2s)', mult: 200 },
  { name: 'Wild Royal Flush', mult: 25 },
  { name: 'Five of a Kind', mult: 15 },
  { name: 'Straight Flush', mult: 9 },
  { name: 'Four of a Kind', mult: 4 },
  { name: 'Full House', mult: 3 },
  { name: 'Flush', mult: 2 },
  { name: 'Straight', mult: 2 },
  { name: 'Three of a Kind', mult: 1 },
];

export const VideoPokerGame: React.FC<VideoPokerGameProps> = ({
  chips,
  creditLineEnabled,
  equippedCardBack,
  onSettleBet,
}) => {
  const [variant, setVariant] = useState<VideoPokerVariant>('TEXAS_HOLDEM');
  const [wager, setWager] = useState<number>(200);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 5-Card Draw State (Jacks or Better / Deuces Wild)
  const [drawDeck, setDrawDeck] = useState<PlayingCard[]>(() => createShoe(1));
  const [hand, setHand] = useState<PlayingCard[]>([]);
  const [heldIndices, setHeldIndices] = useState<Set<number>>(new Set());
  const [drawPhase, setDrawPhase] = useState<'IDLE' | 'DEALT' | 'COMPLETE'>('IDLE');
  const [drawResultText, setDrawResultText] = useState<string>('Select a variant and click Deal.');

  // Texas Hold'em Heads-Up State
  const [holdemDeck, setHoldemDeck] = useState<PlayingCard[]>([]);
  const [playerHole, setPlayerHole] = useState<PlayingCard[]>([]);
  const [dealerHole, setDealerHole] = useState<PlayingCard[]>([]);
  const [community, setCommunity] = useState<PlayingCard[]>([]);
  const [holdemStage, setHoldemStage] = useState<'IDLE' | 'PREFLOP' | 'FLOP' | 'RIVER_DECISION' | 'SHOWDOWN'>('IDLE');
  const [anteBet, setAnteBet] = useState<number>(200);
  const [playBet, setPlayBet] = useState<number>(0);
  const [holdemOutcome, setHoldemOutcome] = useState<string>('Ante up to play Heads-Up Texas Hold’em vs the House Dealer.');

  // ---- 5-Card Video Poker Handlers ----
  const handleDealFiveCard = () => {
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient balance. Enable Underground Credit in Cashier or lower wager.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playCardSnap();

    const fresh = createShoe(1);
    const dealt = fresh.slice(0, 5);
    setDrawDeck(fresh.slice(5));
    setHand(dealt);
    setHeldIndices(new Set());
    setDrawPhase('DEALT');
    const preview = evaluateFiveCardPokerHand(dealt, variant);
    setDrawResultText(`Current Hand: ${preview.handName} — Click cards to HOLD, then press DRAW.`);
  };

  const toggleHold = (idx: number) => {
    if (drawPhase !== 'DEALT') return;
    soundEngine.playChipClick();
    setHeldIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleDrawReplacements = () => {
    if (drawPhase !== 'DEALT') return;
    soundEngine.playCardSnap();

    let cursor = 0;
    const finalHand = hand.map((card, idx) => {
      if (heldIndices.has(idx)) return card;
      return drawDeck[cursor++];
    });

    setHand(finalHand);
    setDrawPhase('COMPLETE');

    const ev = evaluateFiveCardPokerHand(finalHand, variant);
    const payout = Math.round(wager * ev.multiplier);
    if (payout > 0) {
      soundEngine.playWinChime(ev.multiplier >= 9);
      setDrawResultText(`${ev.handName}! Paid ${ev.multiplier}x (${payout.toLocaleString()} Chips)`);
    } else {
      soundEngine.playLossThud();
      setDrawResultText(`${ev.handName} — No qualifying payout.`);
    }

    onSettleBet(
      wager,
      payout,
      `Video Poker (${variant.replace(/_/g, ' ')}): ${ev.handName} — ${
        payout > 0 ? `Won ${payout.toLocaleString()} (${ev.multiplier}x)` : `Lost ${wager.toLocaleString()}`
      } chips`
    );
  };

  // ---- Ultimate Texas Hold'em Handlers ----
  const startHoldemHand = () => {
    if (!canPlaceBet(chips, wager, creditLineEnabled)) {
      setErrorMsg('Insufficient chips for Ante.');
      soundEngine.playLossThud();
      return;
    }
    setErrorMsg(null);
    soundEngine.playCardSnap();

    const fresh = createShoe(1);
    setPlayerHole(fresh.slice(0, 2));
    setDealerHole(fresh.slice(2, 4));
    setCommunity(fresh.slice(4, 9));
    setHoldemDeck(fresh.slice(9));
    setAnteBet(wager);
    setPlayBet(0);
    setHoldemStage('PREFLOP');
    setHoldemOutcome('Pre-Flop: Bet 3X to go straight to Showdown, or Check to see the Flop.');
  };

  const resolveHoldemShowdown = (finalPlayBet: number, folded = false) => {
    const totalWager = anteBet + finalPlayBet;
    if (folded) {
      setHoldemStage('SHOWDOWN');
      soundEngine.playLossThud();
      setHoldemOutcome(`You folded on the River. Forfeited ${anteBet.toLocaleString()} Ante.`);
      onSettleBet(anteBet, 0, `Texas Hold'em: Folded (${anteBet.toLocaleString()} chips)`);
      return;
    }

    const pEval = evaluateBestSevenCardHoldem([...playerHole, ...community]);
    const dEval = evaluateBestSevenCardHoldem([...dealerHole, ...community]);

    setPlayBet(finalPlayBet);
    setHoldemStage('SHOWDOWN');

    // Trips+ Bonus payout on Player's hand if player wins or ties
    const bonusMult = pEval.multiplier >= 3 ? Math.min(25, Math.floor(pEval.multiplier / 2)) : 0;

    if (pEval.tierScore > dEval.tierScore) {
      const baseReturn = totalWager * 2;
      const bonusWin = bonusMult > 0 ? Math.round(anteBet * (bonusMult * 0.25)) : 0;
      const grossPayout = baseReturn + bonusWin;
      soundEngine.playWinChime(bonusWin > 0);
      setHoldemOutcome(
        `VICTORY! Your ${pEval.handName} beats Dealer's ${dEval.handName}! Return: ${grossPayout.toLocaleString()} chips.`
      );
      onSettleBet(
        totalWager,
        grossPayout,
        `Texas Hold'em: Won ${grossPayout.toLocaleString()} with ${pEval.handName} vs ${dEval.handName}`
      );
    } else if (pEval.tierScore === dEval.tierScore) {
      soundEngine.playChipClick();
      setHoldemOutcome(`SPLIT POT! Both have ${pEval.handName}. Returned ${totalWager.toLocaleString()} chips.`);
      onSettleBet(totalWager, totalWager, `Texas Hold'em: Push with ${pEval.handName}`);
    } else {
      soundEngine.playLossThud();
      setHoldemOutcome(
        `Dealer wins with ${dEval.handName} over your ${pEval.handName}. Lost ${totalWager.toLocaleString()} chips.`
      );
      onSettleBet(
        totalWager,
        0,
        `Texas Hold'em: Dealer's ${dEval.handName} beat ${pEval.handName} (-${totalWager.toLocaleString()})`
      );
    }
  };

  const renderCardView = (card: PlayingCard, hidden = false, isHeld = false, onClick?: () => void) => {
    const isGold = equippedCardBack === 'cos-gold-deck';
    if (hidden) {
      return (
        <div
          key={card.id}
          className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-amber-400/60 shadow-lg flex items-center justify-center"
        >
          <span className="font-display text-sm font-bold text-amber-300">VELVET</span>
        </div>
      );
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    const isWild = variant === 'DEUCES_WILD' && card.rank === '2';

    return (
      <button
        key={card.id}
        type="button"
        onClick={onClick}
        className={`relative w-16 sm:w-20 h-24 sm:h-28 rounded-xl p-2 shadow-xl flex flex-col justify-between border-2 transition-transform cursor-pointer ${
          isGold
            ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 border-amber-300'
            : 'bg-white border-amber-400'
        } ${isHeld ? '-translate-y-2 ring-2 ring-amber-400' : 'hover:-translate-y-1'}`}
      >
        {isHeld && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-tabular text-[10px] font-extrabold shadow">
            HELD
          </span>
        )}
        <div
          className={`font-mono-tabular text-xs sm:text-sm font-extrabold leading-none text-left ${
            isRed ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {card.rank}
          {card.suit}
        </div>
        <div className={`text-center text-2xl sm:text-3xl leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
          {card.suit}
        </div>
        <div className="w-full text-center rounded bg-amber-400/90 text-[9px] font-mono-tabular font-extrabold text-slate-950 py-0.5">
          {isWild ? 'WILD 2' : '800X'}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* Top Variant Selector Bar */}
      <div className="rounded-2xl bg-[#0c1a14] border border-emerald-500/25 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-emerald-400">Velvet Originals · Multi-Variant Suite</div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            VIDEO POKER &amp; TEXAS HOLD&apos;EM
          </h2>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#07110d] border border-emerald-500/20">
          {(
            [
              { id: 'TEXAS_HOLDEM', label: "Ultimate Texas Hold'em" },
              { id: 'JACKS_OR_BETTER', label: 'Jacks or Better (800X)' },
              { id: 'DEUCES_WILD', label: 'Deuces Wild (2s Wild)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setVariant(tab.id);
                setErrorMsg(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                variant === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {variant === 'TEXAS_HOLDEM' ? (
        /* ULTIMATE TEXAS HOLD'EM HEADS-UP TABLE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-emerald-500/20 p-5 space-y-4">
            <h3 className="font-display text-lg font-bold text-amber-300">
              Texas Hold&apos;em Betting Controls
            </h3>
            <p className="text-xs text-slate-400">
              Face the Velvet House Dealer heads-up. Make your best 5-card hand from 2 hole cards + 5 community cards.
            </p>

            <div className="space-y-2">
              <label htmlFor="holdem-ante" className="block text-xs font-semibold text-slate-300">
                Ante Wager (Chips)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="holdem-ante"
                  type="number"
                  min={25}
                  disabled={holdemStage !== 'IDLE' && holdemStage !== 'SHOWDOWN'}
                  value={wager}
                  onChange={(e) => setWager(Math.max(25, Math.round(Number(e.target.value) || 0)))}
                  className="w-full rounded-xl bg-[#07110d] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
                />
                <button
                  type="button"
                  disabled={holdemStage !== 'IDLE' && holdemStage !== 'SHOWDOWN'}
                  onClick={() => setWager((w) => w * 2)}
                  className="px-3 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
                >
                  2X
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            {holdemStage === 'IDLE' || holdemStage === 'SHOWDOWN' ? (
              <button
                type="button"
                onClick={startHoldemHand}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
              >
                Deal Hold&apos;em Hand ({wager.toLocaleString()} Ante)
              </button>
            ) : holdemStage === 'PREFLOP' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => resolveHoldemShowdown(anteBet * 3)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Raise 3X ({(anteBet * 3).toLocaleString()} Chips) &amp; Deal All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCardSnap();
                    setHoldemStage('FLOP');
                    setHoldemOutcome('Flop is on the board. Bet 2X or Check to the River.');
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Check (Reveal 3-Card Flop)
                </button>
              </div>
            ) : holdemStage === 'FLOP' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => resolveHoldemShowdown(anteBet * 2)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Bet 2X ({(anteBet * 2).toLocaleString()} Chips) &amp; Showdown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCardSnap();
                    setHoldemStage('RIVER_DECISION');
                    setHoldemOutcome('Turn and River revealed! Call 1X Play Bet or Fold.');
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Check (Reveal Turn &amp; River)
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => resolveHoldemShowdown(anteBet)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Call 1X ({anteBet.toLocaleString()} Chips) — Showdown
                </button>
                <button
                  type="button"
                  onClick={() => resolveHoldemShowdown(0, true)}
                  className="w-full py-3 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                >
                  Fold Hand (Forfeit Ante)
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-[#081d15] border border-emerald-500/30 p-6 space-y-6">
            <div className="text-xs font-semibold text-amber-200 bg-black/35 px-4 py-2.5 rounded-xl border border-amber-400/20">
              {holdemOutcome}
            </div>

            {/* Dealer Hole Cards */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs text-slate-400">House Dealer Hole Cards</span>
              <div className="flex items-center gap-3 min-h-[104px]">
                {dealerHole.length === 0 ? (
                  <span className="text-xs text-slate-500">Waiting for Ante...</span>
                ) : (
                  dealerHole.map((c) => renderCardView(c, holdemStage !== 'SHOWDOWN'))
                )}
              </div>
            </div>

            {/* 5 Community Board Cards */}
            <div className="flex flex-col items-center space-y-2 py-3 border-y border-emerald-500/20">
              <span className="text-xs font-semibold text-emerald-300">Community Board (Flop · Turn · River)</span>
              <div className="flex items-center justify-center gap-2.5 flex-wrap min-h-[112px]">
                {community.map((c, idx) => {
                  const visible =
                    holdemStage === 'SHOWDOWN' ||
                    holdemStage === 'RIVER_DECISION' ||
                    (holdemStage === 'FLOP' && idx < 3);
                  return renderCardView(c, !visible);
                })}
              </div>
            </div>

            {/* Player Hole Cards */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-amber-300">Your Pocket Cards</span>
              <div className="flex items-center gap-3 min-h-[104px]">
                {playerHole.map((c) => renderCardView(c, false))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 5-CARD DRAW VIDEO POKER (JACKS OR BETTER & DEUCES WILD) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Paytable Column */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0c1a14] border border-emerald-500/25 p-5 space-y-4">
            <h3 className="font-display text-lg font-bold text-amber-300">
              {variant === 'JACKS_OR_BETTER' ? 'Jacks or Better Paytable' : 'Deuces Wild Paytable'}
            </h3>
            <div className="space-y-1.5">
              {(variant === 'JACKS_OR_BETTER' ? JACKS_PAYTABLE : DEUCES_PAYTABLE).map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#07110d] border border-emerald-500/15 text-xs"
                >
                  <span className="font-medium text-slate-200">{row.name}</span>
                  <span className="font-mono-tabular font-bold text-amber-300">{row.mult}X</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Card Machine Stage */}
          <div className="lg:col-span-8 rounded-2xl bg-[#081d15] border border-emerald-500/30 p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-amber-200">{drawResultText}</span>
              <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                Max Royal Payout: {(wager * 800).toLocaleString()} Chips
              </span>
            </div>

            {/* 5 Cards Row */}
            <div className="py-6 flex items-center justify-center gap-3 sm:gap-4 flex-wrap min-h-[150px]">
              {hand.length === 0 ? (
                <div className="text-xs text-slate-400">Click &quot;Deal 5 Cards&quot; below to begin.</div>
              ) : (
                hand.map((c, idx) =>
                  renderCardView(c, false, heldIndices.has(idx), () => toggleHold(idx))
                )
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Bet & Deal/Draw Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-emerald-500/20">
              <div className="flex items-center gap-2">
                <label htmlFor="vp-wager" className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                  Wager:
                </label>
                <input
                  id="vp-wager"
                  type="number"
                  min={10}
                  disabled={drawPhase === 'DEALT'}
                  value={wager}
                  onChange={(e) => setWager(Math.max(10, Math.round(Number(e.target.value) || 0)))}
                  className="w-32 rounded-xl bg-[#07110d] border border-emerald-500/30 px-3 py-2 font-mono-tabular text-sm font-bold text-white"
                />
                <button
                  type="button"
                  disabled={drawPhase === 'DEALT'}
                  onClick={() => setWager((w) => w * 2)}
                  className="px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-500/25 text-xs font-mono-tabular font-bold text-emerald-200 cursor-pointer"
                >
                  2X
                </button>
              </div>

              {drawPhase === 'DEALT' ? (
                <button
                  type="button"
                  onClick={handleDrawReplacements}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg cursor-pointer"
                >
                  DRAW REPLACEMENT CARDS
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDealFiveCard}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg cursor-pointer"
                >
                  DEAL 5 CARDS ({wager.toLocaleString()} Chips)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
