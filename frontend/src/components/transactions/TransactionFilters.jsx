import { Search, SlidersHorizontal } from "lucide-react";

function TransactionFilters({
  activeType,
  setActiveType,
  search,
  setSearch,
}) {
  const filters = [
    { label: "All", value: "ALL" },
    { label: "Income", value: "INCOME" },
    { label: "Expenses", value: "EXPENSE" },
    { label: "Investments", value: "INVESTMENT" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveType(filter.value)}
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

        <div className="flex gap-2">
          <div className="relative w-full lg:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionFilters;