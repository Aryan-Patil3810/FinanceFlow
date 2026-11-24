
import {
  Archive,
  Building2,
  CreditCard,
  MoreHorizontal,
  PiggyBank,
  Wallet,
} from "lucide-react";

const accountIcons = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
  CREDIT_CARD: CreditCard,
  BROKERAGE: Building2,
  CASH: Wallet,
  OTHER: Wallet,
};

function AccountCard({
  account,
  onArchive,
  onEdit,
  conversionRates,
  displayCurrency = "USD",
  locale = "en-IN",
}) {
  const Icon = accountIcons[account.accountType] || Wallet;

  const accountCurrency = account.currency?.trim().toUpperCase() || "USD";
  const rate = conversionRates?.[accountCurrency];

  const canConvert = Number.isFinite(rate) && rate > 0;
  const currencyToDisplay = canConvert
    ? displayCurrency
    : accountCurrency;

  const balance =
    Number(account.currentBalance ?? 0) *
    (canConvert ? rate : 1);

  const formattedBalance = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyToDisplay,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-3">
            <Icon size={21} className="text-slate-700" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              {account.name}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {account.accountType.replace("_", " ")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(account)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="Edit account"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-8">
        <p className="text-xs font-medium text-slate-400">
          Current balance
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {formattedBalance}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs font-medium text-emerald-600">
          {account.status}
        </span>

        <button
          type="button"
          onClick={() => onArchive(account.id)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-rose-600"
        >
          <Archive size={14} />
          Archive
        </button>
      </div>
    </div>
  );
}

export default AccountCard;
