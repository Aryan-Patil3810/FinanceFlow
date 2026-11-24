import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  MoreHorizontal,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import {
  getRecurringPayments,
} from "../services/recurringPaymentService";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccounts } from "../services/accountService";
import { getTransactions } from "../services/transactionService";
import { getCategories } from "../services/categoryService";
import { getPaymentMethods } from "../services/paymentMethodService";
import {
  getUpcomingPaymentOccurrences,
} from "../services/paymentOccurenceService";
import { useAuth } from "../context/AuthContext";
import { getTransfers } from "../services/transferService";
import { getCurrencyRate } from "../services/currencyRateService";
import { usePreferences } from "../context/PreferencesContext";

// const USER_ID = "9a522adc-d97e-4c63-a6d5-099f179d2319";

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  positive,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5">
          <Icon size={20} className="text-slate-700" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium">
        {positive ? (
          <ArrowUpRight
            size={14}
            className="text-emerald-600"
          />
        ) : (
          <ArrowDownRight
            size={14}
            className="text-rose-500"
          />
        )}

        <span
          className={
            positive
              ? "text-emerald-600"
              : "text-rose-500"
          }
        >
          {change}
        </span>

        <span className="text-slate-400">
          vs last month
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const displayCurrency = (preferences?.displayCurrency || "INR").trim().toUpperCase();
  const locale = preferences?.locale || "en-IN";
  const timeZone = preferences?.timeZone || "Asia/Kolkata";
  const dateFormat = preferences?.dateFormat || "DD/MM/YYYY";
  const [currencyRates, setCurrencyRates] = useState({ USD: 1 });
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date();
  const [transfers, setTransfers] = useState([]);
  const [recurringPayments, setRecurringPayments] =
  useState([]);

  const formattedToday = today.toLocaleDateString(locale, {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone,
  });

  const currentHour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "numeric", hourCycle: "h23", timeZone,
  }).format(today));

  const formatCurrency = (value, currency = displayCurrency) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return `${currency} ${Number(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const convertAmount = (amount, sourceCurrency = "USD") => {
    const source = String(sourceCurrency || "USD").trim().toUpperCase();
    const value = Number(amount || 0);
    if (source === displayCurrency) return value;
    const sourceUsdRate = currencyRates[source];
    const targetUsdRate = currencyRates[displayCurrency];
    if (!sourceUsdRate || !targetUsdRate) return null;
    return value * (targetUsdRate / sourceUsdRate);
  };

  const formatDate = (dateValue, options = {}) => {
    if (!dateValue) return "—";
    const date = new Date(`${String(dateValue).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    const dateOptions = dateFormat === "MM/DD/YYYY"
      ? { month: "2-digit", day: "2-digit", year: "numeric" }
      : dateFormat === "YYYY-MM-DD"
        ? { year: "numeric", month: "2-digit", day: "2-digit" }
        : { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString(locale, { ...dateOptions, timeZone, ...options });
  };

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";
  /*
   * Load all dashboard data.
   */
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) {
  setLoading(false);
  return;
}
      try {
        
        setLoading(true);
        setError("");

        const today = new Date();

        const startDate = today
          .toISOString()
          .split("T")[0];

        const endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 30
        )
          .toISOString()
          .split("T")[0];

        const [
          accountData,
          transactionData,
          categoryData,
          paymentMethodData,
          upcomingPaymentData,
          transferData,
          recurringPaymentData,
        ] = await Promise.all([
          getAccounts(user.id),
          getTransactions(user.id),
          getCategories(user.id),
          getPaymentMethods(user.id),
          getUpcomingPaymentOccurrences(
            user.id,
            startDate,
            endDate
          ),
          getTransfers(user.id),
          getRecurringPayments(user.id),
        ]);

        setAccounts(accountData);
        setTransactions(transactionData);
        setCategories(categoryData);
        setPaymentMethods(paymentMethodData);
        setTransfers(transferData);
        setRecurringPayments(recurringPaymentData);

        // IMPORTANT:
        // Store the upcoming payment API response.
        setUpcomingPayments(upcomingPaymentData);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  // Fetch USD-based reference rates for every currency used by dashboard data.
  useEffect(() => {
    const currencies = new Set([displayCurrency, "USD"]);
    accounts.forEach((item) => currencies.add(String(item.currency || "USD").trim().toUpperCase()));
    transactions.forEach((item) => currencies.add(String(item.currency || accounts.find(a => a.id === item.accountId)?.currency || "USD").trim().toUpperCase()));
    transfers.forEach((item) => currencies.add(String(item.currency || "USD").trim().toUpperCase()));
    upcomingPayments.forEach((item) => {
      const recurring = recurringPayments.find((payment) => payment.id === item.recurringPaymentId);
      const account = accounts.find((account) => account.id === (item.accountId || recurring?.accountId));
      currencies.add(String(item.currency || recurring?.currency || account?.currency || "USD").trim().toUpperCase());
    });
    recurringPayments.forEach((item) => {
      const account = accounts.find((account) => account.id === item.accountId);
      currencies.add(String(item.currency || account?.currency || "USD").trim().toUpperCase());
    });
    let cancelled = false;
    Promise.all([...currencies].map(async (currency) => {
      if (currency === "USD") return [currency, 1];
      try {
        const result = await getCurrencyRate(currency);
        return [currency, Number(result.exchangeRate)];
      } catch (err) {
        console.error(`Exchange rate unavailable for ${currency}`, err);
        return [currency, null];
      }
    }))
      .then((entries) => { if (!cancelled) setCurrencyRates(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [displayCurrency, accounts, transactions, transfers, upcomingPayments, recurringPayments]);

  /*
   * Account ID -> Account name
   */
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

  /*
   * Category ID -> Category name
   */
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

  /*
   * Payment method ID -> Payment method name
   */
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

  /*
   * Enrich transactions with human-readable names.
   */
  const enrichedTransactions = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,

        name:
          transaction.description ||
          "Untitled transaction",

        category:
          categoryMap[transaction.categoryId] ||
          "Uncategorized",

        account:
          accountMap[transaction.accountId] ||
          "Unknown account",

        paymentMethod: transaction.paymentMethodId
          ? paymentMethodMap[
          transaction.paymentMethodId
          ]
          : null,
      })),
    [
      transactions,
      accountMap,
      categoryMap,
      paymentMethodMap,
    ]
  );
  const accountBalances = useMemo(() => {
    const balances = {};

    accounts.forEach((account) => {
      balances[account.id] = Number(account.openingBalance || 0);
    });

    transactions.forEach((transaction) => {
      const accountId = transaction.accountId;

      if (!accountId || balances[accountId] === undefined) {
        return;
      }

      // Keep each account balance in that account's own currency.
      const amount = Number(transaction.amount || 0);

      if (transaction.type === "INCOME") {
        balances[accountId] += amount;
      }

      if (
        transaction.type === "EXPENSE" ||
        transaction.type === "INVESTMENT"
      ) {
        balances[accountId] -= amount;
      }
    });

    transfers.forEach((transfer) => {
      const amount = Number(transfer.amount || 0);

      const sourceAccountId = transfer.sourceAccountId;
      const destinationAccountId =
        transfer.destinationAccountId;

      if (balances[sourceAccountId] !== undefined) {
        balances[sourceAccountId] -= amount;
      }

      if (balances[destinationAccountId] !== undefined) {
        balances[destinationAccountId] += amount;
      }
    });

    return balances;
  }, [accounts, transactions, transfers]);

  /*
   * Current balance.
   *
   * Temporary implementation:
   * sum of active account opening balances.
   *
   * We will later calculate the true balance using:
   * opening balance
   * + income
   * - expenses
   * - investments
   * +/- transfers
   */
  const totalBalance = useMemo(() => {
    return accounts
      .filter((account) => account.status === "ACTIVE")
      .reduce((total, account) => {
        const converted = convertAmount(accountBalances[account.id] || 0, account.currency || "USD");
        return total + (converted ?? 0);
      }, 0);
  }, [accounts, accountBalances, currencyRates, displayCurrency]);

  /*
   * Total income.
   */
  const totalIncome = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type === "INCOME"
        )
        .reduce(
          (total, transaction) =>
            total + (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0),
          0
        ),
    [transactions, accounts, currencyRates, displayCurrency]
  );

  /*
   * Total expenses.
   */
  const totalExpenses = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type === "EXPENSE"
        )
        .reduce(
          (total, transaction) =>
            total + (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0),
          0
        ),
    [transactions, accounts, currencyRates, displayCurrency]
  );

  /*
   * Upcoming payment total for the next 30 days.
   */
  const upcomingTotal = useMemo(
    () =>
      upcomingPayments
        .filter(
          (payment) =>
            payment.status === "UPCOMING"
        )
        .reduce(
          (total, payment) =>
            total + (convertAmount(payment.expectedAmount, payment.currency || recurringPayments.find(r => r.id === payment.recurringPaymentId)?.currency || "USD") ?? 0),
          0
        ),
    [upcomingPayments, recurringPayments, currencyRates, displayCurrency]
  );

  /*
   * Cash flow for the last 6 months.
   */
  const cashFlowData = useMemo(() => {
    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        monthIndex: date.getMonth(),

        month: date.toLocaleDateString(locale, {
          month: "short", timeZone,
        }),

        income: 0,
        expenses: 0,
      });
    }

    transactions.forEach((transaction) => {
      const date = new Date(
        `${transaction.transactionDate}T00:00:00`
      );

      const monthData = months.find(
        (item) =>
          item.year === date.getFullYear() &&
          item.monthIndex === date.getMonth()
      );

      if (!monthData) {
        return;
      }

      if (transaction.type === "INCOME") {
        monthData.income += convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0;
      }

      if (transaction.type === "EXPENSE") {
        monthData.expenses += convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0;
      }
    });

    return months;
  }, [transactions, accounts, currencyRates, displayCurrency, locale, timeZone]);


  /*
   * Spending breakdown for the current month.
   */
  const spendingData = useMemo(() => {
    const now = new Date();

    const currentMonthExpenses =
      transactions.filter((transaction) => {
        const date = new Date(
          `${transaction.transactionDate}T00:00:00`
        );

        return (
          transaction.type === "EXPENSE" &&
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      });

    const categoryTotals = {};

    currentMonthExpenses.forEach((transaction) => {
      const category =
        categoryMap[transaction.categoryId] ||
        "Uncategorized";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0);
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryMap, accounts, currencyRates, displayCurrency]);

  /*
   * Savings calculation.
   */
  const savingsAmount =
    totalIncome - totalExpenses;

  const savingsRate =
    totalIncome > 0
      ? (savingsAmount / totalIncome) * 100
      : 0;

  /*
   * Temporary Financial Health scoring.
   *
   * We will improve this later using:
   * savings rate
   * expense ratio
   * recurring payment burden
   * investment contribution
   * cash-flow consistency
   */
  const financialHealth = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce(
        (total, transaction) => total + (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0),
        0
      );

    const expenses = transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce(
        (total, transaction) => total + (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0),
        0
      );

    const investments = transactions
      .filter((transaction) => transaction.type === "INVESTMENT")
      .reduce(
        (total, transaction) => total + (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0),
        0
      );

    if (income <= 0) {
      return {
        score: 1,
        savingsRate: 0,
        expenseRatio: 100,
        investmentRate: 0,
        recurringBurden: 0,
        consistency: 0,
      };
    }

    // 1. Savings rate
    const savingsAmount = income - expenses - investments;

    const savingsRate = Math.max(
      0,
      (savingsAmount / income) * 100
    );

    const savingsScore = Math.min(
      100,
      (savingsRate / 30) * 100
    );

    // 2. Expense ratio
    const expenseRatio = (expenses / income) * 100;

    let expenseScore;

    if (expenseRatio <= 50) {
      expenseScore = 100;
    } else if (expenseRatio >= 100) {
      expenseScore = 0;
    } else {
      expenseScore =
        ((100 - expenseRatio) / 50) * 100;
    }

    // 3. Investment contribution
    const investmentRate =
      (investments / income) * 100;

    const investmentScore = Math.min(
      100,
      (investmentRate / 20) * 100
    );

    // 4. Recurring payment burden
    const activeRecurringPayments =
  recurringPayments.filter(
    (payment) => payment.status === "ACTIVE"
  );

const monthlyRecurringAmount =
  activeRecurringPayments.reduce(
    (total, payment) => {
      const recurringAccount = accounts.find((account) => account.id === payment.accountId);
      const amount = convertAmount(payment.amount, payment.currency || recurringAccount?.currency || "USD") ?? 0;

      switch (payment.frequency) {
        case "WEEKLY":
          return total + (amount * 52) / 12;

        case "BIWEEKLY":
          return total + (amount * 26) / 12;

        case "MONTHLY":
          return total + amount;

        case "QUARTERLY":
          return total + amount / 3;

        case "YEARLY":
          return total + amount / 12;

        default:
          return total;
      }
    },
    0
  );

const recurringBurden =
  (monthlyRecurringAmount / income) * 100;

    let recurringScore;

    if (recurringBurden <= 20) {
      recurringScore = 100;
    } else if (recurringBurden >= 60) {
      recurringScore = 0;
    } else {
      recurringScore =
        ((60 - recurringBurden) / 40) * 100;
    }

    // 5. Cash-flow consistency
    const monthlyCashFlow = {};

    transactions.forEach((transaction) => {
      const month =
        transaction.transactionDate?.slice(0, 7);

      if (!month) return;

      if (!monthlyCashFlow[month]) {
        monthlyCashFlow[month] = {
          income: 0,
          expenses: 0,
        };
      }

      if (transaction.type === "INCOME") {
        monthlyCashFlow[month].income +=
          (convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD") ?? 0);
      }

      if (transaction.type === "EXPENSE") {
        monthlyCashFlow[month].expenses +=
          Number(transaction.amount || 0);
      }
    });

    const months = Object.values(monthlyCashFlow);

    const positiveMonths = months.filter(
      (month) =>
        month.income > 0 &&
        month.income >= month.expenses
    ).length;

    const consistency =
      months.length > 0
        ? (positiveMonths / months.length) * 100
        : 0;

    // Weighted score
    const weightedScore =
      savingsScore * 0.30 +
      expenseScore * 0.25 +
      investmentScore * 0.20 +
      recurringScore * 0.15 +
      consistency * 0.10;

    const score = Math.max(
      1,
      Math.min(
        10,
        Math.round(weightedScore / 10)
      )
    );

    return {
      score,
      savingsRate,
      expenseRatio,
      investmentRate,
      recurringBurden,
      monthlyRecurringAmount,
      consistency,
    };
  }, [transactions, recurringPayments, accounts, currencyRates, displayCurrency]);

  const healthMessage = useMemo(() => {
    const score = financialHealth.score;

    if (score >= 8) {
      return "Strong financial position with healthy savings and spending patterns.";
    }

    if (score >= 6) {
      return "Your finances are generally healthy, with some areas that could improve.";
    }

    if (score >= 4) {
      return "Your financial position has room for improvement. Focus on spending and savings.";
    }

    return "Your current cash-flow pattern needs attention. Review expenses and recurring commitments.";
  }, [financialHealth.score]);

  /*
   * Get five most recent transactions.
   */
  const recentTransactions = useMemo(() => {
    return [...enrichedTransactions]
      .sort(
        (a, b) =>
          new Date(b.transactionDate) -
          new Date(a.transactionDate)
      )
      .slice(0, 5);
  }, [enrichedTransactions]);

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading your financial dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {formattedToday}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            {greeting}, {user?.firstName || "there"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your finances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/transactions")}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          + Add Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          change="Live balance"
          positive
          icon={Wallet}
        />

        <StatCard
          title="Income"
          value={formatCurrency(totalIncome)}
          change="From transactions"
          positive
          icon={TrendingUp}
        />

        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          change="From transactions"
          positive={false}
          icon={CreditCard}
        />

        <StatCard
          title="Upcoming"
          value={formatCurrency(upcomingTotal)}
          change="Next 30 days"
          positive={false}
          icon={CalendarDays}
        />

      </div>

      {/* Main analytics */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">

        {/* Cash Flow */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Cash Flow
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Income and expenses over the last 6 months
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <MoreHorizontal size={18} />
            </button>

          </div>

          <div className="mt-6 h-[320px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={cashFlowData}>

                <defs>

                  <linearGradient
                    id="incomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="100%"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopOpacity={0.18}
                    />

                    <stop
                      offset="100%"
                      stopOpacity={0}
                    />
                  </linearGradient>

                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `${displayCurrency} ${(value / 1000).toFixed(1)}k`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                />

                <Area
                  type="monotone"
                  dataKey="expenses"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

          <div className="mt-2 flex items-center gap-5 text-xs text-slate-500">

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Income
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Expenses
            </div>

          </div>

        </section>

        {/* Financial Health */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <h2 className="font-semibold text-slate-900">
              Financial Health
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {healthMessage}
            </p>
          </div>

          <div className="mt-8 flex justify-center">

            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[18px] border-slate-100">

              <div className="absolute inset-[-18px] rotate-[-35deg] rounded-full border-[18px] border-transparent border-r-slate-900 border-t-slate-900" />

              <div className="text-center">

                <p className="text-5xl font-bold text-slate-950">
                  {financialHealth.score}
                </p>

                <p className="text-sm font-medium text-slate-400">
                  out of 10
                </p>

              </div>

            </div>

          </div>

          <div className="mt-7 rounded-xl bg-slate-50 p-4">

            <p className="text-sm font-semibold text-slate-900">
              {financialHealth.score >= 8
                ? "You're doing great."
                : financialHealth.score >= 5
                  ? "You're building a healthy position."
                  : "Your finances need attention."}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {financialHealth.score >= 8
                ? "Your current savings rate is strong. Keep maintaining healthy spending habits."
                : financialHealth.score >= 5
                  ? "Increasing your savings rate could improve your financial health score."
                  : "Your current spending is putting pressure on your savings. Consider reducing unnecessary expenses."}
            </p>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">
      Savings Rate
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-900">
      {financialHealth.savingsRate.toFixed(1)}%
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">
      Expense Ratio
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-900">
      {financialHealth.expenseRatio.toFixed(1)}%
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">
      Investment Rate
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-900">
      {financialHealth.investmentRate.toFixed(1)}%
    </p>
  </div>

  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">
      Recurring Burden
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-900">
      {financialHealth.recurringBurden.toFixed(1)}%
    </p>
  </div>

</div>

        </section>

      </div>

      {/* Bottom analytics */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Spending Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Spending Breakdown
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Where your money went this month
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(
                spendingData.reduce((total, item) => total + item.value, 0)
              )}
            </span>

          </div>

          {spendingData.length > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">

              <div className="h-56 w-56">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={spendingData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {spendingData.map(
                        (_, index) => (
                          <Cell key={index} />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Spent",
                      ]}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="w-full space-y-3">

                {spendingData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-500">
                      {item.name}
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}

              </div>

            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 px-5 py-10 text-center">

              <p className="text-sm font-semibold text-slate-900">
                No spending this month
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your expense breakdown will appear here.
              </p>

            </div>
          )}

        </section>

        {/* Upcoming Payments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Upcoming Payments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Payments due in the next 30 days
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/recurring")}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950"
            >
              View all
            </button>

          </div>

          <div className="mt-5 divide-y divide-slate-100">

            {upcomingPayments.filter(
              (payment) =>
                payment.status === "UPCOMING"
            ).length > 0 ? (

              upcomingPayments
                .filter(
                  (payment) =>
                    payment.status === "UPCOMING"
                )
                .slice(0, 5)
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <CalendarDays
                          size={18}
                          className="text-slate-600"
                        />
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-900">
                          {payment.recurringPaymentName ||
                            "Upcoming payment"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Due{" "}
                          {formatDate(payment.dueDate, { month: "short", day: "numeric" })}
                        </p>

                      </div>

                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(convertAmount(payment.expectedAmount, payment.currency || recurringPayments.find(r => r.id === payment.recurringPaymentId)?.currency || "USD"))}
                    </p>

                  </div>
                ))

            ) : (

              <div className="rounded-xl bg-slate-50 px-5 py-8 text-center">

                <CalendarDays
                  size={24}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  No upcoming payments
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  You're clear for the next 30 days.
                </p>

              </div>

            )}

          </div>

        </section>

      </div>

      {/* Recent Transactions */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <div>
            <h2 className="font-semibold text-slate-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Your latest financial activity
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/transactions")}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950"
          >
            View all
          </button>

        </div>

        <div className="divide-y divide-slate-100">

          {recentTransactions.length > 0 ? (
            recentTransactions.map(
              (transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`rounded-xl p-2.5 ${transaction.type ===
                          "INCOME"
                          ? "bg-emerald-50"
                          : transaction.type ===
                            "INVESTMENT"
                            ? "bg-blue-50"
                            : "bg-rose-50"
                        }`}
                    >

                      {transaction.type ===
                        "INCOME" ? (
                        <ArrowDownRight
                          size={18}
                          className="text-emerald-600"
                        />
                      ) : transaction.type ===
                        "INVESTMENT" ? (
                        <TrendingUp
                          size={18}
                          className="text-blue-600"
                        />
                      ) : (
                        <ArrowUpRight
                          size={18}
                          className="text-rose-600"
                        />
                      )}

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-slate-900">
                        {transaction.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">

                        {transaction.category}

                        {" · "}

                        {transaction.account}

                        {" · "}

                        {formatDate(transaction.transactionDate, { month: "short", day: "numeric" })}

                      </p>

                    </div>

                  </div>

                  <p
                    className={`text-sm font-bold ${transaction.type ===
                        "INCOME"
                        ? "text-emerald-600"
                        : transaction.type ===
                          "INVESTMENT"
                          ? "text-blue-600"
                          : "text-rose-600"
                      }`}
                  >
                    {transaction.type ===
                      "INCOME"
                      ? "+"
                      : "-"}
                    {formatCurrency(convertAmount(transaction.amount, transaction.currency || accounts.find(a => a.id === transaction.accountId)?.currency || "USD"))}
                  </p>

                </div>
              )
            )
          ) : (
            <div className="px-6 py-16 text-center">

              <p className="text-sm font-medium text-slate-500">
                No transactions yet.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Your recent financial activity will
                appear here.
              </p>

            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;