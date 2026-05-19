import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Plus, X, Star } from 'lucide-react';
import { FLETES_SOLO_URDIDO, FLETES_URDIDO_ENGOMADO, type ProductConfig } from '../data/mockData';

const AVAILABLE_PRODUCTS: ProductConfig[] = [FLETES_SOLO_URDIDO, FLETES_URDIDO_ENGOMADO];
const PRODUCT_COLORS = ['#4C9EEB', '#F97316', '#8B5CF6', '#10B981'];

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function DonutCard({ product, index, onRemove, isBest }: {
  product: ProductConfig;
  index: number;
  onRemove: () => void;
  isBest: boolean;
}) {
  const composicion = [
    { name: 'Variable', value: product.costoVariable },
    { name: 'Fijo', value: product.costoFijo },
  ];
  const varPct = ((product.costoVariable / product.costoTotal) * 100).toFixed(1);
  const fijoPct = ((product.costoFijo / product.costoTotal) * 100).toFixed(1);

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-2 flex-1 min-w-[280px] ${isBest ? 'border-blue-400' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: PRODUCT_COLORS[index] }} />
          <span className="font-semibold text-gray-700">Producto {index + 1}</span>
          {isBest && (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              <Star size={10} /> Mejor
            </span>
          )}
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Artículo</label>
        <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option>{product.idProducto}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Calibre</label>
          <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 focus:outline-none">
            <option>16/1</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Kilos</label>
          <input type="number" defaultValue={product.kilos} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 focus:outline-none" />
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Costo Variable</span>
          <span>{fmt(product.costoVariable)}</span>
        </div>
        <div className="flex justify-between">
          <span>Costo Fijo</span>
          <span>{fmt(product.costoFijo)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-1 mt-1">
          <span>Costo Total</span>
          <span>{fmt(product.costoTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Cu. / kg</span>
          <span className={`font-semibold ${isBest ? 'text-blue-500' : 'text-orange-500'}`}>
            ${product.costoUnitario.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-3">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={composicion} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
              dataKey="value" startAngle={90} endAngle={-270}>
              <Cell fill="#4C9EEB" />
              <Cell fill="#F97316" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4C9EEB]" />
            Variable
            <span className="font-semibold text-gray-800">{fmt(product.costoVariable)}</span>
            <span className="text-gray-400">{varPct}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            Fijo
            <span className="font-semibold text-gray-800">{fmt(product.costoFijo)}</span>
            <span className="text-gray-400">{fijoPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comparador() {
  const [products, setProducts] = useState<ProductConfig[]>([FLETES_SOLO_URDIDO, FLETES_URDIDO_ENGOMADO]);
  const [viewMode, setViewMode] = useState<'solo' | 'engomado'>('solo');

  const bestIdx = products.reduce((bi, p, i) => p.costoUnitario < products[bi].costoUnitario ? i : bi, 0);

  function addProduct() {
    if (products.length < 4) {
      setProducts(p => [...p, AVAILABLE_PRODUCTS[p.length % AVAILABLE_PRODUCTS.length]]);
    }
  }

  function removeProduct(i: number) {
    setProducts(p => p.filter((_, idx) => idx !== i));
  }

  const barData = products[0]?.rows
    .filter(r => r.tipo === 'Variable' || r.tipo === 'Fijo')
    .map(r => {
      const entry: Record<string, number | string> = { concepto: r.concepto };
      products.forEach((p, pi) => {
        const row = p.rows.find(rr => rr.concepto === r.concepto);
        entry[`P${pi + 1}`] = row ? row.importe : 0;
      });
      return entry;
    });

  return (
    <div className="p-5">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={addProduct}
            className="flex items-center gap-1.5 bg-[#1e2a5e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <Plus size={14} /> Agregar producto
          </button>
          <span className="text-sm text-gray-400">Máximo 4 productos</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('solo')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'solo' ? 'bg-[#1e2a5e] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            Solo Urdido
          </button>
          <button
            onClick={() => setViewMode('engomado')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'engomado' ? 'bg-[#1e2a5e] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            + Engomado
          </button>
        </div>
      </div>

      {/* Product cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {products.map((p, i) => (
          <DonutCard key={i} product={p} index={i} isBest={i === bestIdx} onRemove={() => removeProduct(i)} />
        ))}
      </div>

      {/* Variable vs Fijo distribution */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Variable vs Fijo · Distribución por producto</h3>
        <div className="flex gap-4 flex-wrap">
          {products.map((p, i) => {
            const composicion = [
              { name: 'Variable', value: p.costoVariable },
              { name: 'Fijo', value: p.costoFijo },
            ];
            const varPct = ((p.costoVariable / p.costoTotal) * 100).toFixed(1);
            const fijoPct = ((p.costoFijo / p.costoTotal) * 100).toFixed(1);
            return (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 min-w-[240px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">P{i + 1} · {p.idProducto.split('—')[1]?.trim() ?? p.idProducto}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={composicion} cx="50%" cy="50%" innerRadius={38} outerRadius={55}
                          dataKey="value" startAngle={90} endAngle={-270}>
                          <Cell fill="#4C9EEB" />
                          <Cell fill="#F97316" />
                        </Pie>
                        <Tooltip formatter={(v: number) => [fmt(v), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold text-gray-800">${p.costoUnitario.toFixed(2)}/kg</span>
                      <span className="text-[10px] text-gray-400">Total</span>
                      <span className="text-xs font-bold text-gray-700">{fmt(p.costoTotal)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4C9EEB]" /> Variable <span className="font-bold text-gray-800">{fmt(p.costoVariable)}</span></div>
                    <div className="text-gray-400 ml-3.5">{varPct}%</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]" /> Fijo <span className="font-bold text-gray-800">{fmt(p.costoFijo)}</span></div>
                    <div className="text-gray-400 ml-3.5">{fijoPct}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desglose por concepto */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Desglose por concepto</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="concepto" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => [fmt(v), '']} />
            <Legend />
            {products.map((_, pi) => (
              <Bar key={pi} dataKey={`P${pi + 1}`} fill={PRODUCT_COLORS[pi]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
