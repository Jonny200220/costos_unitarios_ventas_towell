import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ALL_ROWS } from '../hooks/useSalesData';
import { usePagination } from '../hooks/usePagination';
import TablePagination from './TablePagination';
import nominaResumenRaw from '../database/nomina_resumen_seccion_mes.csv?raw';

function fmt2(n: number) {
  return `$${n.toFixed(2)}`;
}

function fmtMXN(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNominaResumen(raw: string): Record<string, number> {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const result: Record<string, number> = {};
  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => c.trim());
    result[cols[0]] = Number(cols[5]) || 0;
  });
  return result;
}

type ItemResumen = {
  label: string;
  ventas: number;
  peso: number;
  cuotaMe: number;
  cuotaFlete: number;
  cuotaManiobras: number;
};

const NOMINA_TOTALES = parseNominaResumen(nominaResumenRaw);


function buildRowsFiltered(key: 'nombre_cliente' | 'nombre_articulo', tamano: string): ItemResumen[] {
  const map: Record<string, { ventas: number; peso: number; me: number; flete: number; maniobras: number }> = {};
  ALL_ROWS.forEach(r => {
    if (tamano !== 'todos' && r.tamano !== tamano) return;
    const k = r[key];
    if (!map[k]) map[k] = { ventas: 0, peso: 0, me: 0, flete: 0, maniobras: 0 };
    map[k].ventas += r.importe;
    map[k].peso += r.peso_std;
    map[k].me += r.monto_me;
    map[k].flete += r.monto_fle;
    map[k].maniobras += r.monto_myo;
  });
  return Object.entries(map)
    .map(([label, v]) => ({
      label,
      ventas: v.ventas,
      peso: v.peso,
      cuotaMe: v.peso > 0 ? v.me / v.peso : 0,
      cuotaFlete: v.peso > 0 ? v.flete / v.peso : 0,
      cuotaManiobras: v.peso > 0 ? v.maniobras / v.peso : 0,
    }))
    .sort((a, b) => b.ventas - a.ventas);
}

const TAMANOS: string[] = ['todos', ...Array.from(new Set(ALL_ROWS.map(r => r.tamano).filter(Boolean))).sort()];

const TOTAL_PESO = ALL_ROWS.reduce((s, r) => s + r.peso_std, 0);
const TOTAL_VENTAS = ALL_ROWS.reduce((s, r) => s + r.importe, 0);
const TOTAL_ME = ALL_ROWS.reduce((s, r) => s + r.monto_me, 0);
const TOTAL_FLETE = ALL_ROWS.reduce((s, r) => s + r.monto_fle, 0);
const TOTAL_MYO = ALL_ROWS.reduce((s, r) => s + r.monto_myo, 0);

const CUOTA_ADMIN = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Administración'] ?? 0) / TOTAL_PESO : 0;
const CUOTA_PREP = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Preparación'] ?? 0) / TOTAL_PESO : 0;
const CUOTA_ALM = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Almacén'] ?? 0) / TOTAL_PESO : 0;
const CUOTA_EMB = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Embarques'] ?? 0) / TOTAL_PESO : 0;

type SortKey = 'label' | 'ventas' | 'cuotaMe' | 'cuotaFlete' | 'cuotaManiobras';

export default function ResumenDashboard() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ventas');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<'cliente' | 'articulo'>('cliente');
  const [filtroTamano, setFiltroTamano] = useState('todos');

  const baseRows = useMemo(
    () => buildRowsFiltered(viewMode === 'cliente' ? 'nombre_cliente' : 'nombre_articulo', filtroTamano),
    [viewMode, filtroTamano],
  );

  const data = useMemo(() => {
    const s = search.toLowerCase();
    const filtered = s
      ? baseRows.filter(r => r.label.toLowerCase().includes(s))
      : baseRows;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey as keyof typeof a];
      const vb = b[sortKey as keyof typeof b];
      if (typeof va === 'string' && typeof vb === 'string')
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [search, sortKey, sortAsc, baseRows]);

  function handleViewMode(mode: 'cliente' | 'articulo') {
    setViewMode(mode);
    setSearch('');
  }

  function handleTamano(t: string) {
    setFiltroTamano(t);
    setSearch('');
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  const pag = usePagination(data, 15);
  const colLabel = viewMode === 'cliente' ? 'Cliente' : 'Artículo';

  const thC = 'text-white font-semibold text-right cursor-pointer select-none hover:opacity-80 whitespace-nowrap text-xs py-2';
  const tdC = 'py-1 text-xs';

  return (
    <div className="space-y-6">
      {/* KPIs globales — cuotas por sección */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10 md:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ventas Totales</div>
            <div className="text-lg font-bold text-[#1e2a5e]">{fmtMXN(TOTAL_VENTAS)}</div>
            <div className="text-xs text-muted-foreground mt-1">{TOTAL_PESO.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
          </CardContent>
        </Card>
        {[
          { label: 'Cuota ME', val: TOTAL_PESO > 0 ? TOTAL_ME / TOTAL_PESO : 0, total: TOTAL_ME, color: 'text-blue-600' },
          { label: 'Cuota Flete', val: TOTAL_PESO > 0 ? TOTAL_FLETE / TOTAL_PESO : 0, total: TOTAL_FLETE, color: 'text-indigo-600' },
          { label: 'Cuota Maniobras', val: TOTAL_PESO > 0 ? TOTAL_MYO / TOTAL_PESO : 0, total: TOTAL_MYO, color: 'text-orange-500' },
          { label: 'Cuota Administración', val: CUOTA_ADMIN, total: NOMINA_TOTALES['Administración'] ?? 0, color: 'text-amber-600' },
          { label: 'Cuota Preparación', val: CUOTA_PREP, total: NOMINA_TOTALES['Preparación'] ?? 0, color: 'text-emerald-600' },
          { label: 'Cuota Almacén / Embarques', val: CUOTA_ALM + CUOTA_EMB, total: (NOMINA_TOTALES['Almacén'] ?? 0) + (NOMINA_TOTALES['Embarques'] ?? 0), color: 'text-purple-600' },
        ].map(({ label, val, total, color }) => (
          <Card key={label} className="border-0 shadow-sm ring-1 ring-foreground/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
              <div className={`text-lg font-bold ${color}`}>{fmt2(val)}<span className="text-xs font-normal text-muted-foreground"> $/kg</span></div>
              <div className="text-xs text-muted-foreground mt-1">{fmtMXN(total)} total</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controles: switch + buscador */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white ring-1 ring-foreground/10 rounded-lg p-1 shadow-xs">
          <button
            onClick={() => handleViewMode('cliente')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'cliente'
                ? 'bg-[#1e2a5e] text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Por Cliente
          </button>
          <button
            onClick={() => handleViewMode('articulo')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'articulo'
                ? 'bg-[#1e2a5e] text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Por Artículo
          </button>
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${viewMode === 'cliente' ? 'cliente' : 'artículo'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Filtro por tamaño */}
      <div className="w-48">
        <Select value={filtroTamano} onValueChange={handleTamano}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tamaño..." />
          </SelectTrigger>
          <SelectContent>
            {TAMANOS.map(t => (
              <SelectItem key={t} value={t}>
                {t === 'todos' ? 'Todos los tamaños' : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla consolidada — solo cuotas por cliente */}
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
        <div className="overflow-auto max-h-[340px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead
                  className="text-white font-semibold cursor-pointer select-none hover:opacity-80 whitespace-nowrap text-xs py-2"
                  onClick={() => toggleSort('label')}
                >
                  {colLabel} <SortIcon k="label" />
                </TableHead>
                <TableHead className={thC} onClick={() => toggleSort('ventas')}>
                  Ventas <SortIcon k="ventas" />
                </TableHead>
                <TableHead className="text-white font-semibold text-right whitespace-nowrap text-xs py-2">Kg (Peso STD)</TableHead>
                <TableHead className={`${thC} bg-blue-900/50`} onClick={() => toggleSort('cuotaMe')}>
                  Cuota ME ($/kg) <SortIcon k="cuotaMe" />
                </TableHead>
                <TableHead className={`${thC} bg-indigo-900/50`} onClick={() => toggleSort('cuotaFlete')}>
                  Cuota Flete ($/kg) <SortIcon k="cuotaFlete" />
                </TableHead>
                <TableHead className={`${thC} bg-orange-900/50`} onClick={() => toggleSort('cuotaManiobras')}>
                  Cuota Maniobras ($/kg) <SortIcon k="cuotaManiobras" />
                </TableHead>
                <TableHead className="text-white font-semibold text-right bg-amber-900/50 whitespace-nowrap text-xs py-2">
                  Cuota Admin ($/kg)
                </TableHead>
                <TableHead className="text-white font-semibold text-right bg-emerald-900/50 whitespace-nowrap text-xs py-2">
                  Cuota Preparación ($/kg)
                </TableHead>
                <TableHead className="text-white font-semibold text-right bg-purple-900/50 whitespace-nowrap text-xs py-2">
                  Cuota Almacén ($/kg)
                </TableHead>
                <TableHead className="text-white font-semibold text-right bg-purple-900/50 whitespace-nowrap text-xs py-2">
                  Cuota Embarques ($/kg)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pag.paged.map((r, i) => (
                <TableRow key={i} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell className={`${tdC} font-medium max-w-[160px] truncate`} title={r.label}>{r.label}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>{fmtMXN(r.ventas)}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>
                    {r.peso.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-blue-700`}>
                    {r.cuotaMe > 0 ? fmt2(r.cuotaMe) : '—'}
                  </TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-indigo-700`}>
                    {r.cuotaFlete > 0 ? fmt2(r.cuotaFlete) : '—'}
                  </TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-orange-600`}>
                    {r.cuotaManiobras > 0 ? fmt2(r.cuotaManiobras) : '—'}
                  </TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-amber-600`}>{fmt2(CUOTA_ADMIN)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-emerald-600`}>{fmt2(CUOTA_PREP)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-purple-600`}>{fmt2(CUOTA_ALM)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-purple-600`}>{fmt2(CUOTA_EMB)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                <TableCell>TOTAL ({data.length} {viewMode === 'cliente' ? 'clientes' : 'artículos'})</TableCell>
                <TableCell className="text-right">{fmtMXN(data.reduce((s, r) => s + r.ventas, 0))}</TableCell>
                <TableCell className="text-right">
                  {data.reduce((s, r) => s + r.peso, 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="text-right">{fmt2(TOTAL_PESO > 0 ? TOTAL_ME / TOTAL_PESO : 0)}</TableCell>
                <TableCell className="text-right">{fmt2(TOTAL_PESO > 0 ? TOTAL_FLETE / TOTAL_PESO : 0)}</TableCell>
                <TableCell className="text-right">{fmt2(TOTAL_PESO > 0 ? TOTAL_MYO / TOTAL_PESO : 0)}</TableCell>
                <TableCell className="text-right">{fmt2(CUOTA_ADMIN)}</TableCell>
                <TableCell className="text-right">{fmt2(CUOTA_PREP)}</TableCell>
                <TableCell className="text-right">{fmt2(CUOTA_ALM)}</TableCell>
                <TableCell className="text-right">{fmt2(CUOTA_EMB)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <TablePagination
          page={pag.page}
          totalPages={pag.totalPages}
          totalItems={data.length}
          pageSize={pag.pageSize}
          onPageChange={pag.setPage}
        />
      </div>
    </div>
  );
}
