import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { getAccounts } from "../../services/accountService";
import { getCategories } from "../../services/categoryService";
import { getPaymentMethods } from "../../services/paymentMethodService";

const initialForm = {
    type: "EXPENSE",
    accountId: "",
    categoryId: "",
    paymentMethodId: "",
    amount: "",
    currency: "USD",
    transactionDate: new Date().toISOString().split("T")[0],
    description: "",
    notes: "",
};

function TransactionForm({ userId, onClose, onSubmit }) {
    const [form, setForm] = useState(initialForm);

    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    const availableCategories = categories.filter((category) => {
        if (form.type === "INCOME") {
            return category.categoryType === "INCOME";
        }

        if (form.type === "INVESTMENT") {
            return category.categoryType === "INVESTMENT";
        }

        return (
            category.categoryType === "FIXED" ||
            category.categoryType === "VARIABLE"
        );
    });
    useEffect(() => {
        async function loadFormData() {
            try {
                setLoadingData(true);
                setError("");

                const [accountData, categoryData, paymentMethodData] =
                    await Promise.all([
                        getAccounts(userId),
                        getCategories(userId),
                        getPaymentMethods(userId),
                    ]);

                setAccounts(
                    accountData.filter((account) => account.status === "ACTIVE")
                );

                setCategories(
                    categoryData.filter((category) => category.status === "ACTIVE")
                );

                setPaymentMethods(paymentMethodData);
            } catch (err) {
                console.error(err);
                setError("Unable to load transaction options.");
            } finally {
                setLoadingData(false);
            }
        }

        loadFormData();
    }, [userId]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        // Automatically use the selected account currency.
        if (name === "accountId") {
            const selectedAccount = accounts.find(
                (account) => account.id === value
            );

            if (selectedAccount) {
                setForm((current) => ({
                    ...current,
                    accountId: value,
                    currency: selectedAccount.currency,
                }));
            }
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!form.accountId) {
            setError("Please select an account.");
            return;
        }

        if (!form.categoryId) {
            setError("Please select a category.");
            return;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            setError("Amount must be greater than zero.");
            return;
        }

        if (!form.transactionDate) {
            setError("Transaction date is required.");
            return;
        }

        if (!form.description.trim()) {
            setError("Description is required.");
            return;
        }

        onSubmit({
            ...form,
            amount: Number(form.amount),
            description: form.description.trim(),
            notes: form.notes.trim(),
            paymentMethodId: form.paymentMethodId || null,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Add Transaction
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Record income, expenses or investments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {error}
                        </div>
                    )}

                    {loadingData ? (
                        <div className="py-12 text-center text-sm text-slate-500">
                            Loading account options...
                        </div>
                    ) : (
                        <>
                            {/* Type */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Transaction type
                                </label>

                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {["EXPENSE", "INCOME", "INVESTMENT"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    type,
                                                    categoryId: "",
                                                    paymentMethodId: type === "EXPENSE"
                                                        ? current.paymentMethodId
                                                        : "",
                                                }))
                                            }
                                            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${form.type === type
                                                    ? "border-slate-950 bg-slate-950 text-white"
                                                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Account */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Account
                                </label>

                                <select
                                    name="accountId"
                                    value={form.accountId}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                                >
                                    <option value="">Select account</option>

                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Category
                                </label>

                                <select
                                    name="categoryId"
                                    value={form.categoryId}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                                >
                                    <option value="">Select category</option>

                                    {availableCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method */}
                            {form.type === "EXPENSE" && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Payment method
                                    </label>

                                    <select
                                        name="paymentMethodId"
                                        value={form.paymentMethodId}
                                        onChange={handleChange}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                                    >
                                        <option value="">None</option>

                                        {paymentMethods.map((method) => (
                                            <option key={method.id} value={method.id}>
                                                {method.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Amount + Currency */}
                            <div className="grid grid-cols-[1fr_120px] gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Amount
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">
                                        Currency
                                    </label>

                                    <input
                                        value={form.currency}
                                        readOnly
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500"
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Transaction date
                                </label>

                                <input
                                    type="date"
                                    name="transactionDate"
                                    value={form.transactionDate}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Description
                                </label>

                                <input
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="e.g. Apartment Rent"
                                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Optional notes..."
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Add Transaction
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

export default TransactionForm;