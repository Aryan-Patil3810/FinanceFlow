
import { useEffect, useState } from "react";
import { X, CreditCard, Wallet, Landmark } from "lucide-react";

const PAYMENT_TYPES = [
  { value: "CASH", label: "Cash", icon: Wallet },
  { value: "DEBIT_CARD", label: "Debit Card", icon: CreditCard },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
  { value: "ACH", label: "ACH Transfer", icon: Landmark },
  { value: "DIGITAL_WALLET", label: "Digital Wallet", icon: Wallet },
  { value: "OTHER", label: "Other", icon: CreditCard },
];

function PaymentMethodForm({
  paymentMethod,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState("");
  const [methodType, setMethodType] = useState("CREDIT_CARD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (paymentMethod) {
      setName(paymentMethod.name || "");
      setMethodType(paymentMethod.methodType || "CREDIT_CARD");
    }
  }, [paymentMethod]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a payment method name.");
      return;
    }

    try {
      setSaving(true);

      await onSubmit({
        name: name.trim(),
        methodType,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save payment method."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {paymentMethod ? "Edit Payment Method" : "Add Payment Method"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage how you pay for transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Payment Method Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Sapphire Preferred"
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Payment Type
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PAYMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = methodType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMethodType(type.value)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                      selected
                        ? "border-slate-900 bg-slate-50 text-slate-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : paymentMethod
                  ? "Save Changes"
                  : "Create Payment Method"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentMethodForm;
