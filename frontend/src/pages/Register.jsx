
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Wallet,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  register as registerUser,
  login as loginUser,
} from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    baseCurrency: "USD",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const passwordChecks = [
    formData.password.length >= 8,
    /[A-Z]/.test(formData.password),
    /[0-9]/.test(formData.password),
  ];

  const passwordScore = passwordChecks.filter(Boolean).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions to create your account.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        baseCurrency: formData.baseCurrency,
      });

      const loginResponse = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      login(loginResponse);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-screen bg-[#f5f7fc] px-4 py-8 sm:px-8">

      <div className="mx-auto max-w-6xl">

        {/* BRAND */}
        <div className="mb-8 flex items-center justify-between">
          <img
  src="/financefloww-logo.png"
  alt="FinanceFlow"
  className="h-14 w-auto max-w-[280px] object-contain object-left"
/>

          <p className="hidden text-sm text-slate-500 sm:block">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>

        <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.85fr_1.15fr]">

          {/* LEFT PANEL */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101b35] p-10 text-white lg:flex">

            <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
                <ShieldCheck size={16} />
                Your financial journey starts here
              </div>
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl font-bold leading-tight">
                Make your money work smarter.
              </h1>

              <p className="mt-5 leading-relaxed text-slate-300">
                Organize your accounts, understand your spending
                and stay ahead of your upcoming payments with FinanceFlow.
              </p>

              <div className="mt-9 space-y-5">
                {[
                  "Track income and expenses",
                  "Manage multiple accounts",
                  "Plan recurring payments",
                  "Understand your financial activity",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 size={19} className="shrink-0 text-blue-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="relative z-10 text-xs text-slate-400">
              © {new Date().getFullYear()} FinanceFlow
            </p>
          </div>

          {/* REGISTER FORM */}
          <div className="p-6 sm:p-10 lg:p-12">

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
                Get started
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Set up your personal financial workspace in a few steps.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* NAME */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelClass}>
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    placeholder="John"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className={labelClass}>
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    placeholder="Doe"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="john@example.com"
                  className={inputClass}
                />
              </div>

              {/* CURRENCY */}
              <div>
                <label htmlFor="baseCurrency" className={labelClass}>
                  Preferred base currency
                </label>
                <select
                  id="baseCurrency"
                  name="baseCurrency"
                  value={formData.baseCurrency}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                </select>
              </div>

              {/* PASSWORD */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-3">
                    <div className="mb-2 flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${passwordScore >= level
                              ? "bg-blue-500"
                              : "bg-slate-200"
                            }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-slate-500">
                      {passwordScore === 3
                        ? "Good password strength"
                        : "Use at least 8 characters, one uppercase letter and one number."}
                    </p>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* TERMS AND CONDITIONS */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="acceptedTerms"
                  name="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  aria-required="true"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500"
                />

                <label
                  htmlFor="acceptedTerms"
                  className="cursor-pointer text-sm leading-relaxed text-slate-600"
                >
                  I have read and agree to the{" "}
                  <span className="font-semibold text-blue-600">
                    Terms and Conditions
                  </span>
                  {" "}and{" "}
                  <span className="font-semibold text-blue-600">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>


              {/* ERROR */}
              {error && (
                <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create Account"}
                {!loading && <ArrowRight size={19} />}
              </button>

            </form>

            <p className="mt-7 text-center text-sm text-slate-500 lg:hidden">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-blue-600">
                Sign in
              </Link>
            </p>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Your financial workspace starts here
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;