import {
  Archive,
  Edit3,
  FolderPlus,
  Layers3,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createCategory,
  getCategories,
  updateCategory,
  archiveCategory,
} from "../services/categoryService";
import { useAuth } from "../context/AuthContext";

const USER_ID = "9a522adc-d97e-4c63-a6d5-099f179d2319";

const CATEGORY_TYPES = [
  {
    value: "FIXED",
    label: "Fixed",
    description: "Regular recurring expenses",
  },
  {
    value: "VARIABLE",
    label: "Variable",
    description: "Flexible day-to-day spending",
  },
  {
    value: "INVESTMENT",
    label: "Investment",
    description: "Investments and wealth building",
  },
  {
    value: "INCOME",
    label: "Income",
    description: "Money coming into your accounts",
  },
];

function Categories() {
  const {user}=useAuth();
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [activeType, setActiveType] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    categoryType: "VARIABLE",
  });

  useEffect(() => {
    loadCategories();
  }, [user?.id]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getCategories(user.id);

      setCategories(data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingCategory(null);

    setForm({
      name: "",
      categoryType: "VARIABLE",
    });

    setError("");
    setShowForm(true);
  }

  function openEditForm(category) {
    if (category.system) {
      return;
    }

    setEditingCategory(category);

    setForm({
      name: category.name,
      categoryType: category.categoryType,
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCategory(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingCategory) {
        const updatedCategory = await updateCategory(
          user.id,
          editingCategory.id,
          {
            name: trimmedName,
            categoryType: form.categoryType,
          }
        );

        setCategories((current) =>
          current.map((category) =>
            category.id === updatedCategory.id
              ? updatedCategory
              : category
          )
        );
      } else {
        const createdCategory = await createCategory(
          user.id,
          {
            name: trimmedName,
            categoryType: form.categoryType,
          }
        );

        setCategories((current) => [
          ...current,
          createdCategory,
        ]);
      }

      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(category) {
    if (category.system) {
      return;
    }

    const confirmed = window.confirm(
      `Archive "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const archivedCategory = await archiveCategory(
        user.id,
        category.id
      );

      setCategories((current) =>
        current.map((item) =>
          item.id === archivedCategory.id
            ? archivedCategory
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to archive category."
      );
    }
  }

  const filteredCategories = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !searchTerm ||
        category.name
          .toLowerCase()
          .includes(searchTerm);

      const matchesType =
        activeType === "ALL" ||
        category.categoryType === activeType;

      const matchesStatus =
        activeStatus === "ALL" ||
        category.status === activeStatus;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    categories,
    search,
    activeType,
    activeStatus,
  ]);

  const stats = useMemo(() => {
    return {
      total: categories.length,

      system: categories.filter(
        (category) => category.system
      ).length,

      custom: categories.filter(
        (category) => !category.system
      ).length,

      active: categories.filter(
        (category) => category.status === "ACTIVE"
      ).length,
    };
  }, [categories]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Organization
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Categories
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Organize your income, spending, and investments
            with clear financial categories.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Category
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Total Categories"
          value={stats.total}
        />

        <StatCard
          icon={Tag}
          label="System Categories"
          value={stats.system}
        />

        <StatCard
          icon={FolderPlus}
          label="Custom Categories"
          value={stats.custom}
        />

        <StatCard
          icon={Archive}
          label="Active Categories"
          value={stats.active}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
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
              placeholder="Search categories..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={activeType === "ALL"}
              onClick={() => setActiveType("ALL")}
            >
              All
            </FilterButton>

            {CATEGORY_TYPES.map((type) => (
              <FilterButton
                key={type.value}
                active={activeType === type.value}
                onClick={() =>
                  setActiveType(type.value)
                }
              >
                {type.label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <FilterButton
            active={activeStatus === "ACTIVE"}
            onClick={() => setActiveStatus("ACTIVE")}
          >
            Active
          </FilterButton>

          <FilterButton
            active={activeStatus === "ARCHIVED"}
            onClick={() => setActiveStatus("ARCHIVED")}
          >
            Archived
          </FilterButton>

          <FilterButton
            active={activeStatus === "ALL"}
            onClick={() => setActiveStatus("ALL")}
          >
            All
          </FilterButton>
        </div>
      </div>

      {/* Categories */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Your Categories
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredCategories.length} categories
                displayed
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Tag
                size={20}
                className="text-slate-500"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No categories found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters or create a
              custom category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={() =>
                  openEditForm(category)
                }
                onArchive={() =>
                  handleArchive(category)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <CategoryFormModal
          form={form}
          setForm={setForm}
          editingCategory={editingCategory}
          saving={saving}
          error={error}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
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

function CategoryRow({
  category,
  onEdit,
  onArchive,
}) {
  const typeLabel =
    category.categoryType
      ?.toLowerCase()
      .replace("_", " ");

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Tag
            size={18}
            className="text-slate-700"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {category.name}
            </p>

            {category.system && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                System
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-slate-500">
              {typeLabel}
            </span>

            <span className="text-slate-300">
              •
            </span>

            <span
              className={`text-xs font-medium ${
                category.status === "ACTIVE"
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {category.status}
            </span>
          </div>
        </div>
      </div>

      {!category.system && (
        <div className="flex items-center gap-2 sm:shrink-0">
          {category.status === "ACTIVE" && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:border-slate-300"
              >
                <Edit3 size={14} />
                Edit
              </button>

              <button
                onClick={onArchive}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <Archive size={14} />
                Archive
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryFormModal({
  form,
  setForm,
  editingCategory,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              {editingCategory
                ? "Edit Category"
                : "Create Category"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {editingCategory
                ? "Update your custom category."
                : "Create a category for your finances."}
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
          className="space-y-5 p-5"
        >
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category name
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Pet Care"
              maxLength={100}
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category type
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORY_TYPES.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      categoryType: type.value,
                    }))
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    form.categoryType === type.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {type.label}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      form.categoryType === type.value
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

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
                  {editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Categories;