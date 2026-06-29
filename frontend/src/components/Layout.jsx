import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, CalendarDays, List, Plus, Flame } from "lucide-react";
import { Toaster } from "../components/ui/sonner";

const navItems = [
  { to: "/", label: "Inicio", icon: Home, testid: "nav-inicio" },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, testid: "nav-agenda" },
  { to: "/rentas", label: "Rentas", icon: List, testid: "nav-rentas" },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      {/* Top bar - desktop */}
      <header className="hidden sm:block bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight">ClimaRentas</div>
              <div className="text-xs text-slate-500">Gestión de rentas</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <n.icon className="w-4 h-4" /> {n.label}
                </span>
              </NavLink>
            ))}
            <button
              data-testid="header-new-rental-btn"
              onClick={() => navigate("/renta/nueva")}
              className="ml-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva renta
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile header */}
      <header className="sm:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-slate-900 tracking-tight">ClimaRentas</div>
            <div className="text-xs text-slate-500">Gestión de rentas</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <Outlet />
      </main>

      {/* FAB mobile */}
      <button
        data-testid="fab-new-rental"
        onClick={() => navigate("/renta/nueva")}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 grid place-items-center active:scale-95 transition-transform"
        aria-label="Nueva renta"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom nav - mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200">
        <div className="grid grid-cols-3">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              data-testid={`${n.testid}-mobile`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold ${
                  isActive ? "text-indigo-700" : "text-slate-500"
                }`
              }
            >
              <n.icon className="w-5 h-5" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Toaster richColors position="top-center" />
    </div>
  );
}
