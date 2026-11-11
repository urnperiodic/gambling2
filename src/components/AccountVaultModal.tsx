import React, { useState } from 'react';
import { PlayerAccountState } from '../game/rules';
import { soundEngine } from '../game/sound';

interface AccountVaultModalProps {
  account: PlayerAccountState;
  onClose: () => void;
  onRestoreAccount: (restored: PlayerAccountState) => void;
}

export const AccountVaultModal: React.FC<AccountVaultModalProps> = ({
  account,
  onClose,
  onRestoreAccount,
}) => {
  const [saveCodeInput, setSaveCodeInput] = useState<string>(account.saveCode || '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerateCloudSave = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: account.saveCode || undefined,
          state: account,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) {
        throw new Error(data.error || 'Failed to save account');
      }
      const updatedAccount: PlayerAccountState = {
        ...account,
        saveCode: data.code,
      };
      onRestoreAccount(updatedAccount);
      setSaveCodeInput(data.code);
      soundEngine.playWinChime(false);
      setStatusMsg(`Progress saved anonymously! Your Save Code is ${data.code}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromCode = async () => {
    const trimmed = saveCodeInput.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a valid Save Code (e.g. VLV-XXXXXX).');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/save/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.state) {
        throw new Error(data.error || 'Save code not found');
      }
      const loadedState: PlayerAccountState = {
        ...account,
        ...(data.state as PlayerAccountState),
        saveCode: data.code,
      };
      onRestoreAccount(loadedState);
      soundEngine.playWinChime(true);
      setStatusMsg(`Loaded account ${data.code} (${loadedState.chips.toLocaleString()} chips)!`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    soundEngine.playChipClick();
    const payload = JSON.stringify(account, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velvet-casino-save-${account.alias.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMsg('Downloaded JSON save file to your device.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed.chips !== 'number' || typeof parsed.cash !== 'number') {
          throw new Error('Invalid JSON save file format.');
        }
        onRestoreAccount({
          ...account,
          ...parsed,
        });
        soundEngine.playWinChime(true);
        setStatusMsg(`Restored account "${parsed.alias || 'Player'}" from JSON file!`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Anonymous Account Save Vault"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#0a1712] border border-emerald-500/35 shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#07110d] border-b border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-400">Zero-Login Anonymous Persistence</div>
            <h2 className="font-display text-xl font-bold text-white">
              SAVE &amp; RESTORE ACCOUNT (CODE OR JSON)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Account Save Modal"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-400/40 text-xs text-emerald-200 font-medium">
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950 border border-rose-500/40 text-xs text-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Option 1: Save & Restore via Anonymous Code */}
          <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-amber-300">
                  1. Anonymous Cloud Save Code
                </h3>
                <p className="text-xs text-slate-400">
                  Generate a unique code to save your chips, cash, debt, and luxury items on the server.
                </p>
              </div>
              {account.saveCode && (
                <span className="px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 font-mono-tabular text-xs font-extrabold text-amber-300">
                  Code: {account.saveCode}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerateCloudSave}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {loading
                ? 'Syncing...'
                : account.saveCode
                ? `Sync Progress to Code (${account.saveCode})`
                : 'Generate New Anonymous Save Code'}
            </button>

            <div className="pt-3 border-t border-emerald-500/15 space-y-2">
              <label htmlFor="restore-code-input" className="block text-xs font-semibold text-slate-300">
                Have an Existing Save Code? Enter to Restore:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="restore-code-input"
                  type="text"
                  value={saveCodeInput}
                  onChange={(e) => setSaveCodeInput(e.target.value.toUpperCase())}
                  placeholder="VLV-XXXXXX"
                  className="w-full rounded-xl bg-[#0c1d16] border border-emerald-500/30 px-3.5 py-2.5 font-mono-tabular text-sm font-bold text-white uppercase"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLoadFromCode}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  Load Code
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Portable JSON File Download & Upload */}
          <div className="rounded-2xl bg-[#07110d] border border-emerald-500/25 p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-emerald-300">
                2. Portable JSON File Backup
              </h3>
              <p className="text-xs text-slate-400">
                Download your complete account state as a `.json` file or upload a saved `.json` file anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                Download Save (.JSON)
              </button>

              <label className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/25 text-slate-200 font-bold text-xs text-center cursor-pointer">
                <span>Upload &amp; Restore (.JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
