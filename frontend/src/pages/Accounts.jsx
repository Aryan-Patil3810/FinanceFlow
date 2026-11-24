
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import AccountCard from "../components/accounts/AccountCard";
import AccountForm from "../components/accounts/AccountForm";
import AccountSummary from "../components/accounts/AccountSummary";

import {
  getAccounts,
  createAccount,
  archiveAccount,
  updateAccount,
} from "../services/accountService";

import { getCurrencyRate } from "../services/currencyRateService";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

function Accounts() {
  const { user } = useAuth();
  const { preferences } = usePreferences();

  const selectedCurrency = (
    preferences?.displayCurrency || "USD"
  ).trim().toUpperCase();

  const locale = preferences?.locale || "en-IN";

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencyError, setCurrencyError] = useState("");

  // Conversion rate for each account currency into display currency.
  const [conversionRates, setConversionRates] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState(selectedCurrency);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [accountView, setAccountView] = useState("ACTIVE");
  const [editingAccount, setEditingAccount] = useState(null);

  // Load accounts.
  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      if (!user?.id) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getAccounts(user.id);

        if (!cancelled) {
          setAccounts(data);
        }
      } catch (err) {
        console.error("Unable to load accounts:", err);

        if (!cancelled) {
          setError("Unable to load accounts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Load exchange rates for all account currencies.
  useEffect(() => {
    let cancelled = false;

    async function loadExchangeRates() {
      setCurrencyError("");
      setConversionRates(null);

      const currencies = [
        ...new Set(
          [
            ...accounts.map((account) =>
              account.currency?.trim().toUpperCase()
            ),
            selectedCurrency,
            "USD",
          ].filter(Boolean)
        ),
      ];

      try {
        // The currency rate API uses USD as its base currency.
        const rateEntries = await Promise.all(
          currencies.map(async (currency) => {
            if (currency === "USD") {
              return [currency, 1];
            }

            const response = await getCurrencyRate(currency);

            return [
              currency,
              Number(response.exchangeRate),
            ];
          })
        );

        if (cancelled) return;

        const usdRates = Object.fromEntries(rateEntries);

        const targetRate = usdRates[selectedCurrency];

        if (
          !Number.isFinite(targetRate) ||
          targetRate <= 0
        ) {
          throw new Error("Invalid target currency rate.");
        }

        const rates = {};

        currencies.forEach((sourceCurrency) => {
          const sourceRate = usdRates[sourceCurrency];

          if (
            !Number.isFinite(sourceRate) ||
            sourceRate <= 0
          ) {
            throw new Error(
              `Invalid exchange rate for ${sourceCurrency}`
            );
          }

          // Convert source currency into the selected display currency.
          rates[sourceCurrency] = targetRate / sourceRate;
        });

        setConversionRates(rates);
        setDisplayCurrency(selectedCurrency);
      } catch (err) {
        console.error("Currency conversion error:", err);

        if (cancelled) return;

        setConversionRates({});
        setDisplayCurrency(selectedCurrency);

        setCurrencyError(
          "Exchange rates unavailable. Account balances are displayed in their original currencies."
        );
      }
    }

    loadExchangeRates();

    return () => {
      cancelled = true;
    };
  }, [accounts, selectedCurrency]);

  async function handleCreateAccount(account) {
    try {
      setError("");

      const createdAccount = await createAccount(
        user.id,
        account
      );

      setAccounts((current) => [
        ...current,
        createdAccount,
      ]);

      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to create account."
      );
    }
  }

  async function handleUpdateAccount(account) {
    try {
      setError("");

      const updatedAccount = await updateAccount(
        user.id,
        editingAccount.id,
        account
      );

      setAccounts((current) =>
        current.map((item) =>
          item.id === updatedAccount.id
            ? updatedAccount
            : item
        )
      );

      setEditingAccount(null);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update account."
      );
    }
  }

  async function handleArchiveAccount(id) {
    try {
      setError("");

      const archivedAccount = await archiveAccount(
        user.id,
        id
      );

      setAccounts((current) =>
        current.map((account) =>
          account.id === id
            ? archivedAccount
            : account
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to archive account."
      );
    }
  }

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      account.status === accountView
  );

  const activeCount = accounts.filter(
    (account) => account.status === "ACTIVE"
  ).length;

  const archivedCount = accounts.filter(
    (account) => account.status === "ARCHIVED"
  ).length;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[400px] max-w-[1600px] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading accounts...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Money
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Accounts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your bank accounts, cards and investments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Account
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {currencyError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {currencyError}
        </div>
      )}

      {/* Summary */}
      <AccountSummary
        accounts={accounts}
        conversionRates={conversionRates}
        displayCurrency={displayCurrency}
        locale={locale}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setAccountView("ACTIVE")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              accountView === "ACTIVE"
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setAccountView("ARCHIVED")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              accountView === "ARCHIVED"
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search accounts..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      {/* Accounts */}
      {filteredAccounts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              conversionRates={conversionRates}
              displayCurrency={displayCurrency}
              locale={locale}
              onArchive={handleArchiveAccount}
              onEdit={setEditingAccount}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="font-semibold text-slate-900">
            No {accountView.toLowerCase()} accounts found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {accountView === "ACTIVE"
              ? "Create an account to start tracking your finances."
              : "Archived accounts will appear here."}
          </p>
        </div>
      )}

      {/* Add Account Modal */}
      {showForm && (
        <AccountForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateAccount}
        />
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <AccountForm
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={handleUpdateAccount}
        />
      )}
    </div>
  );
}

export default Accounts;
