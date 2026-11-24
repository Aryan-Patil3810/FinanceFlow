import {
  CalendarDays,
  Check,
  SkipForward,
  CreditCard,
  Edit3,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getPaymentOccurrences,
  generateUpcomingOccurrences,
  markPaymentOccurrenceAsPaid,
  skipPaymentOccurrence,
} from "../services/paymentOccurenceService";

import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  updateRecurringPaymentStatus,
} from "../services/recurringPaymentService";

import { getAccounts } from "../services/accountService";
import { getCategories } from "../services/categoryService";
import { getPaymentMethods } from "../services/paymentMethodService";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { getCurrencyRate } from "../services/currencyRateService";

// const USER_ID = "9a522adc-d97e-4c63-a6d5-099f179d2319";

const FREQUENCIES = [
  {
    value: "WEEKLY",
    label: "Weekly",
  },
  {
    value: "BIWEEKLY",
    label: "Biweekly",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
  },
  {
    value: "QUARTERLY",
    label: "Quarterly",
  },
  {
    value: "YEARLY",
    label: "Yearly",
  },
];

const STATUS_FILTERS = [
  "ALL",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

function formatCurrency(amount, currency, rates, displayCurrency, locale) {
  const source = String(currency || "USD").trim().toUpperCase();
  const target = String(displayCurrency || "USD").trim().toUpperCase();
  const rate = rates?.[source];

  // Never display the target-currency symbol unless a valid conversion rate exists.
  const canConvert = source === target || (Number.isFinite(rate) && rate > 0);
  const finalCurrency = canConvert ? target : source;
  const convertedAmount = Number(amount || 0) * (
    source === target ? 1 : canConvert ? rate : 1
  );

  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: finalCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
}

function formatPreferredDate(value, locale, timeZone) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale || "en-US", {
    timeZone: timeZone || "UTC", month: "short", day: "numeric", year: "numeric",
  });
}

function getMonthlyAmount(payment) {
  const amount = Number(payment.amount || 0);
  switch (payment.frequency) {
    case "WEEKLY": return amount * 52 / 12;
    case "BIWEEKLY": return amount * 26 / 12;
    case "MONTHLY": return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY": return amount / 12;
    default: return 0;
  }
}

function RecurringPayments() {
  const { preferences } = usePreferences();
  const displayCurrency = preferences?.displayCurrency || "USD";
  const locale = preferences?.locale || "en-US";
  const timeZone = preferences?.timeZone || "UTC";
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [conversionRates, setConversionRates] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
const [occurrencesLoading, setOccurrencesLoading] = useState(false);
const [occurrencesError, setOccurrencesError] = useState("");
const [generatingOccurrences, setGeneratingOccurrences] = useState(false);

const [payingOccurrence, setPayingOccurrence] = useState(null);
const [actualAmount, setActualAmount] = useState("");

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [frequencyFilter, setFrequencyFilter] =
    useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    currency: "USD",
    categoryId: "",
    accountId: "",
    paymentMethodId: "",
    frequency: "MONTHLY",
    startDate: new Date()
      .toISOString()
      .split("T")[0],
    endDate: "",
    status: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
  loadOccurrences();
}, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      const target = String(displayCurrency || "USD").trim().toUpperCase();
      const currencies = [...new Set([
        ...payments.map((payment) => payment.currency),
        ...occurrences.map((occurrence) => occurrence.currency),
        target,
      ].filter(Boolean).map((currency) => String(currency).trim().toUpperCase()))];

      const usdRates = { USD: 1 };
      const results = await Promise.allSettled(
        currencies
          .filter((currency) => currency !== "USD")
          .map(async (currency) => {
            const response = await getCurrencyRate(currency);
            const rate = Number(response?.exchangeRate);
            if (!Number.isFinite(rate) || rate <= 0) {
              throw new Error(`Invalid USD/${currency} exchange rate`);
            }
            usdRates[currency] = rate;
          })
      );

      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Unable to load an exchange rate:", result.reason);
        }
      });

      // A missing target rate must not silently become 1; that would only
      // change the symbol without converting the amount.
      const targetRate = target === "USD" ? 1 : usdRates[target];
      const rates = {};

      if (Number.isFinite(targetRate) && targetRate > 0) {
        currencies.forEach((currency) => {
          const sourceUsdRate = usdRates[currency];
          if (Number.isFinite(sourceUsdRate) && sourceUsdRate > 0) {
            rates[currency] = targetRate / sourceUsdRate;
          }
        });
      }

      if (!cancelled) setConversionRates(rates);
    }

    if (payments.length || occurrences.length) {
      loadRates().catch((error) => {
        console.error("Unable to load recurring payment exchange rates:", error);
        if (!cancelled) setConversionRates({});
      });
    }

    return () => {
      cancelled = true;
    };
  }, [payments, occurrences, displayCurrency]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        paymentData,
        accountData,
        categoryData,
        paymentMethodData,
      ] = await Promise.all([
        getRecurringPayments(user.id),
        getAccounts(user.id),
        getCategories(user.id),
        getPaymentMethods(user.id),
      ]);

      setPayments(paymentData);
      setAccounts(accountData);
      setCategories(categoryData);
      setPaymentMethods(paymentMethodData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load recurring payments."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      amount: "",
      currency: "USD",
      categoryId: "",
      accountId: "",
      paymentMethodId: "",
      frequency: "MONTHLY",
      startDate: new Date()
        .toISOString()
        .split("T")[0],
      endDate: "",
      status: "ACTIVE",
      notes: "",
    });
  }

  function openCreateForm() {
    setEditingPayment(null);
    resetForm();
    setError("");
    setShowForm(true);
  }

  function openEditForm(payment) {
    setEditingPayment(payment);

    setForm({
      name: payment.name || "",
      amount: payment.amount || "",
      currency: payment.currency || "USD",
      categoryId: payment.categoryId || "",
      accountId: payment.accountId || "",
      paymentMethodId:
        payment.paymentMethodId || "",
      frequency:
        payment.frequency || "MONTHLY",
      startDate: payment.startDate || "",
      endDate: payment.endDate || "",
      status: payment.status || "ACTIVE",
      notes: payment.notes || "",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingPayment(null);
    resetForm();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Payment name is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }

    if (
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        categoryId:
          form.categoryId || null,
        accountId:
          form.accountId || null,
        paymentMethodId:
          form.paymentMethodId || null,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: editingPayment
          ? form.status
          : "ACTIVE",
        notes: form.notes.trim() || null,
      };

      if (editingPayment) {
        const updatedPayment =
          await updateRecurringPayment(
            user.id,
            editingPayment.id,
            payload
          );

        setPayments((current) =>
          current.map((payment) =>
            payment.id === updatedPayment.id
              ? updatedPayment
              : payment
          )
        );
      } else {
        const createdPayment =
          await createRecurringPayment(
            user.id,
            payload
          );

        setPayments((current) => [
          ...current,
          createdPayment,
        ]);
      }

      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save recurring payment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateOccurrences() {
  try {
    setGeneratingOccurrences(true);
    setOccurrencesError("");

    await generateUpcomingOccurrences(user.id, 30);

    await loadOccurrences();
  } catch (error) {
    console.error(
      "Failed to generate payment occurrences:",
      error
    );

    setOccurrencesError(
      error.response?.data?.message ||
      "Failed to generate upcoming payments."
    );
  } finally {
    setGeneratingOccurrences(false);
  }
}
function openMarkPaidModal(occurrence) {
  setPayingOccurrence(occurrence);
  setActualAmount(
    Number(occurrence.expectedAmount || 0).toFixed(2)
  );
}

async function handleMarkPaid() {
  if (!payingOccurrence) {
    return;
  }

  try {
    await markPaymentOccurrenceAsPaid(
      user.id,
      payingOccurrence.id,
      actualAmount
    );

    setPayingOccurrence(null);
    setActualAmount("");

    await loadOccurrences();
  } catch (error) {
    console.error(
      "Failed to mark payment as paid:",
      error
    );

    setOccurrencesError(
      error.response?.data?.message ||
      "Failed to mark payment as paid."
    );
  }
}

async function handleSkipOccurrence(occurrenceId) {
  try {
    await skipPaymentOccurrence(
      user.id,
      occurrenceId
    );

    await loadOccurrences();
  } catch (error) {
    console.error(
      "Failed to skip payment occurrence:",
      error
    );

    setOccurrencesError(
      error.response?.data?.message ||
      "Failed to skip payment."
    );
  }
}
  async function changeStatus(payment, status) {
    try {
      setError("");

      const updatedPayment =
        await updateRecurringPaymentStatus(
          user.id,
          payment.id,
          status
        );

      setPayments((current) =>
        current.map((item) =>
          item.id === updatedPayment.id
            ? updatedPayment
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update payment status."
      );
    }
  }

  async function loadOccurrences() {
  try {
    setOccurrencesLoading(true);
    setOccurrencesError("");

    const data = await getPaymentOccurrences(user.id);

    setOccurrences(data);
  } catch (error) {
    console.error("Failed to load payment occurrences:", error);

    setOccurrencesError(
      error.response?.data?.message ||
      "Failed to load upcoming payments."
    );
  } finally {
    setOccurrencesLoading(false);
  }
}

  const accountMap = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [
          account.id,
          account.name,
        ])
      ),
    [accounts]
  );

  const categoryMap = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          category.name,
        ])
      ),
    [categories]
  );

  const paymentMethodMap = useMemo(
    () =>
      Object.fromEntries(
        paymentMethods.map((method) => [
          method.id,
          method.name,
        ])
      ),
    [paymentMethods]
  );

  const filteredPayments = useMemo(() => {
    const searchTerm =
      search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !searchTerm ||
        payment.name
          .toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const matchesFrequency =
        frequencyFilter === "ALL" ||
        payment.frequency === frequencyFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFrequency
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    frequencyFilter,
  ]);

  const stats = useMemo(() => {
    const activePayments = payments.filter((p) => p.status === "ACTIVE");
    const targetCurrency = String(displayCurrency || "USD").trim().toUpperCase();
    const monthlyAmounts = activePayments.map((payment) => {
      const currency = String(payment.currency || "USD").trim().toUpperCase();
      const rate = conversionRates[currency];
      if (currency !== targetCurrency && !(Number.isFinite(rate) && rate > 0)) return null;
      return getMonthlyAmount(payment) * (currency === targetCurrency ? 1 : rate);
    });
    return {
      total: payments.length,
      active: activePayments.length,
      paused: payments.filter((p) => p.status === "PAUSED").length,
      monthlyEquivalent: monthlyAmounts.some((v) => v === null)
        ? null
        : monthlyAmounts.reduce((sum, value) => sum + value, 0),
    };
  }, [payments, conversionRates, displayCurrency]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Planning
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Recurring Payments
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Manage subscriptions, bills, and recurring
            financial commitments.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Recurring Payment
        </button>
      </div>

      {/* Error */}
      {error && !showForm && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-rose-100"
          >
            <X size={16} />
          </button>
        </div>
      )}


      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-slate-700" />

        <h2 className="text-lg font-semibold text-slate-900">
          Upcoming Payments
        </h2>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Track scheduled payments and mark them when completed.
      </p>
    </div>

    <button
      type="button"
      onClick={handleGenerateOccurrences}
      disabled={generatingOccurrences}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw
        className={`h-4 w-4 ${
          generatingOccurrences ? "animate-spin" : ""
        }`}
      />

      {generatingOccurrences
        ? "Generating..."
        : "Generate Next 30 Days"}
    </button>
  </div>

  {occurrencesError && (
    <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {occurrencesError}
    </div>
  )}

  {occurrencesLoading ? (
    <div className="p-8 text-center text-sm text-slate-500">
      Loading upcoming payments...
    </div>
  ) : occurrences.filter(
      (occurrence) => occurrence.status === "UPCOMING"
    ).length === 0 ? (
    <div className="p-10 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        No upcoming payments
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Generate upcoming occurrences from your active recurring payments.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-slate-100">
      {occurrences
        .filter(
          (occurrence) =>
            occurrence.status === "UPCOMING"
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate) -
            new Date(b.dueDate)
        )
        .map((occurrence) => (
          <div
            key={occurrence.id}
            className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <CalendarDays className="h-5 w-5 text-slate-600" />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {occurrence.recurringPaymentName}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Due{" "}
                  {formatPreferredDate(occurrence.dueDate, locale, timeZone)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="sm:min-w-[120px] sm:text-right">
                <p className="font-semibold text-slate-900">
                  {formatCurrency(occurrence.expectedAmount, occurrence.currency, conversionRates, displayCurrency, locale)}
                </p>

                <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  UPCOMING
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openMarkPaidModal(occurrence)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Check className="h-4 w-4" />
                  Mark Paid
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSkipOccurrence(
                      occurrence.id
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  )}
</div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={RefreshCw}
          label="Total Payments"
          value={stats.total}
        />

        <StatCard
          icon={Play}
          label="Active"
          value={stats.active}
        />

        <StatCard
          icon={Pause}
          label="Paused"
          value={stats.paused}
        />

        <StatCard
          icon={CreditCard}
          label="Monthly Equivalent"
          value={stats.monthlyEquivalent === null
            ? "Rates unavailable"
            : formatCurrency(stats.monthlyEquivalent, displayCurrency, conversionRates, displayCurrency, locale)}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search recurring payments..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <FilterButton
                key={status}
                active={
                  statusFilter === status
                }
                onClick={() =>
                  setStatusFilter(status)
                }
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) +
                    status
                      .slice(1)
                      .toLowerCase()}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <FilterButton
            active={frequencyFilter === "ALL"}
            onClick={() =>
              setFrequencyFilter("ALL")
            }
          >
            All Frequencies
          </FilterButton>

          {FREQUENCIES.map((frequency) => (
            <FilterButton
              key={frequency.value}
              active={
                frequencyFilter ===
                frequency.value
              }
              onClick={() =>
                setFrequencyFilter(
                  frequency.value
                )
              }
            >
              {frequency.label}
            </FilterButton>
          ))}
        </div>
      </div>
        
      {/* Payments */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">
            Your Recurring Payments
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredPayments.length} payments displayed
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading recurring payments...
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <RefreshCw
                size={20}
                className="text-slate-500"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No recurring payments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first recurring payment
              to start tracking upcoming bills.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPayments.map((payment) => (
              <RecurringPaymentRow
                key={payment.id}
                payment={payment}
                conversionRates={conversionRates}
                displayCurrency={displayCurrency}
                locale={locale}
                timeZone={timeZone}
                accountName={
                  payment.accountId
                    ? accountMap[
                        payment.accountId
                      ]
                    : null
                }
                categoryName={
                  payment.categoryId
                    ? categoryMap[
                        payment.categoryId
                      ]
                    : null
                }
                paymentMethodName={
                  payment.paymentMethodId
                    ? paymentMethodMap[
                        payment.paymentMethodId
                      ]
                    : null
                }
                onEdit={() =>
                  openEditForm(payment)
                }
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <RecurringPaymentForm
          form={form}
          setForm={setForm}
          editingPayment={editingPayment}
          saving={saving}
          error={error}
          accounts={accounts}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {payingOccurrence && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">

      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Mark Payment as Paid
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Record the actual amount that was paid.
        </p>
      </div>

      <div className="space-y-5 p-5">

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">
            Payment
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {payingOccurrence.recurringPaymentName}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Due{" "}
            {formatPreferredDate(payingOccurrence.dueDate, locale, timeZone)}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Expected Amount
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {formatCurrency(payingOccurrence.expectedAmount, payingOccurrence.currency, conversionRates, displayCurrency, locale)}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Actual Amount ({payingOccurrence.currency || "original currency"})
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={actualAmount}
            onChange={(event) =>
              setActualAmount(event.target.value)
            }
            className="input"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setPayingOccurrence(null);
              setActualAmount("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={
              !actualAmount ||
              Number(actualAmount) <= 0
            }
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark as Paid
          </button>
        </div>

      </div>
    </div>
  </div>
)}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2.5">
          <Icon size={19} className="text-slate-700" />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function RecurringPaymentRow({
  payment,
  conversionRates,
  displayCurrency,
  locale,
  timeZone,
  accountName,
  categoryName,
  paymentMethodName,
  onEdit,
  onStatusChange,
}) {
  const isActive =
    payment.status === "ACTIVE";

  const isPaused =
    payment.status === "PAUSED";

  const statusClass =
    payment.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : payment.status === "PAUSED"
        ? "bg-amber-50 text-amber-700"
        : payment.status === "COMPLETED"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-500";

  const frequencyLabel =
    payment.frequency
      ?.toLowerCase()
      .replace("biweekly", "biweekly");

  return (
    <div className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 lg:flex-row lg:items-center">

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <CalendarDays
            size={19}
            className="text-slate-700"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {payment.name}
            </p>

            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
            >
              {payment.status}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{frequencyLabel}</span>

            {categoryName && (
              <>
                <span className="text-slate-300">
                  •
                </span>

                <span>{categoryName}</span>
              </>
            )}

            {accountName && (
              <>
                <span className="text-slate-300">
                  •
                </span>

                <span>{accountName}</span>
              </>
            )}

            {paymentMethodName && (
              <>
                <span className="text-slate-300">
                  •
                </span>

                <span>
                  {paymentMethodName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-left lg:text-right">
        <p className="text-base font-bold text-slate-950">
          {formatCurrency(payment.amount, payment.currency, conversionRates, displayCurrency, locale)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Next cycle:{" "}
          {formatPreferredDate(payment.startDate, locale, timeZone)}
        </p>
      </div>

      <div className="flex items-center gap-2 lg:ml-3">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <Edit3 size={14} />
          Edit
        </button>

        {isActive && (
          <button
            onClick={() =>
              onStatusChange(
                payment,
                "PAUSED"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          >
            <Pause size={14} />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={() =>
              onStatusChange(
                payment,
                "ACTIVE"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Play size={14} />
            Resume
          </button>
        )}
      </div>
    </div>
  );
}

function RecurringPaymentForm({
  form,
  setForm,
  editingPayment,
  saving,
  error,
  accounts,
  categories,
  paymentMethods,
  onClose,
  onSubmit,
}) {
  const activeAccounts = accounts.filter(
    (account) =>
      account.status === "ACTIVE"
  );

  const activeCategories = categories.filter(
    (category) =>
      category.status === "ACTIVE" &&
      (
        category.categoryType === "FIXED" ||
        category.categoryType === "VARIABLE"
      )
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
  <div className="flex min-h-full items-center justify-center">
    <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              {editingPayment
                ? "Edit Recurring Payment"
                : "Add Recurring Payment"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Track a subscription, bill, or recurring
              financial commitment.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
        >
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">

            <FormField label="Payment name">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Apartment Rent"
                maxLength={150}
                className="input"
              />
            </FormField>

            <FormField label="Amount">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="1500.00"
                className="input"
              />
            </FormField>

            <FormField label="Currency">
              <input
                value={form.currency}
                disabled={Boolean(form.accountId)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency:
                      event.target.value
                        .toUpperCase()
                        .slice(0, 3),
                  }))
                }
                maxLength={3}
                className="input disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {form.accountId && (
                <p className="mt-1 text-xs text-slate-500">
                  Currency follows the selected account.
                </p>
              )}
            </FormField>

            <FormField label="Frequency">
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    frequency:
                      event.target.value,
                  }))
                }
                className="input"
              >
                {FREQUENCIES.map(
                  (frequency) => (
                    <option
                      key={frequency.value}
                      value={frequency.value}
                    >
                      {frequency.label}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Category">
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId:
                      event.target.value,
                  }))
                }
                className="input"
              >
                <option value="">
                  No category
                </option>

                {activeCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Account">
              <select
                value={form.accountId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    accountId: event.target.value,
                    currency: event.target.value
                      ? (accounts.find((account) => account.id === event.target.value)?.currency || current.currency)
                      : current.currency,
                  }))
                }
                className="input"
              >
                <option value="">
                  No account
                </option>

                {activeAccounts.map(
                  (account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Payment method">
              <select
                value={form.paymentMethodId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentMethodId:
                      event.target.value,
                  }))
                }
                className="input"
              >
                <option value="">
                  No payment method
                </option>

                {paymentMethods.map(
                  (method) => (
                    <option
                      key={method.id}
                      value={method.id}
                    >
                      {method.name}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate:
                      event.target.value,
                  }))
                }
                className="input"
              />
            </FormField>

            <FormField label="End date (optional)">
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate:
                      event.target.value,
                  }))
                }
                className="input"
              />
            </FormField>
          </div>

          {editingPayment && (
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status:
                      event.target.value,
                  }))
                }
                className="input"
              >
                <option value="ACTIVE">
                  Active
                </option>
                <option value="PAUSED">
                  Paused
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </FormField>
          )}

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              placeholder="Optional notes..."
              className="input resize-none"
            />
          </FormField>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {editingPayment
                    ? "Save Changes"
                    : "Create Payment"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

export default RecurringPayments;