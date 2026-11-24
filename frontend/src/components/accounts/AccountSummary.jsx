
import { CreditCard, Landmark, Wallet } from "lucide-react";

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-100 p-2.5">
        <Icon size={18} className="text-slate-700" />
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function AccountSummary({
  accounts,
  conversionRates,
  displayCurrency = "USD",
  locale = "en-IN",
}) {
  const activeAccounts = accounts.filter(
    (account) => account.status === "ACTIVE"
  );

  const creditCards = activeAccounts.filter(
    (account) => account.accountType === "CREDIT_CARD"
  ).length;

  const allRatesAvailable = activeAccounts.every((account) => {
    const currency = account.currency?.trim().toUpperCase() || "USD";
    const rate = conversionRates?.[currency];

    return Number.isFinite(rate) && rate > 0;
  });

  const totalBalance = allRatesAvailable
    ? activeAccounts.reduce((total, account) => {
        const currency =
          account.currency?.trim().toUpperCase() || "USD";

        return total +
          Number(account.currentBalance || 0) *
          conversionRates[currency];
      }, 0)
    : null;

  const formattedTotalBalance =
    totalBalance === null
      ? "Rates unavailable"
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency: displayCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalBalance);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SummaryItem
          icon={Wallet}
          label="Total Balance"
          value={formattedTotalBalance}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SummaryItem
          icon={Landmark}
          label="Active Accounts"
          value={activeAccounts.length}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SummaryItem
          icon={CreditCard}
          label="Credit Cards"
          value={creditCards}
        />
      </div>
    </div>
  );
}

export default AccountSummary;
