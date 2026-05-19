import type { ProductConfig } from '../data/mockData';

interface Props {
  data: ProductConfig;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">{label}</label>
      <select
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        defaultValue={value}
      >
        <option>{value}</option>
      </select>
    </div>
  );
}

export default function FilterSidebar({ data }: Props) {
  return (
    <aside className="w-48 flex-shrink-0">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Filtrar Por</p>
        <Field label="Localidad" value={data.localidad} />
        <Field label="Construcción" value={data.construccion} />
        <Field label="Tamaño" value={data.tamano} />
        <Field label="ID Producto" value={data.idProducto} />

        <div className="mb-4">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Kilos</label>
          <input
            type="number"
            defaultValue={data.kilos}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="border-t border-gray-100 pt-3 mt-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Materia Prima</p>
          {data.materiaPrima.map((mp, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: mp.color }} />
                <span>{mp.nombre}</span>
              </div>
              <span className="font-semibold">{mp.kg.toLocaleString()} kg</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-bold text-gray-700 border-t border-gray-100 pt-1.5 mt-1">
            <span>Total</span>
            <span>{data.kilos.toLocaleString()} kg</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 mt-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rendimiento</p>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between"><span>KG / MIN</span><span className="font-semibold">{data.rendimiento.kgMin}</span></div>
            <div className="flex justify-between"><span>MIN / KG</span><span className="font-semibold">{data.rendimiento.minKg}</span></div>
            <div className="flex justify-between"><span>MIN Totales</span><span className="font-semibold">{data.rendimiento.minTotales.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
