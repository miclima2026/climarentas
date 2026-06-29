import { useEffect, useMemo, useState } from "react";
import { rentalsApi } from "../lib/api";
import RentalCard from "../components/RentalCard";
import { Search, PackageOpen } from "lucide-react";
import { toast } from "sonner";

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "en_progreso", label: "En progreso" },
  { id: "atrasado", label: "Atrasadas" },
  { id: "terminado", label: "Terminadas" },
];

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await rentalsApi.list();
      setRentals(data);
    } catch {
      toast.error("Error al cargar rentas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

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

  const filtered = useMemo(() => {
    return rentals.filter((r) => {
      if (filter !== "todas" && r.status !== filter) return false;
      if (q && !r.client_name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rentals, filter, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
          Todas las rentas
        </h1>
        <p className="text-sm text-slate-500 mt-1">Consulta, filtra y administra cada renta.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          data-testid="search-input"
          type="text"
          placeholder="Buscar por cliente..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            data-testid={`filter-${f.id}`}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              filter === f.id
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 grid place-items-center mx-auto">
            <PackageOpen className="w-7 h-7" />
          </div>
          <div className="mt-3 font-bold text-slate-900">Sin resultados</div>
          <div className="text-sm text-slate-500">Cambia el filtro o registra una nueva renta.</div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <RentalCard key={r.id} rental={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
