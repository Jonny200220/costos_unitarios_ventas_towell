import type { ProductConfig } from '../data/mockData';

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function KpiCards({ data }: { data: ProductConfig }) {
  const varPct = ((data.costoVariable / data.costoTotal) * 100).toFixed(1);
  const fijoPct = ((data.costoFijo / data.costoTotal) * 100).toFixed(1);
  const cuVar = (data.costoVariable / data.kilos).toFixed(2);
  const cuFijo = (data.costoFijo / data.kilos).toFixed(2);
  const cuTotal = (data.costoTotal / data.kilos).toFixed(2);

  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Costo Variable</p>
        <p className="text-2xl font-bold text-gray-800">{fmt(data.costoVariable)}</p>
        <p className="text-xs text-gray-500 mt-1">${cuVar} / kg · {varPct}%</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Costo Fijo</p>
        <p className="text-2xl font-bold text-gray-800">{fmt(data.costoFijo)}</p>
        <p className="text-xs text-gray-500 mt-1">${cuFijo} / kg · {fijoPct}%</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Costo Total</p>
        <p className="text-2xl font-bold text-gray-800">{fmt(data.costoTotal)}</p>
        <p className="text-xs text-gray-500 mt-1">${cuTotal} / kg · {data.kilos.toLocaleString()} kg</p>
      </div>
      <div className="bg-[#1e2a5e] rounded-lg p-4 shadow-sm text-white">
        <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Costo Unitario / KG</p>
        <p className="text-2xl font-bold">${cuTotal}</p>
        <p className="text-xs text-blue-200 mt-1">Var ${cuVar} · Fijo ${cuFijo}</p>
      </div>
    </div>
  );
}
