import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import { Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProductConfig } from '../data/mockData';

const COLORS_VAR_FIJO = ['#4C9EEB', '#F97316'];

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function DonutCenter({ viewBox, value, label }: { viewBox?: { cx: number; cy: number }; value: string; label: string }) {
  const { cx = 0, cy = 0 } = viewBox ?? {};
  return (
    <text>
      <tspan x={cx} y={cy - 8} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={600}>{label}</tspan>
      <tspan x={cx} y={cy + 10} textAnchor="middle" fill="#1e2a5e" fontSize={16} fontWeight={700}>{value}</tspan>
    </text>
  );
}

export default function Charts({ data }: { data: ProductConfig }) {
  const construccionData = data.materiaPrima.map(mp => ({ name: mp.nombre, kg: mp.kg, value: mp.kg, color: mp.color }));
  const composicionData = [
    { name: 'Variable', value: data.costoVariable, color: '#4C9EEB' },
    { name: 'Fijo', value: data.costoFijo, color: '#F97316' },
  ];

  const desglosRows = data.rows.filter(r => r.tipo === 'Variable' || r.tipo === 'Fijo');
  const barData = desglosRows.map(r => ({ name: r.concepto, value: r.importe }));

  return (
    <div className="grid grid-cols-3 gap-4 mb-5">
      <Card size="sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Construcción</CardTitle>
            <Maximize2 size={14} className="text-muted-foreground cursor-pointer" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={construccionData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  dataKey="value" startAngle={90} endAngle={-270}>
                  {construccionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  <DonutCenter value={fmt(data.costoVariable)} label="MP" />
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} kg`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1">
              {construccionData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span>{d.name}</span>
                  <span className="font-semibold text-foreground">{fmt(d.value * (data.costoVariable / data.kilos) / 1)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Composición</CardTitle>
            <Maximize2 size={14} className="text-muted-foreground cursor-pointer" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={composicionData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  dataKey="value" startAngle={90} endAngle={-270}>
                  {composicionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  <DonutCenter value={fmt(data.costoTotal)} label="Total" />
                </Pie>
                <Tooltip formatter={(v: number) => [fmt(v), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {composicionData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS_VAR_FIJO[i] }} />
                  <div>
                    <div>{d.name}</div>
                    <div className="font-semibold text-foreground">{fmt(d.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Desglose Por Costo</CardTitle>
            <Maximize2 size={14} className="text-muted-foreground cursor-pointer" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip formatter={(v: number) => [fmt(v), '']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} fill="#93C5FD">
                <LabelList dataKey="value" position="right" formatter={fmt} style={{ fontSize: 10, fill: '#374151' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
