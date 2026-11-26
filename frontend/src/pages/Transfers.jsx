import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  getAccounts,
} from "../services/accountService";

import {
  createTransfer,
  getTransfers
} from "../services/transferService";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { getCurrencyRate } from "../services/currencyRateService";

// const USER_ID = "9a522adc-d97e-4c63-a6d5-099f179d2319";

function formatCurrency(amount, currency = "USD", locale = "en-IN") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function formatDate(date, dateFormat = "DD/MM/YYYY") {
  if (!date) return "-";

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;

  const formats = {
    "DD/MM/YYYY": `${day}/${month}/${year}`,
    "MM/DD/YYYY": `${month}/${day}/${year}`,
    "YYYY-MM-DD": `${year}-${month}-${day}`,
    "DD-MM-YYYY": `${day}-${month}-${year}`,
    "MM-DD-YYYY": `${month}-${day}-${year}`,
  };

  return formats[dateFormat] || `${day}/${month}/${year}`;
}

function convertAmount(amount, sourceCurrency, displayCurrency, rates) {
  const source = (sourceCurrency || "USD").trim().toUpperCase();
  const target = (displayCurrency || "INR").trim().toUpperCase();

  if (source === target) return Number(amount || 0);

  const rate = rates[source];
  if (!Number.isFinite(rate)) return null;

  return Number(amount || 0) * rate;
}

function sumConverted(transfers, displayCurrency, rates) {
  let total = 0;

  for (const transfer of transfers) {
    const converted = convertAmount(
      transfer.amount,
      transfer.currency,
      displayCurrency,
      rates
    );

    if (converted === null) return null;
    total += converted;
  }

  return total;
}

function Transfers() {
  const { user } = useAuth();
  const { preferences } = usePreferences();

  const displayCurrency = (
    preferences?.displayCurrency || "INR"
  ).trim().toUpperCase();
  const locale = preferences?.locale || "en-IN";
  const dateFormat = preferences?.dateFormat || "DD/MM/YYYY";

  const [transfers, setTransfers] = useState([]);
  const [conversionRates, setConversionRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sourceAccountId: "",
    destinationAccountId: "",
    amount: "",
    currency: "",
    transferDate: new Date()
      .toISOString()
      .split("T")[0],
    notes: "",
  });

  async function loadData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [transferData, accountData] =
        await Promise.all([
          getTransfers(user.id),
          getAccounts(user.id),
        ]);

      setTransfers(transferData);
      setAccounts(accountData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load transfers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const activeAccounts = useMemo(() => {
    return accounts.filter(
      (account) => account.status === "ACTIVE"
    );
  }, [accounts]);

  const accountMap = useMemo(() => {
    return Object.fromEntries(
      accounts.map((account) => [
        account.id,
        account,
      ])
    );
  }, [accounts]);

  /*
   * Transfers are stored in the source/destination account currency.
   * The backend requires both accounts to use the same currency.
   * Convert only for display; never alter stored transfer values.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      const currencies = [
        ...new Set([
          displayCurrency,
          ...transfers.map((transfer) =>
            (transfer.currency || "USD").trim().toUpperCase()
          ),
        ]),
      ];

      try {
        setRatesLoading(true);

        const results = await Promise.all(
          currencies.map(async (currency) => {
            try {
              const result = await getCurrencyRate(currency);
              return [currency, Number(result.exchangeRate)];
            } catch (err) {
              console.error(`Could not fetch ${currency} rate:`, err);
              return [currency, null];
            }
          })
        );

        if (cancelled) return;

        const usdRates = Object.fromEntries(results);
        const targetRate = usdRates[displayCurrency];
        const nextRates = {};

        currencies.forEach((currency) => {
          const sourceRate = usdRates[currency];

          if (currency === displayCurrency) {
            nextRates[currency] = 1;
          } else if (
            Number.isFinite(sourceRate) &&
            sourceRate > 0 &&
            Number.isFinite(targetRate) &&
            targetRate > 0
          ) {
            nextRates[currency] = targetRate / sourceRate;
          }
        });

        setConversionRates(nextRates);
      } catch (err) {
        console.error("Failed to load transfer exchange rates:", err);
        if (!cancelled) setConversionRates({});
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, [transfers, displayCurrency]);

  const totalTransferred = useMemo(
    () => sumConverted(transfers, displayCurrency, conversionRates),
    [transfers, displayCurrency, conversionRates]
  );

  const currentMonthTransfers = useMemo(() => {
    const now = new Date();

    return transfers.filter((transfer) => {
      const date = new Date(
        `${transfer.transferDate}T00:00:00`
      );

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [transfers]);

  const currentMonthTotal = useMemo(
    () =>
      sumConverted(
        currentMonthTransfers,
        displayCurrency,
        conversionRates
      ),
    [currentMonthTransfers, displayCurrency, conversionRates]
  );

  function openCreateModal() {
    setForm({
      sourceAccountId: "",
      destinationAccountId: "",
      amount: "",
      currency: "",
      transferDate: new Date()
        .toISOString()
        .split("T")[0],
      notes: "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "sourceAccountId") {
      const selectedSource = accountMap[value];
      const sourceCurrency = selectedSource?.currency?.trim().toUpperCase() || "USD";

      setForm((current) => ({
        ...current,
        sourceAccountId: value,
        currency: sourceCurrency,
        destinationAccountId:
          current.destinationAccountId &&
          accountMap[current.destinationAccountId]?.currency?.trim().toUpperCase() !== sourceCurrency
            ? ""
            : current.destinationAccountId,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.sourceAccountId ||
      !form.destinationAccountId
    ) {
      setError(
        "Please select both source and destination accounts."
      );
      return;
    }

    if (
      form.sourceAccountId ===
      form.destinationAccountId
    ) {
      setError(
        "Source and destination accounts must be different."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Transfer amount must be greater than zero."
      );
      return;
    }

    const sourceAccount = accountMap[form.sourceAccountId];
    const destinationAccount = accountMap[form.destinationAccountId];

    const sourceCurrency = sourceAccount?.currency?.trim().toUpperCase();
    const destinationCurrency = destinationAccount?.currency?.trim().toUpperCase();

    if (!sourceCurrency || sourceCurrency !== destinationCurrency) {
      setError("Source and destination accounts must use the same currency.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await createTransfer({
        sourceAccountId: form.sourceAccountId,
        destinationAccountId: form.destinationAccountId,
        amount: Number(form.amount),
        currency: sourceCurrency,
        transferDate: form.transferDate,
        notes: form.notes || null,
      });

      setTransfers((current) => [
        response.data,
        ...current,
      ]);

      setShowModal(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to create transfer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Money movement
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Transfers
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Move money between your FinanceFlow accounts
            without treating it as income or an expense.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            New Transfer
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {ratesLoading && (
        <p className="text-xs text-slate-500">
          Updating currency conversions...
        </p>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Transfers
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <ArrowLeftRight className="h-4 w-4 text-slate-600" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-semibold text-slate-900">
            {transfers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              This Month
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Wallet className="h-4 w-4 text-slate-600" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-semibold text-slate-900">
            {currentMonthTotal === null
              ? "Rates unavailable"
              : formatCurrency(currentMonthTotal, displayCurrency, locale)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {currentMonthTransfers.length} transfers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Moved
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <ArrowRight className="h-4 w-4 text-slate-600" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-semibold text-slate-900">
            {totalTransferred === null
              ? "Rates unavailable"
              : formatCurrency(totalTransferred, displayCurrency, locale)}
          </p>
        </div>

      </div>

      {/* Transfer list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transfers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest account-to-account movements.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <ArrowLeftRight className="h-5 w-5 text-slate-500" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No transfers yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Move money between your accounts by
              creating your first transfer.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New Transfer
            </button>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {transfers
              .slice()
              .sort(
                (a, b) =>
                  new Date(
                    `${b.transferDate}T00:00:00`
                  ) -
                  new Date(
                    `${a.transferDate}T00:00:00`
                  )
              )
              .map((transfer) => {

                const source =
                  accountMap[
                    transfer.sourceAccountId
                  ];

                const destination =
                  accountMap[
                    transfer.destinationAccountId
                  ];

                return (
                  <div
                    key={transfer.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <ArrowLeftRight className="h-5 w-5 text-slate-600" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-medium text-slate-900">
                            {source?.name ||
                              "Unknown Account"}
                          </span>

                          <ArrowRight className="h-4 w-4 text-slate-400" />

                          <span className="font-medium text-slate-900">
                            {destination?.name ||
                              "Unknown Account"}
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(
                            transfer.transferDate
                          )}
                        </p>

                        {transfer.notes && (
                          <p className="mt-1 text-xs text-slate-400">
                            {transfer.notes}
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="sm:text-right">
                      <p className="font-semibold text-slate-900">
                        {(() => {
                          const originalCurrency = (
                            transfer.currency || "USD"
                          ).trim().toUpperCase();

                          const converted = convertAmount(
                            transfer.amount,
                            originalCurrency,
                            displayCurrency,
                            conversionRates
                          );

                          return converted === null
                            ? formatCurrency(
                                transfer.amount,
                                originalCurrency,
                                locale
                              )
                            : formatCurrency(
                                converted,
                                displayCurrency,
                                locale
                              );
                        })()}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {(() => {
                          const originalCurrency = (
                            transfer.currency || "USD"
                          ).trim().toUpperCase();

                          if (originalCurrency === displayCurrency) {
                            return "Internal transfer";
                          }

                          return conversionRates[originalCurrency] !== undefined
                            ? `Internal transfer · ${originalCurrency} converted`
                            : `Internal transfer · Original ${originalCurrency}`;
                        })()}
                      </p>
                    </div>

                  </div>
                );
              })}

          </div>
        )}

      </div>

      {/* Create transfer modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">

          <div className="flex min-h-full items-center justify-center">

            <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    New Transfer
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Move money between two accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>

              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
              >

                {/* Source */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    From Account
                  </label>

                  <select
                    name="sourceAccountId"
                    value={form.sourceAccountId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">
                      Select source account
                    </option>

                    {activeAccounts.map(
                      (account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.name} —{" "}
                          {account.currency}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Destination */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    To Account
                  </label>

                  <select
                    name="destinationAccountId"
                    value={form.destinationAccountId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">
                      Select destination account
                    </option>

                    {activeAccounts
                      .filter(
                        (account) =>
                          account.id !== form.sourceAccountId &&
                          (!form.currency ||
                            account.currency?.trim().toUpperCase() ===
                              form.currency.trim().toUpperCase())
                      )
                      .map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.name} —{" "}
                          {account.currency}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Currency is determined by the selected accounts */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Transfer Currency
                  </label>

                  <div className="input flex items-center bg-slate-50 text-slate-600">
                    {form.currency || "Select a source account first"}
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Transfers use the same currency as both selected accounts.
                  </p>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Transfer Date
                  </label>

                  <input
                    type="date"
                    name="transferDate"
                    value={form.transferDate}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className="input min-h-[90px] resize-none"
                    placeholder="Optional notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    )}

                    {saving
                      ? "Creating..."
                      : "Create Transfer"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Transfers;