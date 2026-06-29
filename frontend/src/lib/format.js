import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const fmtCurrency = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n || 0));

export const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "d MMM, HH:mm", { locale: es });
  } catch {
    return iso;
  }
};

export const fmtDateLong = (iso) => {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "EEEE d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return iso;
  }
};

export const fmtRelative = (iso) => {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    if (isToday(d)) return `Hoy · ${format(d, "HH:mm")}`;
    if (isTomorrow(d)) return `Mañana · ${format(d, "HH:mm")}`;
    if (isPast(d)) return `Atrasado · ${format(d, "d MMM", { locale: es })}`;
    return format(d, "EEE d MMM · HH:mm", { locale: es });
  } catch {
    return iso;
  }
};

export const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  terminado: "Terminado",
  atrasado: "Atrasado",
};

export const STATUS_STYLES = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  en_progreso: "bg-emerald-100 text-emerald-800 border-emerald-200",
  terminado: "bg-slate-100 text-slate-700 border-slate-200",
  atrasado: "bg-red-100 text-red-800 border-red-200",
};

export const PRODUCT_LABELS = {
  calenton: "Calentón",
  cooler: "Cooler",
};
