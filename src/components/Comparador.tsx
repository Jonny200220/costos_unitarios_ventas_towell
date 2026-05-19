import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Plus, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <Card className={`flex-1 min-w-[280px] ${isBest ? 'ring-2 ring-blue-400' : ''}`}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: PRODUCT_COLORS[index] }} />
            <span className="font-semibold text-foreground">Producto {index + 1}</span>
            {isBest && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                <Star size={10} /> Mejor
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onRemove}>
            <X size={16} />
          </Button>
        </div>

        <div className="mb-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Artículo</Label>
          <Select defaultValue={product.idProducto}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={product.idProducto}>{product.idProducto}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Calibre</Label>
            <Select defaultValue="16/1">
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16/1">16/1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Kilos</Label>
            <Input type="number" defaultValue={product.kilos} className="h-8 text-sm" />
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Costo Variable</span>
            <span>{fmt(product.costoVariable)}</span>
          </div>
          <div className="flex justify-between">
            <span>Costo Fijo</span>
            <span>{fmt(product.costoFijo)}</span>
          </div>
          <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1">
            <span>Costo Total</span>
            <span>{fmt(product.costoTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
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
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4C9EEB]" />
              Variable
              <span className="font-semibold text-foreground">{fmt(product.costoVariable)}</span>
              <span className="text-muted-foreground">{varPct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              Fijo
              <span className="font-semibold text-foreground">{fmt(product.costoFijo)}</span>
              <span className="text-muted-foreground">{fijoPct}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
          <Button
            onClick={addProduct}
            className="bg-[#1e2a5e] hover:bg-[#1e2a5e]/90 gap-1.5"
            size="sm"
          >
            <Plus size={14} /> Agregar producto
          </Button>
          <span className="text-sm text-muted-foreground">Máximo 4 productos</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'solo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('solo')}
            className={viewMode === 'solo' ? 'bg-[#1e2a5e] hover:bg-[#1e2a5e]/90' : ''}
          >
            Solo Urdido
          </Button>
          <Button
            variant={viewMode === 'engomado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('engomado')}
            className={viewMode === 'engomado' ? 'bg-[#1e2a5e] hover:bg-[#1e2a5e]/90' : ''}
          >
            + Engomado
          </Button>
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
        <h3 className="text-base font-semibold text-foreground mb-3">Variable vs Fijo · Distribución por producto</h3>
        <div className="flex gap-4 flex-wrap">
          {products.map((p, i) => {
            const composicion = [
              { name: 'Variable', value: p.costoVariable },
              { name: 'Fijo', value: p.costoFijo },
            ];
            const varPct = ((p.costoVariable / p.costoTotal) * 100).toFixed(1);
            const fijoPct = ((p.costoFijo / p.costoTotal) * 100).toFixed(1);
            return (
              <Card key={i} className="flex-1 min-w-[240px]">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">P{i + 1} · {p.idProducto.split('—')[1]?.trim() ?? p.idProducto}</span>
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
                        <span className="text-xs font-bold text-foreground">${p.costoUnitario.toFixed(2)}/kg</span>
                        <span className="text-[10px] text-muted-foreground">Total</span>
                        <span className="text-xs font-bold text-foreground">{fmt(p.costoTotal)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4C9EEB]" /> Variable <span className="font-bold text-foreground">{fmt(p.costoVariable)}</span></div>
                      <div className="text-muted-foreground ml-3.5">{varPct}%</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]" /> Fijo <span className="font-bold text-foreground">{fmt(p.costoFijo)}</span></div>
                      <div className="text-muted-foreground ml-3.5">{fijoPct}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Desglose por concepto */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Desglose por concepto</h3>
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
        </CardContent>
      </Card>
    </div>
  );
}
