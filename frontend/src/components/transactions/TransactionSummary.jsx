
import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Receipt,
} from "lucide-react";

function SummaryCard({
  icon: Icon,
  label,
  value,
  className = "",
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

          <p
            className={`mt-1 text-xl font-bold ${
              className || "text-slate-950"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(locale || "en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function calculateTotal(
  transactions,
  type,
  conversionRates,
  displayCurrency
) {
  const matchingTransactions = transactions.filter(
    (transaction) => transaction.type === type
  );

  if (matchingTransactions.length === 0) {
    return {
      value: 0,
      available: true,
    };
  }

  let total = 0;

  for (const transaction of matchingTransactions) {
    const sourceCurrency = (
      transaction.currency || "USD"
    ).trim().toUpperCase();

    const targetCurrency = displayCurrency.trim().toUpperCase();

    let rate = 1;

    if (sourceCurrency !== targetCurrency) {
      rate = conversionRates[sourceCurrency];

      if (!Number.isFinite(rate)) {
        return {
          value: null,
          available: false,
        };
      }
    }

    total += Number(transaction.amount) * rate;
  }

  return {
    value: total,
    available: true,
  };
}

function TransactionSummary({
  transactions = [],
  conversionRates = {},
  displayCurrency = "INR",
  locale = "en-IN",
}) {
  const income = calculateTotal(
    transactions,
    "INCOME",
    conversionRates,
    displayCurrency
  );

  const expenses = calculateTotal(
    transactions,
    "EXPENSE",
    conversionRates,
    displayCurrency
  );

  const investments = calculateTotal(
    transactions,
    "INVESTMENT",
    conversionRates,
    displayCurrency
  );

  const formatTotal = (result, prefix = "") => {
    if (!result.available) {
      return "Rates unavailable";
    }

    return `${prefix}${formatCurrency(
      result.value,
      displayCurrency,
      locale
    )}`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={Receipt}
        label="Total Transactions"
        value={transactions.length}
      />

      <SummaryCard
        icon={ArrowDownLeft}
        label="Income"
        value={formatTotal(income, "+")}
        className="text-emerald-600"
      />

      <SummaryCard
        icon={ArrowUpRight}
        label="Expenses"
        value={formatTotal(expenses, "-")}
        className="text-rose-600"
      />

      <SummaryCard
        icon={BriefcaseBusiness}
        label="Investments"
        value={formatTotal(investments)}
        className="text-blue-600"
      />
    </div>
  );
}

export default TransactionSummary;
