import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCostosUnitarios } from '../hooks/useCostosUnitarios';
import { usePagination } from '../hooks/usePagination';
import TablePagination from './TablePagination';
import { fmtMXN, fmtNum } from '../lib/format';

type SortKey = 'nombre_cliente' | 'nombre_articulo' | 'tamano' | 'kg' | 'ventas' |
  'cuota_admin' | 'cuota_almacen' | 'cuota_preparacion' | 'cuota_embarque' |
  'cuota_me' | 'cuota_fletes' | 'cuota_total';

const COLS: { key: SortKey; label: string; color?: string }[] = [
  { key: 'cuota_admin',       label: 'Admin',       color: 'bg-amber-900/40' },
  { key: 'cuota_almacen',     label: 'Almacén',     color: 'bg-teal-900/40' },
  { key: 'cuota_preparacion', label: 'Preparación', color: 'bg-violet-900/40' },
  { key: 'cuota_embarque',    label: 'Embarques',   color: 'bg-blue-900/40' },
  { key: 'cuota_me',          label: 'Mat. Emp.',   color: 'bg-sky-900/40' },
  { key: 'cuota_fletes',      label: 'Fletes',      color: 'bg-indigo-900/40' },
  { key: 'cuota_total',       label: 'Total $/kg',  color: 'bg-gray-700/60' },
];

const CELL_COLORS: Record<string, string> = {
  cuota_admin:       'text-amber-600',
  cuota_almacen:     'text-teal-600',
  cuota_preparacion: 'text-violet-600',
  cuota_embarque:    'text-blue-600',
  cuota_me:          'text-sky-600',
  cuota_fletes:      'text-indigo-600',
  cuota_total:       'text-[#1e2a5e] font-bold',
};

function fmt2(n: number) { return `$${n.toFixed(2)}`; }

export default function CostosUnitariosDashboard() {
  const { rows, loading, error } = useCostosUnitarios();
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ventas');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? rows.filter(r => r.nombre_cliente.toLowerCase().includes(q) || r.nombre_articulo.toLowerCase().includes(q) || r.tamano.toLowerCase().includes(q))
      : rows;
  }, [rows, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string' && typeof vb === 'string')
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
  }), [filtered, sortKey, sortAsc]);

  const pag = usePagination(sorted, 20);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(p => !p);
    else { setSortKey(k); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  const totalKg     = rows.reduce((s, r) => s + r.kg, 0);
  const totalVentas = rows.reduce((s, r) => s + r.ventas, 0);
  const avgCuota    = (field: SortKey) =>
    totalKg > 0 ? rows.reduce((s, r) => s + (r[field] as number) * r.kg, 0) / totalKg : 0;

  const thC = 'text-white font-semibold text-xs py-2 whitespace-nowrap cursor-pointer select-none hover:opacity-80';
  const tdC = 'py-1.5 text-xs';

  if (loading) return <div className="py-12 text-center text-muted-foreground">Cargando costos...</div>;
  if (error)   return <div className="py-12 text-center text-red-500 text-sm">{error}</div>;

  return (
    <div className="space-y-5">
      {/* KPI globales (promedio ponderado por kg) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10 md:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Ventas</div>
            <div className="text-base font-bold text-[#1e2a5e]">{fmtMXN(totalVentas)}</div>
            <div className="text-xs text-muted-foreground mt-1">{fmtNum(totalKg, 0)} kg · {rows.length} artículos</div>
          </CardContent>
        </Card>
        {COLS.map(col => (
          <Card key={col.key} className="border-0 shadow-sm ring-1 ring-foreground/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {col.label}
              </div>
              <div className={`text-base font-bold ${CELL_COLORS[col.key]}`}>
                {fmt2(avgCuota(col.key))}
                <span className="text-xs font-normal text-muted-foreground"> $/kg</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">promedio ponderado</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota */}
      <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
        Las cuotas varían por artículo según los pesos configurados en <strong>Configuración → Pesos por Orden</strong> y <strong>Preparación por Artículo</strong>.
        Con todos los pesos en 1 la distribución es proporcional al kg (comportamiento plano).
      </p>

      {/* Buscador */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente, artículo o tamaño..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
        <div className="overflow-auto max-h-[420px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead className={`${thC} text-left`} onClick={() => toggleSort('nombre_cliente')}>
                  Cliente <SortIcon k="nombre_cliente" />
                </TableHead>
                <TableHead className={`${thC} text-left`} onClick={() => toggleSort('nombre_articulo')}>
                  Artículo <SortIcon k="nombre_articulo" />
                </TableHead>
                <TableHead className={`${thC} text-left`} onClick={() => toggleSort('tamano')}>
                  Tamaño <SortIcon k="tamano" />
                </TableHead>
                <TableHead className={`${thC} text-right`} onClick={() => toggleSort('kg')}>
                  Kg <SortIcon k="kg" />
                </TableHead>
                <TableHead className={`${thC} text-right`} onClick={() => toggleSort('ventas')}>
                  Ventas <SortIcon k="ventas" />
                </TableHead>
                {COLS.map(col => (
                  <TableHead
                    key={col.key}
                    className={`${thC} text-right ${col.color ?? ''}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label} <SortIcon k={col.key} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pag.paged.map((r, i) => (
                <TableRow key={`${r.nombre_cliente}||${r.nombre_articulo}||${r.tamano}`} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell className={`${tdC} max-w-[150px] truncate`} title={r.nombre_cliente}>
                    {r.nombre_cliente}
                  </TableCell>
                  <TableCell className={`${tdC} max-w-[180px] truncate`} title={r.nombre_articulo}>
                    {r.nombre_articulo}
                  </TableCell>
                  <TableCell className={`${tdC} text-muted-foreground`}>{r.tamano}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>{fmtNum(r.kg, 0)}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>{fmtMXN(r.ventas)}</TableCell>
                  {COLS.map(col => (
                    <TableCell key={col.key} className={`${tdC} text-right ${CELL_COLORS[col.key]}`}>
                      {fmt2(r[col.key] as number)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold text-xs">
                <TableCell colSpan={3}>TOTAL ({sorted.length} artículos)</TableCell>
                <TableCell className="text-right">{fmtNum(filtered.reduce((s, r) => s + r.kg, 0), 0)}</TableCell>
                <TableCell className="text-right">{fmtMXN(filtered.reduce((s, r) => s + r.ventas, 0))}</TableCell>
                {COLS.map(col => (
                  <TableCell key={col.key} className="text-right">
                    {fmt2(avgCuota(col.key))}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <TablePagination
          page={pag.page}
          totalPages={pag.totalPages}
          totalItems={sorted.length}
          pageSize={pag.pageSize}
          onPageChange={pag.setPage}
        />
      </div>
    </div>
  );
}
