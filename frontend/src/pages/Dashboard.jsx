import { useEffect, useState } from "react";
import { rentalsApi, expensesApi } from "../lib/api";
import RentalCard from "../components/RentalCard";
import { fmtCurrency, fmtDateLong } from "../lib/format";
import { AlertTriangle, PackageOpen, TrendingUp, Truck, Wallet, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StatCard = ({ label, value, icon: Icon, color = "indigo", testid, onClick }) => (
  <div
    data-testid={testid}
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
  >
    <div className="flex items-center justify-between">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
      <div className={`w-9 h-9 rounded-xl bg-${color}-100 text-${color}-600 grid place-items-center`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  const [savingExpense, setSavingExpense] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [u, s, e] = await Promise.all([
        rentalsApi.upcoming(7),
        rentalsApi.stats(),
        expensesApi.list(),
      ]);
      setUpcoming(u);
      setStats(s);
      setExpenses(e);
    } catch {
      toast.error("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (rental) => {
    if (!window.confirm(`¿Eliminar la renta de ${rental.client_name}?`)) return;
    try {
      await rentalsApi.remove(rental.id);
      toast.success("Renta eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim()) return toast.error("Falta la descripción");
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return toast.error("Monto inválido");
    try {
      setSavingExpense(true);
      await expensesApi.create({ ...expenseForm, amount: Number(expenseForm.amount) });
      toast.success("Gasto registrado");
      setExpenseForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
      setShowExpenseForm(false);
      load();
    } catch {
      toast.error("Error al guardar gasto");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await expensesApi.remove(id);
      toast.success("Gasto eliminado");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const overdue = upcoming.filter((r) => r.status === "atrasado");
  const upcomingFiltered = upcoming.filter((r) => r.status !== "atrasado");

  // Gastos del mes actual
  const now = new Date();
  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div data-testid="dashboard-greeting">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {fmtDateLong(new Date().toISOString())}
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 mt-1">
          Hola, <span className="text-indigo-600">aquí está tu día.</span>
        </h1>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div data-testid="overdue-alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 grid place-items-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-900">
              Tienes {overdue.length} {overdue.length === 1 ? "renta atrasada" : "rentas atrasadas"}
            </div>
            <div className="text-sm text-red-700">Revísalas para coordinar la devolución.</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Entregas del mes"
          value={stats?.monthly_deliveries ?? 0}
          icon={Truck}
          color="indigo"
          testid="stat-monthly-deliveries"
        />
        <StatCard
          label="Entregas pendientes"
          value={stats?.by_status?.pendiente ?? 0}
          icon={ClipboardList}
          color="emerald"
          testid="stat-pending"
        />
        <StatCard
          label="Gastos del mes"
          value={fmtCurrency(stats?.monthly_expenses ?? 0)}
          icon={Wallet}
          color="red"
          testid="stat-expenses"
          onClick={() => setShowExpenseForm(!showExpenseForm)}
        />
        <StatCard
          label="Ingresos del mes"
          value={fmtCurrency(stats?.monthly_revenue ?? 0)}
          icon={TrendingUp}
          color="sky"
          testid="stat-monthly-revenue"
        />
      </div>

      {/* Expense form */}
      {showExpenseForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Registrar gasto</h2>
            <button onClick={() => setShowExpenseForm(false)} className="text-xs text-slate-500 hover:text-slate-800">Cerrar</button>
          </div>
          <form onSubmit={handleExpenseSubmit} className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 block">Descripción *</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ej. Gasolina"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 block">Monto (MXN) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="150"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 block">Fecha *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={savingExpense}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {savingExpense ? "Guardando..." : "Guardar gasto"}
              </button>
            </div>
          </form>

          {/* Expense list this month */}
          {monthlyExpenses.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gastos este mes</div>
              {monthlyExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{e.description}</div>
                    <div className="text-xs text-slate-500">{e.date?.slice(0, 10)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-red-600">{fmtCurrency(e.amount)}</div>
                    <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      <section data-testid="upcoming-section">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Próximas entregas</h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Próximos 7 días</span>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : upcomingFiltered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 grid place-items-center mx-auto">
              <PackageOpen className="w-7 h-7" />
            </div>
            <div className="mt-3 font-bold text-slate-900">No hay próximas entregas</div>
            <div className="text-sm text-slate-500">Tu agenda está despejada por ahora.</div>
            <button
              data-testid="empty-new-rental"
              onClick={() => navigate("/renta/nueva")}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
            >
              Registrar renta
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingFiltered.map((r) => (
              <RentalCard key={r.id} rental={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
