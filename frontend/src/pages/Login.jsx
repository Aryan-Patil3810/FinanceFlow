
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Wallet, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { login as loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(formData);
      login(response);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fc] flex items-center justify-center p-4 lg:p-8">

      <div className="w-full max-w-6xl min-h-[650px] bg-white rounded-3xl shadow-2xl shadow-slate-200/70 overflow-hidden grid lg:grid-cols-2">

        {/* LEFT BRAND PANEL */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#101b35] p-12 text-white">

          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10">
            <Link to="/login" className="inline-block">
  <img
    src="/financefloww-logo.png"
    alt="FinanceFlow"
    className="h-14 w-auto max-w-[280px] object-contain object-left"
  />
</Link>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
              <ShieldCheck size={16} />
              Your finances, organized
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Take control of your money.
              <span className="text-blue-400"> Build your future.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              One place to manage your accounts, track spending,
              plan payments and make smarter financial decisions.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Stay organized</p>
                <p className="mt-2 font-semibold">All finances in one place</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Plan ahead</p>
                <p className="mt-2 font-semibold">Know what's coming next</p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-sm text-slate-400">
            © {new Date().getFullYear()} FinanceFlow. All rights reserved.
          </p>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">

          <div className="w-full max-w-md">

            <Link to="/login" className="mb-12 inline-flex items-center gap-2 lg:hidden">
              <div className="rounded-xl bg-blue-600 p-2 text-white">
                <Wallet size={22} />
              </div>
              <span className="text-xl font-bold text-slate-900">
                FinanceFlow
              </span>
            </Link>

            <div className="mb-9">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-slate-500">
                Enter your details to access your financial dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={19} />}
              </button>

            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Create an account
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Secure access to your financial workspace
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;