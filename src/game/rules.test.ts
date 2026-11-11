import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARREST_DEBT_THRESHOLD,
  STARTING_CHIPS,
  calculateBlackjackHand,
  calculateDiceMultiplier,
  canPlaceBet,
  createInitialAccountState,
  evaluateBestSevenCardHoldem,
  evaluateBrassDiceRoll,
  evaluateFiveCardPokerHand,
  evaluateRouletteBet,
  executeArrestReset,
  executePrisonEscapeSuccess,
  samplePlinkoPath,
  settleBet,
  shouldArrestPlayer,
  spinSlotReels,
  PlayingCard,
  spinRoyalWheel,
  createMinesBoard,
  calculateMinesMultiplier,
  dealBaccaratRound,
} from './rules';

test('debt and arrest threshold triggers at -10,000,000 chips and resets to 1,000, while prison escape keeps money with new identity', () => {
  assert.equal(shouldArrestPlayer(-9_999_999), false);
  assert.equal(shouldArrestPlayer(ARREST_DEBT_THRESHOLD), true);
  assert.equal(shouldArrestPlayer(-12_500_000), true);

  const settlement = settleBet(-8_500_000, 1_500_000, 0, false);
  assert.equal(settlement.arrested, true);
  assert.ok(settlement.nextChips <= ARREST_DEBT_THRESHOLD);

  const initial = createInitialAccountState();
  initial.chips = -10_500_000;
  initial.cash = 500_000;
  initial.ownedItems = ['vip-gold', 'car-gt3rs', 'est-penthouse'];

  const afterArrest = executeArrestReset(initial);
  assert.equal(afterArrest.chips, STARTING_CHIPS);
  assert.equal(afterArrest.cash, 0);
  assert.equal(afterArrest.arrestCount, 1);
  // Keeps VIP membership, seizes car and real estate
  assert.deepEqual(afterArrest.ownedItems, ['vip-gold']);

  // Escaping prison with a new identity keeps the money & assets won last time!
  const escaped = executePrisonEscapeSuccess(
    initial,
    {
      finalDebtOrChips: -10_500_000,
      savedChips: 350_000,
      savedCash: 500_000,
      savedOwnedItems: ['vip-gold', 'car-gt3rs', 'est-penthouse'],
      handsPlayed: 15,
      arrestReason: 'CASINO_HEIST_CAUGHT',
    },
    'ShadowBaron'
  );
  assert.equal(escaped.alias, 'ShadowBaron');
  assert.notEqual(escaped.playerId, initial.playerId);
  assert.equal(escaped.chips, 350_000);
  assert.equal(escaped.cash, 500_000);
  assert.deepEqual(escaped.ownedItems, ['vip-gold', 'car-gt3rs', 'est-penthouse']);
  assert.equal(escaped.heistAttempted, false);
});

test('credit line allows betting into debt only when enabled', () => {
  assert.equal(canPlaceBet(500, 1000, false), false);
  assert.equal(canPlaceBet(500, 1000, true), true);
});

test('Plinko Pyramid path sampler produces valid bucket index and multiplier', () => {
  const leftEdge = samplePlinkoPath(8, 'HIGH', () => 0.99);
  assert.equal(leftEdge.directions.length, 8);
  assert.equal(leftEdge.bucketIndex, 0);
  assert.equal(leftEdge.multiplier, 110);

  const rightEdge = samplePlinkoPath(8, 'HIGH', () => 0.01);
  assert.equal(rightEdge.bucketIndex, 8);
  assert.equal(rightEdge.multiplier, 110);

  const centerRes = samplePlinkoPath(8, 'HIGH', () => 0.5);
  assert.ok(centerRes.bucketIndex >= 0 && centerRes.bucketIndex <= 8);
});

test('Roulette bet evaluation handles straight, color, and dozens accurately', () => {
  assert.equal(evaluateRouletteBet({ type: 'STRAIGHT', number: 17, amount: 100, label: '17' }, 17), 3600);
  assert.equal(evaluateRouletteBet({ type: 'STRAIGHT', number: 17, amount: 100, label: '17' }, 0), 0);
  assert.equal(evaluateRouletteBet({ type: 'RED', amount: 50, label: 'Red' }, 32), 100);
  assert.equal(evaluateRouletteBet({ type: 'RED', amount: 50, label: 'Red' }, 0), 0);
  assert.equal(evaluateRouletteBet({ type: 'DOZEN_2', amount: 100, label: '2nd 12' }, 19), 300);
});

test('Brass Dice caps max multiplier at 98.0x and evaluates rolls', () => {
  assert.equal(calculateDiceMultiplier(99, 'OVER'), 98.0);
  assert.equal(calculateDiceMultiplier(1, 'UNDER'), 98.0);
  const winOutcome = evaluateBrassDiceRoll(95, 90, 'OVER');
  assert.equal(winOutcome.won, true);
  assert.equal(winOutcome.multiplier, 9.8);
});

test('Blackjack hand calculator handles soft and hard Aces properly', () => {
  const blackjackCards: PlayingCard[] = [
    { suit: '♠', rank: 'A', value: 11, id: '1' },
    { suit: '♦', rank: 'K', value: 10, id: '2' },
  ];
  const bj = calculateBlackjackHand(blackjackCards);
  assert.equal(bj.total, 21);
  assert.equal(bj.isBlackjack, true);

  const multiAce: PlayingCard[] = [
    { suit: '♠', rank: 'A', value: 11, id: '1' },
    { suit: '♥', rank: 'A', value: 11, id: '2' },
    { suit: '♣', rank: '9', value: 9, id: '3' },
  ];
  const soft21 = calculateBlackjackHand(multiAce);
  assert.equal(soft21.total, 21);
  assert.equal(soft21.isBlackjack, false);
  assert.equal(soft21.isBust, false);
});

test('Video Poker & Texas Holdem evaluator detects Royal Flush, Deuces Wild, and best 5-of-7', () => {
  const royal: PlayingCard[] = [
    { suit: '♠', rank: '10', value: 10, id: '1' },
    { suit: '♠', rank: 'J', value: 10, id: '2' },
    { suit: '♠', rank: 'Q', value: 10, id: '3' },
    { suit: '♠', rank: 'K', value: 10, id: '4' },
    { suit: '♠', rank: 'A', value: 11, id: '5' },
  ];
  const evRoyal = evaluateFiveCardPokerHand(royal, 'JACKS_OR_BETTER');
  assert.equal(evRoyal.handName, 'Royal Flush');
  assert.equal(evRoyal.multiplier, 800);

  const deucesHand: PlayingCard[] = [
    { suit: '♠', rank: '2', value: 2, id: '1' },
    { suit: '♥', rank: '2', value: 2, id: '2' },
    { suit: '♦', rank: 'A', value: 11, id: '3' },
    { suit: '♣', rank: 'A', value: 11, id: '4' },
    { suit: '♠', rank: 'A', value: 11, id: '5' },
  ];
  const evDeuces = evaluateFiveCardPokerHand(deucesHand, 'DEUCES_WILD');
  assert.equal(evDeuces.handName, 'Five of a Kind');
  assert.equal(evDeuces.multiplier, 15);

  const sevenCards: PlayingCard[] = [
    ...royal,
    { suit: '♥', rank: '2', value: 2, id: '6' },
    { suit: '♦', rank: '7', value: 7, id: '7' },
  ];
  const holdemBest = evaluateBestSevenCardHoldem(sevenCards);
  assert.equal(holdemBest.handName, 'Royal Flush');
});

test('Slots spin produces valid symbols and 250x jackpot on triple 7', () => {
  const jackpotSpin = spinSlotReels(() => 0.001);
  assert.deepEqual(jackpotSpin.reels, ['SEVEN', 'SEVEN', 'SEVEN']);
  assert.equal(jackpotSpin.multiplier, 250);
});

test('Royal Wheel, Diamond Mines, and Baccarat rules compute valid multipliers and outcomes', () => {
  const wheelJackpot = spinRoyalWheel(() => 0.01);
  assert.equal(wheelJackpot.segmentIndex, 0);
  assert.equal(wheelJackpot.multiplier, 50);

  const minesBoard = createMinesBoard(5, () => 0.5);
  assert.equal(minesBoard.length, 25);
  assert.equal(minesBoard.filter(Boolean).length, 5);
  assert.ok(calculateMinesMultiplier(5, 3) > 1.5);

  const baccaratRes = dealBaccaratRound([
    { suit: '♠', rank: '9', value: 9, id: '1' },
    { suit: '♥', rank: '4', value: 4, id: '2' },
    { suit: '♦', rank: '10', value: 10, id: '3' },
    { suit: '♣', rank: '3', value: 3, id: '4' },
    { suit: '♠', rank: '2', value: 2, id: '5' },
    { suit: '♦', rank: '5', value: 5, id: '6' },
  ]);
  assert.equal(baccaratRes.playerTotal, 9);
  assert.equal(baccaratRes.bankerTotal, 7);
  assert.equal(baccaratRes.winner, 'PLAYER');
});

