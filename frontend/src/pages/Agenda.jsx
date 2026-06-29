import { useEffect, useMemo, useState } from "react";
import { Calendar } from "../components/ui/calendar";
import { rentalsApi } from "../lib/api";
import RentalCard from "../components/RentalCard";
import { es } from "date-fns/locale";
import { format, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { CalendarX } from "lucide-react";

export default function Agenda() {
  const [rentals, setRentals] = useState([]);
  const [selected, setSelected] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await rentalsApi.list();
      setRentals(data);
    } catch {
      toast.error("Error al cargar agenda");
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

  // Build set of dates with rentals (either start or end day)
  const rentalDates = useMemo(() => {
    const set = new Set();
    rentals.forEach((r) => {
      try {
        set.add(format(parseISO(r.start_date), "yyyy-MM-dd"));
        set.add(format(parseISO(r.end_date), "yyyy-MM-dd"));
      } catch {}
    });
    return set;
  }, [rentals]);

  const dayRentals = useMemo(() => {
    if (!selected) return [];
    return rentals.filter((r) => {
      try {
        return (
          isSameDay(parseISO(r.start_date), selected) ||
          isSameDay(parseISO(r.end_date), selected)
        );
      } catch {
        return false;
      }
    });
  }, [rentals, selected]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
          Agenda
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona un día para ver entregas y devoluciones.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            locale={es}
            className="w-full"
            modifiers={{
              hasRental: (date) => rentalDates.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasRental: "has-rental font-bold text-indigo-700",
            }}
            data-testid="agenda-calendar"
          />
          <div className="px-3 pb-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Día con rentas programadas
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {selected ? format(selected, "EEEE d 'de' MMMM, yyyy", { locale: es }) : "Selecciona un día"}
          </div>
          {loading ? (
            <div className="text-sm text-slate-500">Cargando...</div>
          ) : dayRentals.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                <CalendarX className="w-7 h-7" />
              </div>
              <div className="mt-3 font-bold text-slate-900">Sin movimientos este día</div>
              <div className="text-sm text-slate-500">Elige otro día en el calendario.</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {dayRentals.map((r) => (
                <RentalCard key={r.id} rental={r} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
