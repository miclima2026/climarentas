import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rentalsApi } from "../lib/api";
import { Flame, Snowflake, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow";
const LABEL = "text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block";

const defaultDate = () => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const addHours = (h) => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + h);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
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
    end_date: addHours(24),
    status: "pendiente",
    notes: "",
  });

  useEffect(() => {
    if (!editing) return;
    rentalsApi
      .get(id)
      .then((r) =>
        setForm({
          ...r,
          start_date: toLocalInput(r.start_date),
          end_date: toLocalInput(r.end_date),
          cost: r.cost,
        }),
      )
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
    if (new Date(form.end_date) <= new Date(form.start_date))
      return toast.error("La devolución debe ser después de la entrega");

    const payload = {
      ...form,
      cost: Number(form.cost),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
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
    } catch {
      toast.error("Error al guardar");
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

        <div>
          <label className={LABEL}>Ubicación / dirección *</label>
          <input
            data-testid="input-location"
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Calle, número, colonia, ciudad"
            className={FIELD}
          />
        </div>

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

        <div className="grid sm:grid-cols-2 gap-4">
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
          <div>
            <label className={LABEL}>Fecha y hora de devolución *</label>
            <input
              data-testid="input-end-date"
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

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
