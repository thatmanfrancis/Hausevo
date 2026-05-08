"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string | null;
  metadata: unknown;
  createdAt: Date;
};

type BankAccount = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
};

type Props = {
  user: { walletBalance: number; verificationBundlePaid: boolean };
  transactions: Transaction[];
  bankAccounts: BankAccount[];
};

// ── Nigerian banks list ────────────────────────────────────────────────────

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskAccount(n: string) {
  return "****" + n.slice(-4);
}

const TYPE_STYLES: Record<string, string> = {
  RENT: "bg-blue-50 text-blue-700",
  SERVICE: "bg-zinc-100 text-zinc-600",
  VERIFICATION: "bg-emerald-50 text-emerald-700",
  REFUND: "bg-amber-50 text-amber-700",
  DEPOSIT: "bg-purple-50 text-purple-700",
  MOVE: "bg-sky-50 text-sky-700",
  REWARD: "bg-amber-50 text-amber-700",
  REPAIR: "bg-orange-50 text-orange-700",
  COMMISSION: "bg-zinc-100 text-zinc-600",
  BOND_CONTRIBUTION: "bg-indigo-50 text-indigo-700",
  CAUTION_DEPOSIT: "bg-purple-50 text-purple-700",
  MORTGAGE_REPAYMENT: "bg-blue-50 text-blue-700",
  MANAGEMENT_FEE: "bg-zinc-100 text-zinc-600",
  MILESTONE_PAYMENT: "bg-teal-50 text-teal-700",
  LEASE_PAYMENT: "bg-blue-50 text-blue-700",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  ESCROW: "bg-amber-50 text-amber-700",
  LOCKED: "bg-zinc-100 text-zinc-500",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

// ── Main component ─────────────────────────────────────────────────────────

export default function WalletClient({
  user,
  transactions,
  bankAccounts: initialAccounts,
}: Props) {
  const [balance, setBalance] = useState(user.walletBalance);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState("");

  // Bank accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Withdrawal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccountId, setWithdrawAccountId] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode);

  // Auto-resolve account name when both bank and 10-digit number are set
  async function resolveAccountName(number: string, code: string) {
    if (number.length !== 10 || !code) return;
    setResolving(true);
    setResolveError("");
    setAccountName("");

    try {
      const res = await fetch(
        `/api/bank-accounts/resolve?account_number=${number}&bank_code=${code}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setResolveError(
          data.error ?? "Could not verify account. Check the details.",
        );
        return;
      }

      setAccountName(data.accountName);
    } catch {
      setResolveError("Network error. Please try again.");
    } finally {
      setResolving(false);
    }
  }

  function handleAccountNumberChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(digits);
    setAccountName("");
    setResolveError("");
    if (digits.length === 10 && bankCode) {
      resolveAccountName(digits, bankCode);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || !withdrawAccountId) return;

    setWithdrawLoading(true);
    setWithdrawError("");

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, bankAccountId: withdrawAccountId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWithdrawError(data.error ?? "Withdrawal failed.");
        return;
      }

      setBalance(data.newBalance);
      setShowWithdraw(false);
      setWithdrawAmount("");
      // Refresh transactions would be better, but we can just update balance for now
      window.location.reload();
    } catch {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  }

  async function handleBankChange(code: string) {
    setBankCode(code);
    setAccountName("");
    setResolveError("");
    if (accountNumber.length === 10 && code) {
      resolveAccountName(accountNumber, code);
    }
  }

  async function handleTopUp() {
    setTopUpLoading(true);
    setTopUpMsg("");
    try {
      const res = await fetch("/api/dev/topup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.newBalance);
        setTopUpMsg(
          `₦5,000 added! New balance: ${formatNaira(data.newBalance)}`,
        );
      } else {
        setTopUpMsg(data.error ?? "Top-up failed.");
      }
    } catch {
      setTopUpMsg("Network error.");
    } finally {
      setTopUpLoading(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank || !accountNumber || !accountName) return;
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber,
          accountName,
          isDefault: isDefault || accounts.length === 0,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error ?? "Failed to add account. Please try again.");
        return;
      }

      // If new account is default, clear existing defaults
      setAccounts((prev) => {
        const updated =
          isDefault || prev.length === 0
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : prev;
        return [...updated, data.account];
      });

      setShowAddForm(false);
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
      setResolveError("");
      setIsDefault(false);
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id })),
        );
      }
    } catch {
      // Silent fail
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Silent fail
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Finance
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Available Balance
        </p>
        <p className="text-4xl font-extrabold text-zinc-900 mb-5">
          {formatNaira(balance)}
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Withdraw funds
          </button>
          <button
            type="button"
            onClick={handleTopUp}
            disabled={topUpLoading}
            className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors disabled:opacity-50"
          >
            {topUpLoading ? "Adding…" : "Top up ₦5,000 (dev)"}
          </button>
        </div>

        {topUpMsg && (
          <div
            className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
              topUpMsg.includes("added")
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-700"
            }`}
          >
            {topUpMsg}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWithdraw(false)}
          />
          <form
            onSubmit={handleWithdraw}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-5"
          >
            <div>
              <p className="text-lg font-extrabold text-zinc-900">
                Withdraw Funds
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Transfer money from your Shack wallet to your bank.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Amount (₦)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                required
                max={balance}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
              <p className="text-[10px] text-zinc-400">
                Max available: {formatNaira(balance)}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Destination Account
              </label>
              <select
                value={withdrawAccountId}
                onChange={(e) => setWithdrawAccountId(e.target.value)}
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select an account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} - {a.accountNumber} ({a.accountName})
                  </option>
                ))}
              </select>
              {accounts.length === 0 && (
                <p className="text-[10px] text-red-500">
                  You must link a bank account first.
                </p>
              )}
            </div>

            {withdrawError && (
              <p className="text-xs font-bold text-red-600">{withdrawError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={
                  withdrawLoading || !withdrawAmount || !withdrawAccountId
                }
                className="flex-1 rounded-full bg-zinc-900 text-white py-3 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {withdrawLoading ? "Processing…" : "Confirm Withdrawal"}
              </button>
              <button
                type="button"
                onClick={() => setShowWithdraw(false)}
                className="flex-1 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank accounts */}
      <div
        className="bg-white rounded-2xl border border-zinc-200 p-6"
        id="bank-accounts"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Bank Accounts
          </p>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors"
            >
              + Add account
            </button>
          )}
        </div>

        {/* Add account form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAccount}
            className="flex flex-col gap-4 mb-5 pb-5 border-b border-zinc-100"
          >
            <p className="text-sm font-bold text-zinc-900">Add bank account</p>

            {/* Bank selector */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bank"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Bank
              </label>
              <select
                id="bank"
                value={bankCode}
                onChange={(e) => handleBankChange(e.target.value)}
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select a bank…</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account number */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="accountNumber"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="0123456789"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors font-mono tracking-widest"
              />
            </div>

            {/* Account name — auto-resolved */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Account Name
              </label>
              <div
                className={`rounded-xl border px-4 py-3 text-sm min-h-[48px] flex items-center gap-2 transition-colors ${
                  accountName
                    ? "border-emerald-200 bg-emerald-50"
                    : resolveError
                      ? "border-red-200 bg-red-50"
                      : "border-zinc-200 bg-zinc-50"
                }`}
              >
                {resolving ? (
                  <>
                    <svg
                      className="animate-spin shrink-0"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-zinc-400 text-sm">
                      Looking up account…
                    </span>
                  </>
                ) : accountName ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-600 shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="font-bold text-emerald-800">
                      {accountName}
                    </span>
                  </>
                ) : resolveError ? (
                  <span className="text-red-600 text-sm">{resolveError}</span>
                ) : (
                  <span className="text-zinc-400 text-sm">
                    {accountNumber.length === 10 && bankCode
                      ? "Verifying…"
                      : "Enter account number to auto-fill"}
                  </span>
                )}
              </div>
            </div>

            {/* Set as default */}
            {accounts.length > 0 && (
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsDefault((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${isDefault ? "bg-zinc-900" : "bg-zinc-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isDefault ? "translate-x-6" : "translate-x-1"}`}
                  />
                </div>
                <span className="text-sm font-semibold text-zinc-700">
                  Set as default account
                </span>
              </label>
            )}

            {addError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {addError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={
                  addLoading ||
                  !bankCode ||
                  accountNumber.length < 10 ||
                  !accountName.trim()
                }
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addLoading ? "Saving…" : "Save account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddError("");
                  setBankCode("");
                  setAccountNumber("");
                  setAccountName("");
                  setResolveError("");
                }}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Accounts list */}
        {accounts.length === 0 && !showAddForm ? (
          <p className="text-sm text-zinc-500">No bank accounts linked yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-zinc-500"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-zinc-900">
                        {account.bankName}
                      </p>
                      {account.isDefault && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                          Default
                        </span>
                      )}
                      {account.isVerified && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {maskAccount(account.accountNumber)} ·{" "}
                      {account.accountName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!account.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(account.id)}
                      disabled={settingDefaultId === account.id}
                      className="rounded-full border border-zinc-200 text-zinc-600 px-3 py-1.5 text-xs font-bold hover:border-zinc-400 transition-colors disabled:opacity-50"
                    >
                      {settingDefaultId === account.id ? "…" : "Set default"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(account.id)}
                    disabled={removingId === account.id}
                    className="rounded-full border border-zinc-200 text-red-500 px-3 py-1.5 text-xs font-bold hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {removingId === account.id ? "…" : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {!user.verificationBundlePaid && (
            <Link
              href="/tenant/verification"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Upgrade to Tier 1
            </Link>
          )}
          <Link
            href="/properties"
            className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            View properties
          </Link>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Transaction History
        </p>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {transactions.map((tx) => {
              const isCredit = tx.type === "REFUND" || tx.type === "REWARD";
              const typeCls =
                TYPE_STYLES[tx.type] ?? "bg-zinc-100 text-zinc-600";
              const typeLabel = tx.type
                .split("_")
                .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                .join(" ");
              const statusCls =
                STATUS_STYLES[tx.status] ?? "bg-zinc-100 text-zinc-600";
              const statusLabel =
                tx.status.charAt(0) + tx.status.slice(1).toLowerCase();

              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${typeCls}`}
                    >
                      {typeLabel}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">
                        {tx.description ?? tx.reference}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold ${isCredit ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(Math.abs(tx.amount))}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusCls}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
