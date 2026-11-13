import React, { useState } from 'react';
import {
  ARREST_DEBT_THRESHOLD,
  LUXURY_CATALOG,
  LuxuryCategory,
  LuxuryItem,
  PlayerAccountState,
  calculateCashoutBonusMultiplier,
  calculateNetWorth,
} from '../game/rules';
import { soundEngine } from '../game/sound';
import { LuxuryItemVisual } from './LuxuryItemVisual';

interface CashierLuxuryModalProps {
  account: PlayerAccountState;
  onClose: () => void;
  onCashoutChips: (chipAmount: number) => void;
  onBuyChipsWithCash: (cashAmount: number) => void;
  onTakeUndergroundLoan: (loanAmount: number) => void;
  onToggleCreditLine: () => void;
  onBuyLuxuryItem: (item: LuxuryItem) => void;
  onEquipCosmetic: (item: LuxuryItem) => void;
}

export const CashierLuxuryModal: React.FC<CashierLuxuryModalProps> = ({
  account,
  onClose,
  onCashoutChips,
  onBuyChipsWithCash,
  onTakeUndergroundLoan,
  onToggleCreditLine,
  onBuyLuxuryItem,
  onEquipCosmetic,
}) => {
  const [activeTab, setActiveTab] = useState<'CASHIER' | LuxuryCategory>('CASHIER');
  const [cashoutInput, setCashoutInput] = useState<number>(Math.max(100, Math.floor(Math.max(0, account.chips) / 2)));
  const [buyChipsInput, setBuyChipsInput] = useState<number>(1000);
  const [loanInput, setLoanInput] = useState<number>(1_000_000);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const bonusMult = calculateCashoutBonusMultiplier(account.ownedItems);
  const netWorth = calculateNetWorth(account);
  const debtRatio =
    account.chips < 0
      ? Math.min(100, Math.round((Math.abs(account.chips) / Math.abs(ARREST_DEBT_THRESHOLD)) * 100))
      : 0;

  const filteredItems = LUXURY_CATALOG.filter((item) => item.category === activeTab);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cashier and Luxury Lifestyle Boutique"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-[#0a1712] border border-amber-400/35 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#07110d] border-b border-emerald-500/20 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-amber-300">Velvet Sovereign Vault &amp; Boutique</div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              CASHIER, UNDERGROUND CREDIT &amp; LUXURY PORTFOLIO
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cashier Modal"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        {/* Summary Balance Bar */}
        <div className="px-6 py-3.5 bg-[#0c1d16] border-b border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-slate-400">Casino Chips</div>
            <div
              className={`font-mono-tabular text-base font-extrabold ${
                account.chips < 0 ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {account.chips.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Liquid Cash (USD)</div>
            <div className="font-mono-tabular text-base font-extrabold text-emerald-400">
              ${account.cash.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Net Worth</div>
            <div className="font-mono-tabular text-base font-extrabold text-white">
              ${netWorth.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Arrest Threshold (-10M)</div>
            <div className="font-mono-tabular text-base font-extrabold text-rose-300">
              {account.chips < 0 ? `${debtRatio}% Danger` : '0% Safe'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'CASHIER', label: 'Cashout & Debt Credit' },
              { id: 'VIP_MEMBERSHIP', label: 'VIP Memberships' },
              { id: 'LUXURY_CARS', label: 'Luxury Cars' },
              { id: 'REAL_ESTATE', label: 'Real Estate' },
              { id: 'COSMETICS', label: 'Table & Card Cosmetics' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.playChipClick();
                setActiveTab(t.id);
                setStatusBanner(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === t.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-[#07110d] text-slate-300 hover:text-white border border-emerald-500/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {statusBanner && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-400/40 text-xs text-emerald-200">
            {statusBanner}
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'CASHIER' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cashout Chips to USD */}
              <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-5 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-amber-300">
                    Cashout Chips to Liquid Money ($)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Convert positive casino chips into USD ($) to purchase VIP Memberships, Supercars, Real Estate, and Cosmetics.{' '}
                    {bonusMult > 1 && (
                      <span className="text-emerald-300 font-semibold">
                        Active VIP Bonus: +{Math.round((bonusMult - 1) * 100)}% Cashout!
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="cashout-amount" className="block text-xs font-semibold text-slate-300">
                    Chips to Cash Out
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="cashout-amount"
                      type="number"
                      min={100}
                      value={cashoutInput}
                      onChange={(e) => setCashoutInput(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setCashoutInput(Math.max(0, account.chips))}
                      className="px-3 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-mono-tabular font-bold text-amber-300 cursor-pointer"
                    >
                      ALL
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={account.chips <= 0 || cashoutInput <= 0 || cashoutInput > account.chips}
                  onClick={() => {
                    onCashoutChips(cashoutInput);
                    soundEngine.playWinChime(false);
                    setStatusBanner(
                      `Cashed out ${cashoutInput.toLocaleString()} chips for $${Math.round(
                        cashoutInput * bonusMult
                      ).toLocaleString()}!`
                    );
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer"
                >
                  Cashout for ${Math.round(cashoutInput * bonusMult).toLocaleString()} USD
                </button>

                {/* Convert Cash Back to Chips */}
                <div className="pt-4 border-t border-emerald-500/15 space-y-2">
                  <label htmlFor="buy-chips-amount" className="block text-xs font-semibold text-slate-300">
                    Exchange USD ($) Back Into Chips (or Repay Debt)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="buy-chips-amount"
                      type="number"
                      min={100}
                      value={buyChipsInput}
                      onChange={(e) => setBuyChipsInput(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3.5 py-2 font-mono-tabular text-sm font-bold text-white"
                    />
                    <button
                      type="button"
                      disabled={account.cash <= 0 || buyChipsInput <= 0 || buyChipsInput > account.cash}
                      onClick={() => {
                        onBuyChipsWithCash(buyChipsInput);
                        soundEngine.playChipClick();
                        setStatusBanner(`Converted $${buyChipsInput.toLocaleString()} into ${buyChipsInput.toLocaleString()} chips.`);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
                    >
                      Buy Chips
                    </button>
                  </div>
                </div>
              </div>

              {/* Underground Credit Line & Debt Arrest Warning */}
              <div className="rounded-2xl bg-[#160b0e] border border-rose-500/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-rose-300">
                    Underground Credit &amp; Debt Line
                  </h3>
                  <button
                    type="button"
                    onClick={onToggleCreditLine}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      account.creditLineEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {account.creditLineEnabled ? 'Credit Line: ON' : 'Credit Line: OFF'}
                  </button>
                </div>

                <p className="text-xs text-rose-200/80 leading-relaxed">
                  When broke, you can keep gambling into negative chip debt or draw emergency credit.{' '}
                  <strong>WARNING:</strong> Negative balances accrue 6.0% syndicate vig per loss. If your balance reaches{' '}
                  <strong className="font-mono-tabular text-rose-400">-10,000,000 (-10M)</strong> chips, you will be{' '}
                  <strong>ARRESTED</strong>, your cars &amp; real estate will be seized, and you will restart at 1,000 chips!
                </p>

                {/* Debt Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono-tabular">
                    <span className="text-slate-400">Current Debt Exposure:</span>
                    <span className="text-rose-400 font-bold">
                      {account.chips < 0 ? account.chips.toLocaleString() : '0'} / -10,000,000
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/60 overflow-hidden border border-rose-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-200"
                      style={{ width: `${debtRatio}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label htmlFor="loan-amount" className="block text-xs font-semibold text-rose-200">
                    Advance Syndicate Marker (Adds Cash $, Deducts Chips Into Debt)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="loan-amount"
                      type="number"
                      step={500000}
                      min={10000}
                      value={loanInput}
                      onChange={(e) => setLoanInput(Math.max(10000, Math.round(Number(e.target.value) || 0)))}
                      className="w-full rounded-xl bg-black/50 border border-rose-500/35 px-3.5 py-2 font-mono-tabular text-sm font-bold text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTakeUndergroundLoan(loanInput);
                      setStatusBanner(
                        `Signed Syndicate Marker for $${loanInput.toLocaleString()} Cash (-${Math.round(
                          loanInput * 1.25
                        ).toLocaleString()} chip debt including 25% origination fee).`
                      );
                    }}
                    className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Sign Marker for ${loanInput.toLocaleString()} Cash (-{Math.round(loanInput * 1.25).toLocaleString()} Chips)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Luxury Catalog Grid with Bespoke Item Visuals */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isOwned = account.ownedItems.includes(item.id);
                const isEquipped =
                  account.equippedCardBack === item.id || account.equippedTableFelt === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-4 flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-2.5">
                      <LuxuryItemVisual itemId={item.id} className="w-full h-32" />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: item.accentColor }}
                        >
                          {item.tagline}
                        </span>
                        <span className="font-mono-tabular text-xs font-extrabold text-emerald-400">
                          ${item.priceCash.toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      <div className="text-[11px] font-semibold text-amber-300 pt-0.5">
                        {item.perkLabel}
                      </div>
                    </div>

                    {isOwned ? (
                      item.category === 'COSMETICS' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onEquipCosmetic(item);
                            soundEngine.playChipClick();
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          }`}
                        >
                          {isEquipped ? 'Equipped ✓' : 'Equip Cosmetic'}
                        </button>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/35 text-center text-xs font-bold text-emerald-300">
                          Owned in Vault ✓
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={account.cash < item.priceCash}
                        onClick={() => {
                          onBuyLuxuryItem(item);
                          soundEngine.playWinChime(true);
                          setStatusBanner(`Purchased ${item.name} for $${item.priceCash.toLocaleString()}!`);
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        {account.cash < item.priceCash
                          ? `Need $${item.priceCash.toLocaleString()} Cash`
                          : `Purchase ($${item.priceCash.toLocaleString()})`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
