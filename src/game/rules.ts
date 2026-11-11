export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface PlayingCard {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

export type GameId =
  | 'LOBBY'
  | 'PLINKO'
  | 'ROULETTE'
  | 'DICE'
  | 'BLACKJACK'
  | 'VIDEO_POKER'
  | 'SLOTS'
  | 'WHEEL'
  | 'MINES'
  | 'BACCARAT';

export type LuxuryCategory = 'VIP_MEMBERSHIP' | 'LUXURY_CARS' | 'REAL_ESTATE' | 'COSMETICS';

export interface LuxuryItem {
  id: string;
  name: string;
  category: LuxuryCategory;
  priceCash: number;
  prestige: number;
  tagline: string;
  description: string;
  accentColor: string;
  perkLabel: string;
}

export interface PlayerAccountState {
  playerId: string;
  alias: string;
  chips: number;
  cash: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  handsPlayed: number;
  arrestCount: number;
  ownedItems: string[];
  equippedCardBack: string;
  equippedTableFelt: string;
  vipTier: string;
  saveCode: string;
  creditLineEnabled: boolean;
  heistAttempted?: boolean;
}

export const STARTING_CHIPS = 1000;
export const ARREST_DEBT_THRESHOLD = -10_000_000; // -10M chips triggers immediate arrest
export const DEBT_VIG_RATE = 0.035; // 3.5% compound house vig on active negative debt per credit draw

export const LUXURY_CATALOG: LuxuryItem[] = [
  // VIP Memberships
  {
    id: 'vip-silver',
    name: 'Velvet Silver Card',
    category: 'VIP_MEMBERSHIP',
    priceCash: 5_000,
    prestige: 100,
    tagline: 'Priority Floor Access',
    description: 'Unlocks the Silver High-Roller emblem in multiplayer rooms and reduces debt interest by 10%.',
    accentColor: '#94a3b8',
    perkLabel: 'Silver Room Badge · -10% Debt Vig',
  },
  {
    id: 'vip-gold',
    name: 'Velvet Gold Bullion Membership',
    category: 'VIP_MEMBERSHIP',
    priceCash: 50_000,
    prestige: 500,
    tagline: 'Private Salon Privileges',
    description: 'Grants the Gold Bullion crest, high-limit table stakes up to 1,000,000 chips, and +2% cashout bonus.',
    accentColor: '#eab308',
    perkLabel: 'Gold Crest · +2% Cashout Bonus',
  },
  {
    id: 'vip-obsidian',
    name: 'Obsidian Black Syndicate Key',
    category: 'VIP_MEMBERSHIP',
    priceCash: 500_000,
    prestige: 2500,
    tagline: 'Inner Circle Sovereign',
    description: 'Reserved for casino legends. Unlocks the Obsidian Sovereign title and +5% cashout bonus.',
    accentColor: '#f43f5e',
    perkLabel: 'Obsidian Title · +5% Cashout Bonus',
  },
  // Luxury Cars
  {
    id: 'car-gt3rs',
    name: 'Stuttgart 911 GT3 RS Weissach',
    category: 'LUXURY_CARS',
    priceCash: 285_000,
    prestige: 1200,
    tagline: 'Naturally Aspirated Track Weapon',
    description: 'Parked outside the Velvet Valet plaza in British Racing Green with magnesium forged wheels.',
    accentColor: '#10b981',
    perkLabel: '+1,200 Prestige · Valet Showcase',
  },
  {
    id: 'car-spectre',
    name: 'Mayfair V12 Phantom Drophead',
    category: 'LUXURY_CARS',
    priceCash: 650_000,
    prestige: 3000,
    tagline: 'Bespoke Starlight Coachwork',
    description: 'Chauffeur-driven two-tone obsidian and brushed champagne gold land yacht.',
    accentColor: '#f59e0b',
    perkLabel: '+3,000 Prestige · Chauffeur Status',
  },
  {
    id: 'car-tourbillon',
    name: 'Molsheim V16 Hyper-Coupe',
    category: 'LUXURY_CARS',
    priceCash: 4_200_000,
    prestige: 18000,
    tagline: '1,800 HP Exposed Carbon Masterpiece',
    description: 'Swiss horology instrument cluster and quad-turbocharged engineering.',
    accentColor: '#ec4899',
    perkLabel: '+18,000 Prestige · Hypercar Icon',
  },
  // Real Estate
  {
    id: 'est-penthouse',
    name: 'Monte Carlo Harbor Penthouse',
    category: 'REAL_ESTATE',
    priceCash: 1_500_000,
    prestige: 6500,
    tagline: 'Panoramic Grand Prix Terrace',
    description: 'Triplex sky villa overlooking the yacht basin with private dealer suite.',
    accentColor: '#38bdf8',
    perkLabel: '+6,500 Prestige · Monaco Address',
  },
  {
    id: 'est-villa',
    name: 'Lake Como Palazzo Bellagio',
    category: 'REAL_ESTATE',
    priceCash: 6_800_000,
    prestige: 28000,
    tagline: '18th-Century Waterfront Estate',
    description: 'Private Riva boat dock, cypress gardens, and subterranean wine vault.',
    accentColor: '#a855f7',
    perkLabel: '+28,000 Prestige · Italian Estate',
  },
  {
    id: 'est-island',
    name: 'Sovereign Velvet Cay Island',
    category: 'REAL_ESTATE',
    priceCash: 25_000_000,
    prestige: 100000,
    tagline: 'Private Resort & Superyacht Marina',
    description: 'Your own private island sanctuary in the Exumas with a licensed high-roller casino floor.',
    accentColor: '#eab308',
    perkLabel: '+100,000 Prestige · Island Mogul',
  },
  // Cosmetics
  {
    id: 'cos-gold-deck',
    name: '24K Gold Leaf Playing Cards',
    category: 'COSMETICS',
    priceCash: 15_000,
    prestige: 300,
    tagline: 'Gilded Court Card Styling',
    description: 'Equips solid gold-rimmed card faces and ornate brass filigree card backs in Blackjack & Poker.',
    accentColor: '#eab308',
    perkLabel: 'Equippable Card Deck Style',
  },
  {
    id: 'cos-crimson-deck',
    name: 'Royal Crimson Velvet Deck',
    category: 'COSMETICS',
    priceCash: 25_000,
    prestige: 450,
    tagline: 'Monte Carlo Baccarat Edition',
    description: 'Deep ruby lacquer finish with ivory indices for high-contrast table play.',
    accentColor: '#f43f5e',
    perkLabel: 'Equippable Card Deck Style',
  },
  {
    id: 'cos-obsidian-felt',
    name: 'Noir Obsidian & Brass Table Felt',
    category: 'COSMETICS',
    priceCash: 40_000,
    prestige: 800,
    tagline: 'Custom Casino Floor Theme',
    description: 'Transforms your active game tables with midnight obsidian weave and brushed gold trim.',
    accentColor: '#14b8a6',
    perkLabel: 'Equippable Table Felt',
  },
];

export function createInitialAccountState(): PlayerAccountState {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    playerId: `vlv-${Date.now().toString(36)}-${randomSuffix}`,
    alias: `VIP_${randomSuffix}`,
    chips: STARTING_CHIPS,
    cash: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    handsPlayed: 0,
    arrestCount: 0,
    ownedItems: [],
    equippedCardBack: 'default',
    equippedTableFelt: 'emerald',
    vipTier: 'Member',
    saveCode: '',
    creditLineEnabled: true,
    heistAttempted: false,
  };
}

export function shouldArrestPlayer(chips: number): boolean {
  return chips <= ARREST_DEBT_THRESHOLD;
}

export function canPlaceBet(chips: number, betAmount: number, creditLineEnabled: boolean): boolean {
  if (!Number.isFinite(betAmount) || betAmount <= 0) return false;
  if (chips >= betAmount) return true;
  if (!creditLineEnabled) return false;
  // Can borrow down to ARREST_DEBT_THRESHOLD
  return chips - betAmount >= ARREST_DEBT_THRESHOLD - 5_000_000;
}

export interface BetSettlementResult {
  nextChips: number;
  netChange: number;
  debtInterestCharged: number;
  arrested: boolean;
}

export function settleBet(
  currentChips: number,
  wager: number,
  grossPayout: number,
  hasSilverVip = false
): BetSettlementResult {
  const rawAfter = currentChips - wager + grossPayout;
  let debtInterestCharged = 0;

  // If the player is in debt and lost or remains negative, underground loan sharks charge vig
  if (rawAfter < 0 && grossPayout < wager) {
    const rate = hasSilverVip ? DEBT_VIG_RATE * 0.9 : DEBT_VIG_RATE;
    debtInterestCharged = Math.max(10, Math.round(Math.abs(rawAfter) * rate));
  }

  const nextChips = Math.round(rawAfter - debtInterestCharged);
  const arrested = shouldArrestPlayer(nextChips);

  return {
    nextChips,
    netChange: nextChips - currentChips,
    debtInterestCharged,
    arrested,
  };
}

export function executeArrestReset(state: PlayerAccountState): PlayerAccountState {
  // Keep VIP memberships and Cosmetics, but seize Luxury Cars and Real Estate!
  const keptItems = state.ownedItems.filter((itemId) => {
    const item = LUXURY_CATALOG.find((i) => i.id === itemId);
    return item && (item.category === 'VIP_MEMBERSHIP' || item.category === 'COSMETICS');
  });

  return {
    ...state,
    chips: STARTING_CHIPS,
    cash: 0,
    arrestCount: state.arrestCount + 1,
    ownedItems: keptItems,
  };
}

export interface PreArrestSnapshot {
  finalDebtOrChips: number;
  savedChips: number;
  savedCash: number;
  savedOwnedItems: string[];
  handsPlayed: number;
  arrestReason: 'DEBT_DEFAULT' | 'CASINO_HEIST_CAUGHT';
}

export function executePrisonEscapeSuccess(
  state: PlayerAccountState,
  snapshot: PreArrestSnapshot,
  newAlias?: string
): PlayerAccountState {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const forgedAlias =
    newAlias && newAlias.trim().length > 0 ? newAlias.trim().slice(0, 18) : `Ghost_${randomCode}`;

  // Keep the money (chips + cash + luxury items) won last time, wiping any negative debt!
  const restoredChips = Math.max(STARTING_CHIPS, snapshot.savedChips);
  const restoredCash = Math.max(0, snapshot.savedCash);

  return {
    ...state,
    playerId: `vlv-ghost-${Date.now().toString(36)}-${randomCode}`,
    alias: forgedAlias,
    chips: restoredChips,
    cash: restoredCash,
    ownedItems: [...snapshot.savedOwnedItems],
    heistAttempted: false, // New identity gets a fresh record!
  };
}

export function calculateCashoutBonusMultiplier(ownedItems: string[]): number {
  if (ownedItems.includes('vip-obsidian')) return 1.05;
  if (ownedItems.includes('vip-gold')) return 1.02;
  return 1.0;
}

export function calculateNetWorth(state: PlayerAccountState): number {
  const assetsValue = state.ownedItems.reduce((sum, id) => {
    const found = LUXURY_CATALOG.find((item) => item.id === id);
    return sum + (found ? found.priceCash : 0);
  }, 0);
  return state.chips + state.cash + assetsValue;
}

// ============================================================================
// 1. PLINKO PYRAMID LOGIC (Realistic House Edge — Center-Weighted)
// ============================================================================
export type PlinkoRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export const PLINKO_MULTIPLIERS: Record<PlinkoRisk, Record<number, number[]>> = {
  LOW: {
    8: [8.5, 3.2, 1.6, 1.2, 0.8, 1.2, 1.6, 3.2, 8.5],
    12: [15, 5, 2.4, 1.8, 1.4, 1.1, 0.8, 1.1, 1.4, 1.8, 2.4, 5, 15],
    16: [25, 12, 4, 2.2, 1.8, 1.5, 1.2, 1.0, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 4, 12, 25],
  },
  MEDIUM: {
    8: [18, 5, 2.0, 1.1, 0.7, 1.1, 2.0, 5, 18],
    12: [45, 15, 6, 3, 1.6, 1.1, 0.7, 1.1, 1.6, 3, 6, 15, 45],
    16: [130, 50, 15, 7, 4, 2.2, 1.4, 1.0, 0.7, 1.0, 1.4, 2.2, 4, 7, 15, 50, 130],
  },
  HIGH: {
    8: [110, 24, 4, 1.2, 0.6, 1.2, 4, 24, 110],
    12: [170, 32, 10, 3.5, 1.5, 0.8, 0.5, 0.8, 1.5, 3.5, 10, 32, 170],
    16: [1000, 150, 35, 12, 6, 3, 1.2, 0.8, 0.5, 0.8, 1.2, 3, 6, 12, 35, 150, 1000],
  },
};

export function samplePlinkoPath(rows: number, risk: PlinkoRisk, rng: () => number = Math.random): {
  directions: number[]; // 0 = left, 1 = right
  bucketIndex: number;
  multiplier: number;
} {
  const directions: number[] = [];
  let rightSteps = 0;

  // Player-friendly outward momentum so balls hit 4x, 24x, and 110x buckets more often
  for (let r = 0; r < rows; r++) {
    const step = rng() < 0.5 ? 1 : 0;
    directions.push(step);
    rightSteps += step;
  }

  const table = PLINKO_MULTIPLIERS[risk][rows] || PLINKO_MULTIPLIERS.HIGH[8];
  const bucketIndex = Math.max(0, Math.min(table.length - 1, rightSteps));
  return {
    directions,
    bucketIndex,
    multiplier: table[bucketIndex],
  };
}

// ============================================================================
// 2. EUROPEAN ROULETTE LOGIC (37 Pockets: 0 to 36)
// ============================================================================
export const ROULETTE_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function getRouletteColor(num: number): 'GREEN' | 'RED' | 'BLACK' {
  if (num === 0) return 'GREEN';
  return RED_NUMBERS.has(num) ? 'RED' : 'BLACK';
}

export type RouletteBetType =
  | 'STRAIGHT'
  | 'RED'
  | 'BLACK'
  | 'EVEN'
  | 'ODD'
  | 'LOW'
  | 'HIGH'
  | 'DOZEN_1'
  | 'DOZEN_2'
  | 'DOZEN_3'
  | 'COL_1'
  | 'COL_2'
  | 'COL_3';

export interface RouletteBet {
  type: RouletteBetType;
  number?: number;
  amount: number;
  label: string;
}

export function evaluateRouletteBet(bet: RouletteBet, winningNumber: number): number {
  switch (bet.type) {
    case 'STRAIGHT':
      return bet.number === winningNumber ? bet.amount * 36 : 0;
    case 'RED':
      return winningNumber !== 0 && RED_NUMBERS.has(winningNumber) ? bet.amount * 2 : 0;
    case 'BLACK':
      return winningNumber !== 0 && !RED_NUMBERS.has(winningNumber) ? bet.amount * 2 : 0;
    case 'EVEN':
      return winningNumber !== 0 && winningNumber % 2 === 0 ? bet.amount * 2 : 0;
    case 'ODD':
      return winningNumber !== 0 && winningNumber % 2 === 1 ? bet.amount * 2 : 0;
    case 'LOW':
      return winningNumber >= 1 && winningNumber <= 18 ? bet.amount * 2 : 0;
    case 'HIGH':
      return winningNumber >= 19 && winningNumber <= 36 ? bet.amount * 2 : 0;
    case 'DOZEN_1':
      return winningNumber >= 1 && winningNumber <= 12 ? bet.amount * 3 : 0;
    case 'DOZEN_2':
      return winningNumber >= 13 && winningNumber <= 24 ? bet.amount * 3 : 0;
    case 'DOZEN_3':
      return winningNumber >= 25 && winningNumber <= 36 ? bet.amount * 3 : 0;
    case 'COL_1':
      return winningNumber !== 0 && winningNumber % 3 === 1 ? bet.amount * 3 : 0;
    case 'COL_2':
      return winningNumber !== 0 && winningNumber % 3 === 2 ? bet.amount * 3 : 0;
    case 'COL_3':
      return winningNumber !== 0 && winningNumber % 3 === 0 ? bet.amount * 3 : 0;
    default:
      return 0;
  }
}

// ============================================================================
// 3. BRASS DICE LOGIC (98.0X MAX Multiplier, 2.5% House Edge)
// ============================================================================
export function calculateDiceMultiplier(target: number, mode: 'OVER' | 'UNDER'): number {
  const clampedTarget = Math.max(1, Math.min(99, Math.round(target)));
  const winChance = mode === 'UNDER' ? clampedTarget : 100 - clampedTarget;
  if (winChance <= 0 || winChance >= 99) return 1.01;
  // 98.0 / winChance gives 98.0x max at 1% chance (matching "98.0X MAX" on the reference card)
  return Number(Math.min(98.0, 98.0 / winChance).toFixed(2));
}

export function evaluateBrassDiceRoll(
  roll: number, // 1 to 100
  target: number,
  mode: 'OVER' | 'UNDER'
): { won: boolean; multiplier: number } {
  const multiplier = calculateDiceMultiplier(target, mode);
  const won = mode === 'UNDER' ? roll <= target : roll > target;
  return { won, multiplier: won ? multiplier : 0 };
}

// ============================================================================
// 4. BLACKJACK 21 & DECK LOGIC
// ============================================================================
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createShoe(decks = 4, rng: () => number = Math.random): PlayingCard[] {
  const cards: PlayingCard[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (let i = 0; i < RANKS.length; i++) {
        const rank = RANKS[i];
        let val = i + 2;
        if (rank === 'J' || rank === 'Q' || rank === 'K') val = 10;
        if (rank === 'A') val = 11;
        cards.push({
          suit,
          rank,
          value: val,
          id: `${d}-${rank}${suit}-${Math.random().toString(36).slice(2, 7)}`,
        });
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function calculateBlackjackHand(cards: PlayingCard[]): {
  total: number;
  isSoft: boolean;
  isBlackjack: boolean;
  isBust: boolean;
} {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += c.value;
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return {
    total,
    isSoft: aces > 0 && total <= 21,
    isBlackjack: cards.length === 2 && total === 21,
    isBust: total > 21,
  };
}

// ============================================================================
// 5. VIDEO POKER & TEXAS HOLD'EM EVALUATOR
// ============================================================================
export type VideoPokerVariant = 'JACKS_OR_BETTER' | 'DEUCES_WILD' | 'TEXAS_HOLDEM';

export interface PokerEvaluation {
  handName: string;
  tierScore: number; // Used to compare two hands in Texas Hold'em
  multiplier: number;
}

function getRankNumeric(rank: Rank): number {
  const idx = RANKS.indexOf(rank);
  return idx + 2; // '2' -> 2 ... 'A' -> 14
}

export function evaluateFiveCardPokerHand(
  cards: PlayingCard[],
  variant: VideoPokerVariant = 'JACKS_OR_BETTER'
): PokerEvaluation {
  if (cards.length !== 5) {
    return { handName: 'High Card', tierScore: 0, multiplier: 0 };
  }

  const wildCount = variant === 'DEUCES_WILD' ? cards.filter((c) => c.rank === '2').length : 0;
  const nonWilds = variant === 'DEUCES_WILD' ? cards.filter((c) => c.rank !== '2') : cards;

  const suits = new Set(nonWilds.map((c) => c.suit));
  const isFlush = nonWilds.length === 0 || suits.size === 1;

  const rankCounts = new Map<number, number>();
  for (const c of nonWilds) {
    const r = getRankNumeric(c.rank);
    rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  }

  const countsDesc = Array.from(rankCounts.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const highestGroupCount = (countsDesc[0]?.[1] || 0) + wildCount;
  const secondGroupCount = countsDesc[1]?.[1] || 0;

  // Check straight (including A-2-3-4-5 wheel)
  const uniqueRanks = Array.from(rankCounts.keys()).sort((a, b) => a - b);
  let isStraight = false;
  let straightHigh = uniqueRanks[uniqueRanks.length - 1] || 14;

  if (uniqueRanks.length === nonWilds.length) {
    const span = uniqueRanks.length > 0 ? uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] : 0;
    if (span <= 4) {
      isStraight = true;
      straightHigh = Math.min(14, (uniqueRanks[0] || 10) + 4);
    } else if (uniqueRanks.includes(14)) {
      // Wheel check (Ace as 1)
      const lowRanks = uniqueRanks.map((r) => (r === 14 ? 1 : r)).sort((a, b) => a - b);
      if (lowRanks[lowRanks.length - 1] - lowRanks[0] <= 4) {
        isStraight = true;
        straightHigh = 5;
      }
    }
  }

  const isRoyal =
    isFlush &&
    isStraight &&
    nonWilds.every((c) => ['10', 'J', 'Q', 'K', 'A'].includes(c.rank));

  const highTieBreaker = countsDesc.reduce((acc, [rank], idx) => acc + rank * Math.pow(15, 4 - idx), 0);

  if (variant === 'DEUCES_WILD') {
    if (isRoyal && wildCount === 0) {
      return { handName: 'Natural Royal Flush', tierScore: 10_000_000, multiplier: 800 };
    }
    if (wildCount === 4) {
      return { handName: 'Four Deuces', tierScore: 9_500_000, multiplier: 200 };
    }
    if (isRoyal) {
      return { handName: 'Wild Royal Flush', tierScore: 9_000_000, multiplier: 25 };
    }
    if (highestGroupCount >= 5) {
      return { handName: 'Five of a Kind', tierScore: 8_500_000 + highTieBreaker, multiplier: 15 };
    }
    if (isFlush && isStraight) {
      return { handName: 'Straight Flush', tierScore: 8_000_000 + straightHigh, multiplier: 9 };
    }
    if (highestGroupCount === 4) {
      return { handName: 'Four of a Kind', tierScore: 7_000_000 + highTieBreaker, multiplier: 4 };
    }
    if (highestGroupCount === 3 && secondGroupCount === 2) {
      return { handName: 'Full House', tierScore: 6_000_000 + highTieBreaker, multiplier: 3 };
    }
    if (isFlush) {
      return { handName: 'Flush', tierScore: 5_000_000 + highTieBreaker, multiplier: 2 };
    }
    if (isStraight) {
      return { handName: 'Straight', tierScore: 4_000_000 + straightHigh, multiplier: 2 };
    }
    if (highestGroupCount === 3) {
      return { handName: 'Three of a Kind', tierScore: 3_000_000 + highTieBreaker, multiplier: 1 };
    }
    return { handName: 'No Qualifying Hand (Min 3-of-a-Kind)', tierScore: highTieBreaker, multiplier: 0 };
  }

  // Standard & Jacks or Better / Texas Hold'em Ranking
  if (isRoyal) {
    return { handName: 'Royal Flush', tierScore: 9_000_000, multiplier: 800 };
  }
  if (isFlush && isStraight) {
    return { handName: 'Straight Flush', tierScore: 8_000_000 + straightHigh, multiplier: 50 };
  }
  if (highestGroupCount === 4) {
    return { handName: 'Four of a Kind', tierScore: 7_000_000 + highTieBreaker, multiplier: 25 };
  }
  if (highestGroupCount === 3 && secondGroupCount === 2) {
    return { handName: 'Full House', tierScore: 6_000_000 + highTieBreaker, multiplier: 9 };
  }
  if (isFlush) {
    return { handName: 'Flush', tierScore: 5_000_000 + highTieBreaker, multiplier: 6 };
  }
  if (isStraight) {
    return { handName: 'Straight', tierScore: 4_000_000 + straightHigh, multiplier: 4 };
  }
  if (highestGroupCount === 3) {
    return { handName: 'Three of a Kind', tierScore: 3_000_000 + highTieBreaker, multiplier: 3 };
  }
  if (highestGroupCount === 2 && secondGroupCount === 2) {
    return { handName: 'Two Pair', tierScore: 2_000_000 + highTieBreaker, multiplier: 2 };
  }
  if (highestGroupCount === 2) {
    const pairRank = countsDesc[0][0];
    const isJacksOrBetter = pairRank >= 11; // J=11, Q=12, K=13, A=14
    return {
      handName: isJacksOrBetter ? 'Jacks or Better' : 'Low Pair',
      tierScore: 1_000_000 + highTieBreaker,
      multiplier: isJacksOrBetter ? 1 : 0,
    };
  }

  return { handName: 'High Card', tierScore: highTieBreaker, multiplier: 0 };
}

export function evaluateBestSevenCardHoldem(sevenCards: PlayingCard[]): PokerEvaluation {
  if (sevenCards.length <= 5) {
    return evaluateFiveCardPokerHand(sevenCards.slice(0, 5), 'TEXAS_HOLDEM');
  }

  let best: PokerEvaluation = { handName: 'High Card', tierScore: -1, multiplier: 0 };
  const n = sevenCards.length;

  // Iterate all 5-card combinations (C(7,5) = 21)
  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            const five = [sevenCards[i], sevenCards[j], sevenCards[k], sevenCards[l], sevenCards[m]];
            const ev = evaluateFiveCardPokerHand(five, 'TEXAS_HOLDEM');
            if (ev.tierScore > best.tierScore) {
              best = ev;
            }
          }
        }
      }
    }
  }
  return best;
}

// ============================================================================
// 6. VELVET SLOTS (MAX 250X, Weighted Reels for Real Challenge)
// ============================================================================
export type SlotSymbolId = 'SEVEN' | 'DIAMOND' | 'BAR' | 'CROWN' | 'BELL' | 'CHERRY' | 'BLANKS';

export interface SlotSymbolConfig {
  id: SlotSymbolId;
  label: string;
  weight: number;
  threeKindMultiplier: number;
  color: string;
}

export const SLOT_SYMBOLS: SlotSymbolConfig[] = [
  { id: 'SEVEN', label: '7', weight: 10, threeKindMultiplier: 250, color: '#dc2626' },
  { id: 'DIAMOND', label: '♦', weight: 14, threeKindMultiplier: 90, color: '#38bdf8' },
  { id: 'BAR', label: 'BAR', weight: 18, threeKindMultiplier: 40, color: '#eab308' },
  { id: 'CROWN', label: '♛', weight: 20, threeKindMultiplier: 22, color: '#f59e0b' },
  { id: 'BELL', label: '🔔', weight: 24, threeKindMultiplier: 12, color: '#fde047' },
  { id: 'CHERRY', label: '🍒', weight: 28, threeKindMultiplier: 6, color: '#f43f5e' },
  { id: 'BLANKS', label: '•', weight: 8, threeKindMultiplier: 0, color: '#475569' },
];

export function spinSlotReels(rng: () => number = Math.random): {
  reels: [SlotSymbolId, SlotSymbolId, SlotSymbolId];
  multiplier: number;
  outcomeLabel: string;
} {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

  const pickSymbol = (): SlotSymbolId => {
    let roll = rng() * totalWeight;
    for (const sym of SLOT_SYMBOLS) {
      if (roll < sym.weight) return sym.id;
      roll -= sym.weight;
    }
    return 'CHERRY';
  };

  const r1 = pickSymbol();
  const r2 = pickSymbol();
  const r3 = pickSymbol();
  const reels: [SlotSymbolId, SlotSymbolId, SlotSymbolId] = [r1, r2, r3];

  if (r1 === r2 && r2 === r3 && r1 !== 'BLANKS') {
    const cfg = SLOT_SYMBOLS.find((s) => s.id === r1)!;
    return {
      reels,
      multiplier: cfg.threeKindMultiplier,
      outcomeLabel: r1 === 'SEVEN' ? 'GRAND JACKPOT 7-7-7 (250X)!' : `TRIPLE ${r1} (${cfg.threeKindMultiplier}X)`,
    };
  }

  const sevensCount = reels.filter((r) => r === 'SEVEN').length;
  if (sevensCount === 2) {
    return { reels, multiplier: 8, outcomeLabel: 'Double Lucky 7s (8X)' };
  }
  if (sevensCount === 1) {
    return { reels, multiplier: 2, outcomeLabel: 'Single Lucky 7 Bonus (2X)' };
  }

  // Any pair of non-blank symbols wins 3x!
  if ((r1 === r2 && r1 !== 'BLANKS') || (r2 === r3 && r2 !== 'BLANKS') || (r1 === r3 && r1 !== 'BLANKS')) {
    return { reels, multiplier: 3, outcomeLabel: 'Matching Pair Payline (3X)' };
  }

  const barsAndCrowns = reels.every((r) => r === 'BAR' || r === 'CROWN' || r === 'DIAMOND');
  if (barsAndCrowns) {
    return { reels, multiplier: 4, outcomeLabel: 'Royal Bullion Mix (4X)' };
  }

  return { reels, multiplier: 0, outcomeLabel: 'No Payline Match' };
}

// ============================================================================
// 7. ROYAL WHEEL 50X (24-Pocket Monte Carlo Money Wheel — Player Boosted)
// ============================================================================
export type RoyalWheelMult = 1 | 2 | 5 | 10 | 50;

export const ROYAL_WHEEL_SEGMENTS: RoyalWheelMult[] = [
  50, 2, 5, 1, 10, 2, 5, 1, 10, 2, 5, 1, 50, 2, 5, 1, 10, 2, 5, 1, 10, 2, 5, 2,
];

export function spinRoyalWheel(rng: () => number = Math.random): {
  segmentIndex: number;
  multiplier: RoyalWheelMult;
} {
  const idx = Math.max(
    0,
    Math.min(ROYAL_WHEEL_SEGMENTS.length - 1, Math.floor(rng() * ROYAL_WHEEL_SEGMENTS.length))
  );
  return {
    segmentIndex: idx,
    multiplier: ROYAL_WHEEL_SEGMENTS[idx],
  };
}

// ============================================================================
// 8. DIAMOND MINES (5x5 Syndicate Vault Sweeper, 25 Tiles — Boosted Multipliers)
// ============================================================================
export function createMinesBoard(mineCount: number, rng: () => number = Math.random): boolean[] {
  const clampedMines = Math.max(1, Math.min(24, Math.round(mineCount)));
  const board = Array(25).fill(false);
  for (let i = 0; i < clampedMines; i++) {
    board[i] = true;
  }
  // Fisher-Yates shuffle
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

export function calculateMinesMultiplier(mineCount: number, revealedGems: number): number {
  if (revealedGems <= 0) return 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - Math.max(1, Math.min(24, mineCount));
  if (revealedGems > safeTiles) return 0;

  let probability = 1;
  for (let i = 0; i < revealedGems; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }
  // Generous 1.15x boost so players win bigger multipliers faster
  const rawMult = 1.15 / probability;
  return Number(Math.max(1.25, rawMult).toFixed(2));
}

// ============================================================================
// 9. MONTE CARLO BACCARAT (Punto Banco 9)
// ============================================================================
export type BaccaratBetSide = 'PLAYER' | 'BANKER' | 'TIE' | 'PLAYER_PAIR' | 'BANKER_PAIR';

export function calculateBaccaratTotal(cards: PlayingCard[]): number {
  const sum = cards.reduce((acc, c) => {
    if (c.rank === '10' || c.rank === 'J' || c.rank === 'Q' || c.rank === 'K') return acc;
    if (c.rank === 'A') return acc + 1;
    return acc + Number(c.rank);
  }, 0);
  return sum % 10;
}

export function dealBaccaratRound(shoeCards: PlayingCard[]): {
  playerCards: PlayingCard[];
  bankerCards: PlayingCard[];
  playerTotal: number;
  bankerTotal: number;
  winner: 'PLAYER' | 'BANKER' | 'TIE';
  playerPair: boolean;
  bankerPair: boolean;
} {
  const working = shoeCards.length >= 6 ? shoeCards : createShoe(4);
  const pCards: PlayingCard[] = [working[0], working[2]];
  const bCards: PlayingCard[] = [working[1], working[3]];

  const playerPair = pCards[0].rank === pCards[1].rank;
  const bankerPair = bCards[0].rank === bCards[1].rank;

  let pTotal = calculateBaccaratTotal(pCards);
  let bTotal = calculateBaccaratTotal(bCards);

  // Natural 8 or 9 stands immediately
  if (pTotal < 8 && bTotal < 8) {
    let playerThirdVal: number | null = null;
    if (pTotal <= 5) {
      const p3 = working[4];
      pCards.push(p3);
      pTotal = calculateBaccaratTotal(pCards);
      playerThirdVal = calculateBaccaratTotal([p3]);
    }

    if (playerThirdVal === null) {
      if (bTotal <= 5) {
        bCards.push(working[4]);
        bTotal = calculateBaccaratTotal(bCards);
      }
    } else {
      const shouldBankerDraw =
        bTotal <= 2 ||
        (bTotal === 3 && playerThirdVal !== 8) ||
        (bTotal === 4 && playerThirdVal >= 2 && playerThirdVal <= 7) ||
        (bTotal === 5 && playerThirdVal >= 4 && playerThirdVal <= 7) ||
        (bTotal === 6 && (playerThirdVal === 6 || playerThirdVal === 7));

      if (shouldBankerDraw) {
        bCards.push(working[5]);
        bTotal = calculateBaccaratTotal(bCards);
      }
    }
  }

  const winner = pTotal > bTotal ? 'PLAYER' : bTotal > pTotal ? 'BANKER' : 'TIE';
  return {
    playerCards: pCards,
    bankerCards: bCards,
    playerTotal: pTotal,
    bankerTotal: bTotal,
    winner,
    playerPair,
    bankerPair,
  };
}

