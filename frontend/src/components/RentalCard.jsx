import { Flame, Snowflake, MapPin, Clock, Phone, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { fmtCurrency, fmtRelative, STATUS_LABELS, STATUS_STYLES, PRODUCT_LABELS } from "../lib/format";
import { useNavigate } from "react-router-dom";

export default function RentalCard({ rental, onDelete, compact = false }) {
  const navigate = useNavigate();
  const isHeater = rental.product_type === "calenton";
  const accent = isHeater
    ? "border-l-orange-400 bg-orange-50/40"
    : "border-l-sky-400 bg-sky-50/40";
  const iconBg = isHeater ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600";

  return (
    <div
      data-testid={`rental-card-${rental.id}`}
      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accent} p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${iconBg}`}>
          {isHeater ? <Flame className="w-5 h-5" /> : <Snowflake className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 truncate" data-testid="rental-client-name">
                {rental.client_name}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {PRODUCT_LABELS[rental.product_type]} · {rental.product_model}
              </div>
            </div>
            <Badge
              data-testid="rental-card-status"
              variant="outline"
              className={`${STATUS_STYLES[rental.status]} font-bold text-[10px] uppercase tracking-wider px-2 py-1 shrink-0`}
            >
              {STATUS_LABELS[rental.status]}
            </Badge>
          </div>

          {!compact && (
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="break-words">{rental.location}</span>
              </div>
              {rental.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${rental.phone}`} className="hover:text-indigo-700">
                    {rental.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  <span className="font-semibold text-slate-700">Entrega:</span> {fmtRelative(rental.start_date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <span>
                  <span className="font-semibold text-slate-700">Devolución:</span> {fmtRelative(rental.end_date)}
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-lg font-black text-slate-900 tracking-tight">
              {fmtCurrency(rental.cost)}
            </div>
            <div className="flex items-center gap-1">
              <button
                data-testid={`edit-rental-${rental.id}`}
                onClick={() => navigate(`/renta/${rental.id}/editar`)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  data-testid={`delete-rental-${rental.id}`}
                  onClick={() => onDelete(rental)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
