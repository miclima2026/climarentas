import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rentalsApi } from "../lib/api";
import { Flame, Snowflake, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow";
const LABEL = "text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block";

const defaultDate = () => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const calcEndDate = (startIso, hours, minutes) => {
  const start = new Date(startIso);
  const totalMinutes = (parseInt(hours) || 0) * 60 + (minutes ? 30 : 0);
  if (totalMinutes <= 0) return new Date(start.getTime() + 60 * 60000).toISOString();
  return new Date(start.getTime() + totalMinutes * 60000).toISOString();
};

const openGoogleMaps = (address) => {
  if (!address.trim()) {
    toast.error("Escribe una dirección primero");
    return;
  }
  const query = encodeURIComponent(address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
};

export default function RentalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    phone: "",
    location: "",
    product_type: "calenton",
    product_model: "",
    cost: "",
    start_date: defaultDate(),
    status: "pendiente",
    notes: "",
  });
  const [hours, setHours] = useState("1");
  const [halfHour, setHalfHour] = useState(false);

  useEffect(() => {
    if (!editing) return;
    rentalsApi
      .get(id)
      .then((r) => {
        setForm({
          ...r,
          start_date: toLocalInput(r.start_date),
          cost: r.cost,
        });
        // Intentar calcular duración desde start y end
        if (r.start_date && r.end_date) {
          const diff = (new Date(r.end_date) - new Date(r.start_date)) / 60000;
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          setHours(String(h));
          setHalfHour(m >= 30);
        }
      })
      .catch(() => {
        toast.error("Renta no encontrada");
        navigate("/rentas");
      });
  }, [id, editing, navigate]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) return toast.error("Falta el nombre del cliente");
    if (!form.location.trim()) return toast.error("Falta la ubicación");
    if (!form.product_model.trim()) return toast.error("Falta el modelo");
    if (!form.cost || Number(form.cost) <= 0) return toast.error("Costo inválido");
    if (!hours || (parseInt(hours) === 0 && !halfHour)) return toast.error("Ingresa la duración de la renta");

    const end_date = calcEndDate(form.start_date, hours, halfHour);

    const payload = {
      ...form,
      cost: Number(form.cost),
      start_date: new Date(form.start_date).toISOString(),
      end_date,
    };

    try {
      setSaving(true);
      if (editing) {
        await rentalsApi.update(id, payload);
        toast.success("Renta actualizada");
      } else {
        await rentalsApi.create(payload);
        toast.success("Renta registrada");
      }
      navigate("/rentas");
    } catch (err) {
      const msg = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || err.message || "Error al guardar"; toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
          {editing ? "Editar renta" : "Nueva renta"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Captura los datos del cliente y la programación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">

        {/* Product type toggle */}
        <div>
          <label className={LABEL}>Tipo de producto</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="product-type-calenton"
              onClick={() => update("product_type", "calenton")}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                form.product_type === "calenton"
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 grid place-items-center">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900">Calentón</div>
                <div className="text-xs text-slate-500">Portátil</div>
              </div>
            </button>
            <button
              type="button"
              data-testid="product-type-cooler"
              onClick={() => update("product_type", "cooler")}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                form.product_type === "cooler"
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 grid place-items-center">
                <Snowflake className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900">Cooler</div>
                <div className="text-xs text-slate-500">Portátil</div>
              </div>
            </button>
          </div>
        </div>

        {/* Cliente y teléfono */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Nombre del cliente *</label>
            <input
              data-testid="input-client-name"
              type="text"
              value={form.client_name}
              onChange={(e) => update("client_name", e.target.value)}
              placeholder="Juan Pérez"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Teléfono</label>
            <input
              data-testid="input-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="555 123 4567"
              className={FIELD}
            />
          </div>
        </div>

        {/* Ubicación con botón Google Maps */}
        <div>
          <label className={LABEL}>Ubicación / dirección *</label>
          <div className="flex gap-2">
            <input
              data-testid="input-location"
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Calle, número, colonia, ciudad"
              className={FIELD}
            />
            <button
              type="button"
              onClick={() => openGoogleMaps(form.location)}
              className="shrink-0 w-12 h-12 mt-0.5 rounded-xl bg-green-500 hover:bg-green-600 text-white grid place-items-center transition-colors shadow-sm"
              title="Abrir en Google Maps"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Presiona el pin 📍 para ver la ubicación en Google Maps.</p>
        </div>

        {/* Modelo y costo */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Modelo *</label>
            <input
              data-testid="input-model"
              type="text"
              value={form.product_model}
              onChange={(e) => update("product_model", e.target.value)}
              placeholder="Ej. Calentón 5000W"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Costo de renta (MXN) *</label>
            <input
              data-testid="input-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => update("cost", e.target.value)}
              placeholder="350"
              className={FIELD}
            />
          </div>
        </div>

        {/* Fecha de entrega */}
        <div>
          <label className={LABEL}>Fecha y hora de entrega *</label>
          <input
            data-testid="input-start-date"
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => update("start_date", e.target.value)}
            className={FIELD}
          />
        </div>

        {/* Duración */}
        <div>
          <label className={LABEL}>Duración de la renta *</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                data-testid="input-hours"
                type="number"
                min="0"
                max="72"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
              />
              <span className="text-sm font-semibold text-slate-600">horas</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setHalfHour(!halfHour)}
                className={`w-12 h-6 rounded-full transition-colors relative ${halfHour ? "bg-indigo-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${halfHour ? "translate-x-7" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-semibold text-slate-700">+ 30 min</span>
            </label>
          </div>
          {(parseInt(hours) > 0 || halfHour) && (
            <p className="text-xs text-indigo-600 font-semibold mt-1.5">
              Duración: {parseInt(hours) || 0}h {halfHour ? "30min" : ""}
            </p>
          )}
        </div>

        {/* Estado (solo edición) */}
        {editing && (
          <div>
            <label className={LABEL}>Estado</label>
            <select
              data-testid="select-status"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className={FIELD}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="terminado">Terminado</option>
              <option value="atrasado">Atrasado</option>
            </select>
            <div className="text-xs text-slate-500 mt-1.5">
              Marca "Terminado" cuando se devuelva el producto.
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className={LABEL}>Notas</label>
          <textarea
            data-testid="input-notes"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Detalles adicionales..."
            rows={3}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            data-testid="form-submit-button"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition-colors"
          >
            {saving ? "Guardando..." : editing ? "Actualizar renta" : "Guardar renta"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="sm:w-auto py-3.5 px-6 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
