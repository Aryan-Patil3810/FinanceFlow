
import { useState } from "react";
import { X } from "lucide-react";

const initialForm = {
  name: "",
  accountType: "CHECKING",
  currency: "USD",
  openingBalance: "",
  openingBalanceDate: new Date()
    .toISOString()
    .split("T")[0],
};

function AccountForm({ onClose, onSubmit, account }) {
  const [form, setForm] = useState(
    account
      ? {
          name: account.name,
          accountType: account.accountType,
          currency: account.currency?.trim() || "USD",
          openingBalance: account.openingBalance,
          openingBalanceDate: account.openingBalanceDate,
        }
      : initialForm
  );

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Account name is required.");
      return;
    }

    if (!form.currency) {
      setError("Please select an account currency.");
      return;
    }

    if (form.openingBalance === "") {
      setError("Opening balance is required.");
      return;
    }

    if (
      !Number.isFinite(Number(form.openingBalance)) ||
      Number(form.openingBalance) < 0
    ) {
      setError("Please enter a valid opening balance.");
      return;
    }

    if (!form.openingBalanceDate) {
      setError("Opening balance date is required.");
      return;
    }

    onSubmit({
      ...form,
      name: form.name.trim(),
      currency: form.currency.trim().toUpperCase(),
      openingBalance: Number(form.openingBalance),
      status: "ACTIVE",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {account ? "Edit Account" : "Add Account"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {account
                ? "Update your account information."
                : "Add a bank, card, cash or investment account."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {/* Account name */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Account name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Chase Checking"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {/* Account type and currency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Account type
              </label>

              <select
                name="accountType"
                value={form.accountType}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="BROKERAGE">Brokerage</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Account currency
              </label>

              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={Boolean(account)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>

              {account && (
                <p className="mt-1 text-xs text-slate-500">
                  Account currency cannot be changed after creation.
                </p>
              )}
            </div>
          </div>

          {/* Opening balance */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Opening balance ({form.currency})
            </label>

            <input
              type="number"
              name="openingBalance"
              value={form.openingBalance}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Enter the balance in this account's original currency.
            </p>
          </div>

          {/* Opening balance date */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Opening balance date
            </label>

            <input
              type="date"
              name="openingBalanceDate"
              value={form.openingBalanceDate}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {account ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccountForm;
