import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
  Banknote,
  Receipt,
  SlidersHorizontal,
  Search,
  Pencil,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
} from "../services/paymentMethodService";

import PaymentMethodForm from "../components/payment-methods/PaymentMethodForm";

const TYPE_LABELS = {
  CASH: "Cash",
  DEBIT_CARD: "Debit Card",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  ACH: "ACH Transfer",
  DIGITAL_WALLET: "Digital Wallet",
  OTHER: "Other",
};

function getIcon(type) {
  switch (type) {
    case "CASH":
      return Banknote;

    case "BANK_TRANSFER":
    case "ACH":
      return Landmark;

    case "DIGITAL_WALLET":
      return Smartphone;

    case "DEBIT_CARD":
    case "CREDIT_CARD":
      return CreditCard;

    default:
      return Wallet;
  }
}

function getCategory(type) {
  if (
    type === "CREDIT_CARD" ||
    type === "DEBIT_CARD"
  ) {
    return "CARDS";
  }

  if (
    type === "BANK_TRANSFER" ||
    type === "ACH"
  ) {
    return "BANKS";
  }

  if (type === "DIGITAL_WALLET") {
    return "WALLETS";
  }

  return "OTHER";
}

/* --------------------------------
   SUMMARY CARD
-------------------------------- */

function SummaryCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-slate-100 p-2.5">
          <Icon
            size={19}
            className="text-slate-700"
          />
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

/* --------------------------------
   PAYMENT METHOD SUMMARY
-------------------------------- */

function PaymentMethodSummary({ methods }) {
  const cards = methods.filter(
    (method) =>
      method.methodType === "CREDIT_CARD" ||
      method.methodType === "DEBIT_CARD"
  ).length;

  const banks = methods.filter(
    (method) =>
      method.methodType === "BANK_TRANSFER" ||
      method.methodType === "ACH"
  ).length;

  const wallets = methods.filter(
    (method) =>
      method.methodType === "DIGITAL_WALLET"
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <SummaryCard
        icon={Receipt}
        label="Total Payment Methods"
        value={methods.length}
      />

      <SummaryCard
        icon={CreditCard}
        label="Cards"
        value={cards}
      />

      <SummaryCard
        icon={Landmark}
        label="Bank Accounts"
        value={banks}
      />

      <SummaryCard
        icon={Smartphone}
        label="Digital Wallets"
        value={wallets}
      />

    </div>
  );
}

/* --------------------------------
   PAYMENT METHOD FILTERS
-------------------------------- */

function PaymentMethodFilters({
  activeType,
  setActiveType,
  search,
  setSearch,
}) {
  const filters = [
    { label: "All", value: "ALL" },
    { label: "Cards", value: "CARDS" },
    { label: "Banks", value: "BANKS" },
    { label: "Wallets", value: "WALLETS" },
    { label: "Other", value: "OTHER" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* Segmented Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">

          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                setActiveType(filter.value)
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeType === filter.value
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {filter.label}
            </button>
          ))}

        </div>

        {/* Search and Filters */}
        <div className="flex gap-2">

          <div className="relative w-full lg:w-72">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search payment methods..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />

          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} />

            <span className="hidden sm:inline">
              Filters
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}

/* --------------------------------
   PAYMENT METHOD ROW
-------------------------------- */

function PaymentMethodRow({
  method,
  onEdit,
}) {
  const Icon = getIcon(method.methodType);

  return (
    <div className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">

      {/* Payment Method Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={19} />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {method.name}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">

          <span>
            {TYPE_LABELS[method.methodType] ||
              method.methodType}
          </span>

          <span className="text-slate-300">
            •
          </span>

          <span>
            {method.methodType}
          </span>

        </div>
      </div>

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(method)}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        title="Edit payment method"
      >
        <Pencil size={17} />
      </button>

    </div>
  );
}

/* --------------------------------
   MAIN PAGE
-------------------------------- */

function PaymentMethods() {
  const { user } = useAuth();

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const [activeType, setActiveType] = useState("ALL");
  const [search, setSearch] = useState("");

  /* Load payment methods */
  const loadMethods = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getPaymentMethods(user.id);

      setMethods(data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load payment methods."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  /* Create or update */
  async function handleSave(data) {
    try {
      setError("");

      if (editingMethod) {
        await updatePaymentMethod(
          user.id,
          editingMethod.id,
          data
        );
      } else {
        await createPaymentMethod(user.id, data);
      }

      setShowForm(false);
      setEditingMethod(null);

      await loadMethods();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save payment method."
      );

      throw err;
    }
  }

  /* Filter methods */
  const filteredMethods = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return methods.filter((method) => {
      const matchesType =
        activeType === "ALL" ||
        getCategory(method.methodType) === activeType;

      const matchesSearch =
        !searchTerm ||
        method.name.toLowerCase().includes(searchTerm) ||
        (TYPE_LABELS[method.methodType] || "")
          .toLowerCase()
          .includes(searchTerm);

      return matchesType && matchesSearch;
    });
  }, [methods, activeType, search]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm font-medium text-slate-500">
            Money
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Payment Methods
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your cards, bank transfers and digital wallets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingMethod(null);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Payment Method
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
            Loading payment methods...
          </p>
        </div>
      ) : (
        <>

          {/* Summary */}
          <PaymentMethodSummary methods={methods} />

          {/* Filters */}
          <PaymentMethodFilters
            activeType={activeType}
            setActiveType={setActiveType}
            search={search}
            setSearch={setSearch}
          />

          {/* Payment Method List */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* List Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="font-semibold text-slate-900">
                  {activeType === "ALL"
                    ? "All Payment Methods"
                    : activeType === "CARDS"
                      ? "Cards"
                      : activeType === "BANKS"
                        ? "Bank Accounts"
                        : activeType === "WALLETS"
                          ? "Digital Wallets"
                          : "Other Payment Methods"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredMethods.length} payment method
                  {filteredMethods.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

            </div>

            {/* Rows */}
            {filteredMethods.length > 0 ? (
              <div className="divide-y divide-slate-100">

                {filteredMethods.map((method) => (
                  <PaymentMethodRow
                    key={method.id}
                    method={method}
                    onEdit={(method) => {
                      setEditingMethod(method);
                      setShowForm(true);
                    }}
                  />
                ))}

              </div>
            ) : (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <CreditCard
                    size={25}
                    className="text-slate-500"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {methods.length === 0
                    ? "No payment methods yet"
                    : "No payment methods found"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {methods.length === 0
                    ? "Add your cards, bank accounts or digital wallets to get started."
                    : "Try changing your search or payment method filter."}
                </p>

                {methods.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMethod(null);
                      setShowForm(true);
                    }}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus size={17} />
                    Add Payment Method
                  </button>
                )}

              </div>
            )}

          </section>

        </>
      )}

      {/* Modal */}
      {showForm && (
        <PaymentMethodForm
          paymentMethod={editingMethod}
          onClose={() => {
            setShowForm(false);
            setEditingMethod(null);
          }}
          onSubmit={handleSave}
        />
      )}

    </div>
  );
}

export default PaymentMethods;