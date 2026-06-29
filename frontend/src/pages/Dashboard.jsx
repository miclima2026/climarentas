import { useEffect, useState } from "react";
import { rentalsApi } from "../lib/api";
import RentalCard from "../components/RentalCard";
import { fmtCurrency, fmtDateLong } from "../lib/format";
import { AlertTriangle, PackageOpen, TrendingUp, CalendarCheck, Truck, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StatCard = ({ label, value, icon: Icon, color = "indigo", testid }) => (
  <div data-testid={testid} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
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
  const [today, setToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [t, u, s] = await Promise.all([
        rentalsApi.today(),
        rentalsApi.upcoming(7),
        rentalsApi.stats(),
      ]);
      setToday(t);
      setUpcoming(u);
      setStats(s);
    } catch (e) {
      toast.error("No se pudieron cargar las rentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (rental) => {
    if (!confirm(`¿Eliminar la renta de ${rental.client_name}?`)) return;
    try {
      await rentalsApi.remove(rental.id);
      toast.success("Renta eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const overdue = upcoming.filter((r) => r.status === "atrasado");
  const upcomingFiltered = upcoming.filter((r) => r.status !== "atrasado");

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
        <div
          data-testid="overdue-alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
        >
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
          label="Entregas hoy"
          value={stats?.today_deliveries ?? 0}
          icon={Truck}
          color="indigo"
          testid="stat-today-deliveries"
        />
        <StatCard
          label="Devoluciones hoy"
          value={stats?.today_returns ?? 0}
          icon={Undo2}
          color="amber"
          testid="stat-today-returns"
        />
        <StatCard
          label="En progreso"
          value={stats?.by_status?.en_progreso ?? 0}
          icon={CalendarCheck}
          color="emerald"
          testid="stat-active"
        />
        <StatCard
          label="Ingresos del mes"
          value={fmtCurrency(stats?.monthly_revenue ?? 0)}
          icon={TrendingUp}
          color="sky"
          testid="stat-monthly-revenue"
        />
      </div>

      {/* Today */}
      <section data-testid="today-section">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hoy
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {today.length} {today.length === 1 ? "evento" : "eventos"}
          </span>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : today.length === 0 ? (
          <EmptyState
            title="Sin movimientos hoy"
            subtitle="Aprovecha para registrar futuras rentas."
            onClick={() => navigate("/renta/nueva")}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {today.map((r) => (
              <RentalCard key={r.id} rental={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section data-testid="upcoming-section">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Próximas entregas
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Próximos 7 días
          </span>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : upcomingFiltered.length === 0 ? (
          <EmptyState
            title="No hay próximas entregas"
            subtitle="Tu agenda está despejada por ahora."
            onClick={() => navigate("/renta/nueva")}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingFiltered.slice(0, 6).map((r) => (
              <RentalCard key={r.id} rental={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, subtitle, onClick }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 grid place-items-center mx-auto">
        <PackageOpen className="w-7 h-7" />
      </div>
      <div className="mt-3 font-bold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500">{subtitle}</div>
      <button
        data-testid="empty-new-rental"
        onClick={onClick}
        className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
      >
        Registrar renta
      </button>
    </div>
  );
}
