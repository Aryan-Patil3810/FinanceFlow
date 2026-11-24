
import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
} from "lucide-react";

function formatDateOnly(value, dateFormat) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  const formats = {
    "DD/MM/YYYY": `${day}/${month}/${year}`,
    "MM/DD/YYYY": `${month}/${day}/${year}`,
    "YYYY-MM-DD": `${year}-${month}-${day}`,
    "DD-MM-YYYY": `${day}-${month}-${year}`,
    "MM-DD-YYYY": `${month}-${day}-${year}`,
  };

  return formats[dateFormat] || `${day}/${month}/${year}`;
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

function TransactionRow({
  transaction,
  conversionRates = {},
  displayCurrency = "INR",
  locale = "en-IN",
  dateFormat = "DD/MM/YYYY",
}) {
  const isIncome = transaction.type === "INCOME";
  const isInvestment = transaction.type === "INVESTMENT";

  const Icon = isIncome
    ? ArrowDownLeft
    : isInvestment
      ? BriefcaseBusiness
      : ArrowUpRight;

  const amountClass = isIncome
    ? "text-emerald-600"
    : isInvestment
      ? "text-blue-600"
      : "text-rose-600";

  const iconClass = isIncome
    ? "bg-emerald-50 text-emerald-600"
    : isInvestment
      ? "bg-blue-50 text-blue-600"
      : "bg-rose-50 text-rose-600";

  const sourceCurrency = (
    transaction.currency || "USD"
  ).trim().toUpperCase();

  const targetCurrency = displayCurrency.trim().toUpperCase();

  const conversionRate =
    conversionRates[sourceCurrency];

  const hasConversion =
    sourceCurrency === targetCurrency ||
    Number.isFinite(conversionRate);

  const convertedAmount = hasConversion
    ? Number(transaction.amount) *
      (sourceCurrency === targetCurrency ? 1 : conversionRate)
    : Number(transaction.amount);

  const displayedCurrency = hasConversion
    ? targetCurrency
    : sourceCurrency;

  const formattedAmount = formatCurrency(
    convertedAmount,
    displayedCurrency,
    locale
  );

  const amountPrefix = isIncome ? "+" : "-";

  const formattedDate = formatDateOnly(
    transaction.transactionDate,
    dateFormat
  );

  return (
    <div className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
      {/* Transaction Icon */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={19} />
      </div>

      {/* Transaction Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {transaction.description || "Untitled transaction"}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{transaction.category}</span>

          <span className="text-slate-300">•</span>

          <span>{transaction.account}</span>

          {transaction.paymentMethod && (
            <>
              <span className="text-slate-300">•</span>
              <span>{transaction.paymentMethod}</span>
            </>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs font-medium text-slate-500">
          {formattedDate}
        </p>

        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
          {transaction.type}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${amountClass}`}>
          {amountPrefix}
          {formattedAmount}
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          {hasConversion
            ? `${sourceCurrency} → ${displayedCurrency}`
            : `${sourceCurrency} · Original amount`}
        </p>
      </div>
    </div>
  );
}

export default TransactionRow;
