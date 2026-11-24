
import { Plus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { getAccounts } from "../services/accountService";
import { getCategories } from "../services/categoryService";
import { getPaymentMethods } from "../services/paymentMethodService";
import { getCurrencyRate } from "../services/currencyRateService";

import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionRow from "../components/transactions/TransactionRow";
import TransactionSummary from "../components/transactions/TransactionSummary";
import TransactionForm from "../components/transactions/TransactionForm";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

import {
  getTransactions,
  createTransaction,
} from "../services/transactionService";

function Transactions() {
  const { user } = useAuth();
  const { preferences } = usePreferences();

  const displayCurrency = (
    preferences?.displayCurrency || "INR"
  ).trim().toUpperCase();

  const locale = preferences?.locale || "en-IN";
  const timeZone = preferences?.timeZone || "Asia/Kolkata";
  const dateFormat = preferences?.dateFormat || "DD/MM/YYYY";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [conversionRates, setConversionRates] = useState({});

  const [activeType, setActiveType] = useState("ALL");
  const [search, setSearch] = useState("");

  const accountMap = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [account.id, account])
      ),
    [accounts]
  );

  const categoryMap = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category.name])
      ),
    [categories]
  );

  const paymentMethodMap = useMemo(
    () =>
      Object.fromEntries(
        paymentMethods.map((method) => [method.id, method.name])
      ),
    [paymentMethods]
  );

  // Load transactions and supporting data
  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          transactionData,
          accountData,
          categoryData,
          paymentMethodData,
        ] = await Promise.all([
          getTransactions(),
          getAccounts(),
          getCategories(user.id),
          getPaymentMethods(user.id),
        ]);

        setTransactions(transactionData);
        setAccounts(accountData);
        setCategories(categoryData);
        setPaymentMethods(paymentMethodData);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Failed to load transaction data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // Enrich transactions with account, category and payment method names
  const enrichedTransactions = useMemo(() => {
    return transactions.map((transaction) => {
      const account = accountMap[transaction.accountId];

      return {
        ...transaction,

        account: account?.name || "Unknown account",

        category:
          categoryMap[transaction.categoryId] ||
          "Uncategorized",

        paymentMethod: transaction.paymentMethodId
          ? paymentMethodMap[transaction.paymentMethodId] || null
          : null,

        currency: (
          transaction.currency ||
          account?.currency ||
          "USD"
        ).trim().toUpperCase(),
      };
    });
  }, [
    transactions,
    accountMap,
    categoryMap,
    paymentMethodMap,
  ]);

  /*
   * Fetch USD-based reference rates for every transaction currency.
   * Conversion formula:
   * source -> display = USD -> display / USD -> source
   */
  useEffect(() => {
    let cancelled = false;

    async function loadConversionRates() {
      const currencies = [
        ...new Set([
          displayCurrency,
          ...enrichedTransactions.map((transaction) =>
            transaction.currency
          ),
        ]),
      ];

      if (currencies.length === 0) {
        setConversionRates({});
        return;
      }

      try {
        setRatesLoading(true);

        const results = await Promise.all(
          currencies.map(async (currency) => {
            try {
              const result = await getCurrencyRate(currency);

              return [
                currency,
                Number(result.exchangeRate),
              ];
            } catch (err) {
              console.error(
                `Could not fetch ${currency} exchange rate:`,
                err
              );

              return [currency, null];
            }
          })
        );

        if (cancelled) return;

        const usdRates = Object.fromEntries(results);
        const targetRate = usdRates[displayCurrency];

        const calculatedRates = {};

        currencies.forEach((currency) => {
          const sourceRate = usdRates[currency];

          if (currency === displayCurrency) {
            calculatedRates[currency] = 1;
          } else if (
            Number.isFinite(sourceRate) &&
            sourceRate > 0 &&
            Number.isFinite(targetRate) &&
            targetRate > 0
          ) {
            calculatedRates[currency] =
              targetRate / sourceRate;
          }
        });

        setConversionRates(calculatedRates);
      } catch (err) {
        console.error("Exchange rate loading failed:", err);

        if (!cancelled) {
          setConversionRates({});
        }
      } finally {
        if (!cancelled) {
          setRatesLoading(false);
        }
      }
    }

    loadConversionRates();

    return () => {
      cancelled = true;
    };
  }, [displayCurrency, enrichedTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return enrichedTransactions.filter((transaction) => {
      const matchesType =
        activeType === "ALL" ||
        transaction.type === activeType;

      const matchesSearch =
        !searchTerm ||
        (transaction.description || "Untitled Transaction")
          .toLowerCase()
          .includes(searchTerm) ||
        (transaction.category || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (transaction.account || "")
          .toLowerCase()
          .includes(searchTerm);

      return matchesType && matchesSearch;
    });
  }, [enrichedTransactions, activeType, search]);

  // Create a transaction using the authenticated JWT
  async function handleCreateTransaction(transaction) {
    try {
      setError("");

      const createdTransaction = await createTransaction(
        transaction
      );

      setTransactions((current) => [
        createdTransaction,
        ...current,
      ]);

      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to create transaction."
      );
    }
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
            Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track your income, expenses and investments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Transaction
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading transactions...
          </p>
        </div>
      ) : (
        <>
          {ratesLoading && (
            <p className="text-xs text-slate-500">
              Updating currency conversions...
            </p>
          )}

          {/* Summary */}
          <TransactionSummary
            transactions={enrichedTransactions}
            conversionRates={conversionRates}
            displayCurrency={displayCurrency}
            locale={locale}
          />

          {/* Filters */}
          <TransactionFilters
            activeType={activeType}
            setActiveType={setActiveType}
            search={search}
            setSearch={setSearch}
          />

          {/* Transaction List */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  All Transactions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredTransactions.length} transaction
                  {filteredTransactions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    conversionRates={conversionRates}
                    displayCurrency={displayCurrency}
                    locale={locale}
                    timeZone={timeZone}
                    dateFormat={dateFormat}
                  />
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <h3 className="font-semibold text-slate-900">
                  No transactions found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or transaction filter.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Add Transaction Modal */}
      {showForm && (
        <TransactionForm
          // userId={user.id}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTransaction}
        />
      )}
    </div>
  );
}

export default Transactions;
