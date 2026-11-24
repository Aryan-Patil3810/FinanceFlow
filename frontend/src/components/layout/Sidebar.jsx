import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    WalletCards,
    ArrowLeftRight,
    Tags,
    CalendarClock,
    Repeat2,
    Settings,
    X,
    CircleDollarSign,
    ChevronRight,
    CreditCard,
} from "lucide-react";

const navigation = [
    {
        section: "OVERVIEW",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/", },
        ],
    },
    {
        section: "MONEY",
        items: [
            { label: "Accounts", icon: WalletCards, path: "/accounts" },
            { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
            { label: "Payment Methods", icon: CreditCard, path: "/payment-methods" },
        ],
    },
    {
        section: "PLANNING",
        items: [
            { label: "Categories", icon: Tags, path: "/categories" },
            { label: "Recurring", icon: CalendarClock, path: "/recurring" },
        ],
    },
    {
        section: "TRANSFERS",
        items: [
            { label: "Transfers", icon: Repeat2, path: "/transfers" },
        ],
    },
];

function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col
          border-r border-slate-200/80 bg-white
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                {/* Brand */}
                <div className="flex h-[76px] items-center justify-between px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <CircleDollarSign size={20} strokeWidth={2} />
                        </div>

                        <div>
                            <p className="text-[15px] font-bold tracking-tight text-slate-900">
                                FinanceFlow
                            </p>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Personal Finance
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    {navigation.map((group) => (
                        <div key={group.section} className="mb-6">
                            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-slate-400">
                                {group.section}
                            </p>

                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = item.label === "Dashboard";

                                    return (
                                        <NavLink
                                            key={item.label}
                                            to={item.path}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `
    group flex w-full items-center justify-between
    rounded-lg px-3 py-2.5
    text-[13px] font-medium transition-all
    ${isActive
                                                    ? "bg-slate-900 text-white"
                                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                }
    `
                                            }
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon size={17} strokeWidth={1.8} />
                                                {item.label}
                                            </span>

                                            <ChevronRight
                                                size={14}
                                                className="opacity-60"
                                            />
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>


                {/* Bottom */}
                <div className="border-t border-slate-100 p-3">
                    <NavLink
                        to="/settings"
                        onClick={onClose}
                        className={({ isActive }) =>
                            `
            flex w-full items-center gap-3 rounded-lg px-3 py-2.5
            text-[13px] font-medium transition-all
            ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }
            `
                        }
                    >
                        <Settings size={17} strokeWidth={1.8} />
                        Settings
                    </NavLink>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3.5">
                        <p className="text-xs font-semibold text-slate-700">
                            Your finances, simplified.
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                            Track, plan and understand your money.
                        </p>
                    </div>
                </div>

            </aside>
        </>
    );
}

export default Sidebar;