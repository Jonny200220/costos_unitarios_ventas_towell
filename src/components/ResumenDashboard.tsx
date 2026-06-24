import { useEffect, useMemo, useState } from 'react';
import { useNominaData } from '../hooks/useNominaData';
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
import { fmtMXN } from '../lib/format';
import { getPesosCliente } from '../services/pesosService';
import type { PesosCliente } from '../types/pesos';

function fmt2(n: number) { return `$${n.toFixed(2)}`; }

type ItemResumen = {
  label: string;
  ventas: number;
  peso: number;
  cuotaAdmin: number;
  cuotaAlm: number;
  cuotaPrep: number;
  cuotaEmb: number;
  cuotaMe: number;
  cuotaFlete: number;
};

type SortKey = 'label' | 'ventas' | 'cuotaAdmin' | 'cuotaAlm' | 'cuotaPrep' | 'cuotaEmb' | 'cuotaMe' | 'cuotaFlete';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr'];
const TAMANOS: string[] = ['todos', ...Array.from(new Set(ALL_ROWS.map(r => r.tamano).filter(Boolean))).sort()];

export default function ResumenDashboard() {
  const { resumen, plantilla: PLANTILLA_ROWS, loading } = useNominaData();

  // ── Pesos por cliente ──────────────────────────────────────────────────────
  const [pesosMap, setPesosMap] = useState<Map<string, PesosCliente>>(new Map());
  useEffect(() => {
    getPesosCliente().then(rows =>
      setPesosMap(new Map(rows.map(p => [p.nombre_cliente, p])))
    );
  }, []);

  // ── Nómina totales por sección ─────────────────────────────────────────────
  const NOMINA_TOTALES = useMemo(
    () => Object.fromEntries(resumen.map(r => [r.seccion, r.total])),
    [resumen],
  );

  const PERSONAL_POR_SECCION = useMemo(() => {
    const map: Record<string, { puestos: Record<string, number>; total: number; sueldoTotal: number }> = {};
    PLANTILLA_ROWS.forEach(r => {
      const sec = r.seccion;
      const subsec = r.subseccion?.trim();
      const puesto = subsec ? `${subsec} — ${r.puesto || '(Sin puesto)'}` : r.puesto || '(Sin puesto)';
      if (!map[sec]) map[sec] = { puestos: {}, total: 0, sueldoTotal: 0 };
      map[sec].puestos[puesto] = (map[sec].puestos[puesto] || 0) + 1;
      map[sec].total += 1;
      map[sec].sueldoTotal += r.sueldoMensual;
    });
    return map;
  }, [PLANTILLA_ROWS]);

  const TOTAL_PERSONAL = PLANTILLA_ROWS.length;
  const TOTAL_SUELDO_PLANTILLA = useMemo(
    () => PLANTILLA_ROWS.reduce((s, r) => s + r.sueldoMensual, 0),
    [PLANTILLA_ROWS],
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [sortKey, setSortKey]       = useState<SortKey>('ventas');
  const [sortAsc, setSortAsc]       = useState(false);
  const [viewMode, setViewMode]     = useState<'cliente' | 'articulo'>('cliente');
  const [filtroTamano, setFiltroTamano] = useState('todos');
  const [mesFilter, setMesFilter]   = useState('todos');

  // ── Rows filtradas por mes ──────────────────────────────────────────────────
  const filteredRows = useMemo(() =>
    mesFilter === 'todos' ? ALL_ROWS : ALL_ROWS.filter(r => r.mes === mesFilter),
    [mesFilter],
  );

  const TOTAL_PESO   = useMemo(() => filteredRows.reduce((s, r) => s + r.peso_std,  0), [filteredRows]);
  const TOTAL_VENTAS = useMemo(() => filteredRows.reduce((s, r) => s + r.importe,   0), [filteredRows]);
  const TOTAL_ME     = useMemo(() => filteredRows.reduce((s, r) => s + r.monto_me,  0), [filteredRows]);
  const TOTAL_FLETE  = useMemo(() => filteredRows.reduce((s, r) => s + r.monto_fle, 0), [filteredRows]);

  // Cuotas planas para KPI cards
  const CUOTA_ADMIN = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Administración'] ?? 0) / TOTAL_PESO : 0;
  const CUOTA_PREP  = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Preparación']    ?? 0) / TOTAL_PESO : 0;
  const CUOTA_ALM   = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Almacén']        ?? 0) / TOTAL_PESO : 0;
  const CUOTA_EMB   = TOTAL_PESO > 0 ? (NOMINA_TOTALES['Embarques']      ?? 0) / TOTAL_PESO : 0;

  // ── Cálculo ponderado por cliente ──────────────────────────────────────────
  const baseRows = useMemo<ItemResumen[]>(() => {
    const getPeso = (cliente: string, field: keyof Omit<PesosCliente, 'nombre_cliente'>): number =>
      pesosMap.get(cliente)?.[field] ?? 1;

    // Kg total por cliente (para calcular denominadores)
    const clienteKg: Record<string, number> = {};
    filteredRows.forEach(r => {
      clienteKg[r.nombre_cliente] = (clienteKg[r.nombre_cliente] ?? 0) + r.peso_std;
    });
    const clientes = Object.keys(clienteKg);

    // Denominadores: Σ (kg_cliente × peso_area_cliente)
    const tAdmin = NOMINA_TOTALES['Administración'] ?? 0;
    const tAlm   = NOMINA_TOTALES['Almacén']        ?? 0;
    const tPrep  = NOMINA_TOTALES['Preparación']    ?? 0;
    const tEmb   = NOMINA_TOTALES['Embarques']      ?? 0;

    let dAdmin = 0, dAlm = 0, dPrep = 0, dEmb = 0, dMe = 0, dFle = 0;
    clientes.forEach(c => {
      const kg = clienteKg[c];
      dAdmin += kg * getPeso(c, 'peso_admin');
      dAlm   += kg * getPeso(c, 'peso_almacen');
      dPrep  += kg * getPeso(c, 'peso_preparacion');
      dEmb   += kg * getPeso(c, 'peso_embarque');
      dMe    += kg * getPeso(c, 'peso_me');
      dFle   += kg * getPeso(c, 'peso_fletes');
    });

    // Cuota $/kg por cliente para cada área
    const cuotaCliente: Record<string, { admin: number; alm: number; prep: number; emb: number; me: number; fle: number }> = {};
    clientes.forEach(c => {
      cuotaCliente[c] = {
        admin: dAdmin > 0 ? tAdmin * getPeso(c, 'peso_admin')       / dAdmin : 0,
        alm:   dAlm   > 0 ? tAlm   * getPeso(c, 'peso_almacen')     / dAlm   : 0,
        prep:  dPrep  > 0 ? tPrep  * getPeso(c, 'peso_preparacion') / dPrep  : 0,
        emb:   dEmb   > 0 ? tEmb   * getPeso(c, 'peso_embarque')    / dEmb   : 0,
        me:    dMe    > 0 ? TOTAL_ME    * getPeso(c, 'peso_me')      / dMe    : 0,
        fle:   dFle   > 0 ? TOTAL_FLETE * getPeso(c, 'peso_fletes') / dFle   : 0,
      };
    });

    // Agrupar por cliente o artículo, acumulando cuotas ponderadas por kg
    const rowKey = viewMode === 'cliente' ? 'nombre_cliente' : 'nombre_articulo';
    const map: Record<string, {
      ventas: number; kg: number;
      adminKg: number; almKg: number; prepKg: number; embKg: number; meKg: number; fleKg: number;
    }> = {};

    filteredRows.forEach(r => {
      if (filtroTamano !== 'todos' && r.tamano !== filtroTamano) return;
      const k   = r[rowKey];
      const c   = r.nombre_cliente;
      const cu  = cuotaCliente[c] ?? { admin: 0, alm: 0, prep: 0, emb: 0, me: 0, fle: 0 };
      const kg  = r.peso_std;
      if (!map[k]) map[k] = { ventas: 0, kg: 0, adminKg: 0, almKg: 0, prepKg: 0, embKg: 0, meKg: 0, fleKg: 0 };
      map[k].ventas  += r.importe;
      map[k].kg      += kg;
      map[k].adminKg += kg * cu.admin;
      map[k].almKg   += kg * cu.alm;
      map[k].prepKg  += kg * cu.prep;
      map[k].embKg   += kg * cu.emb;
      map[k].meKg    += kg * cu.me;
      map[k].fleKg   += kg * cu.fle;
    });

    return Object.entries(map)
      .map(([label, v]) => ({
        label,
        ventas:     v.ventas,
        peso:       v.kg,
        cuotaAdmin: v.kg > 0 ? v.adminKg / v.kg : 0,
        cuotaAlm:   v.kg > 0 ? v.almKg   / v.kg : 0,
        cuotaPrep:  v.kg > 0 ? v.prepKg  / v.kg : 0,
        cuotaEmb:   v.kg > 0 ? v.embKg   / v.kg : 0,
        cuotaMe:    v.kg > 0 ? v.meKg    / v.kg : 0,
        cuotaFlete: v.kg > 0 ? v.fleKg   / v.kg : 0,
      }))
      .sort((a, b) => b.ventas - a.ventas);
  }, [viewMode, filtroTamano, mesFilter, filteredRows, NOMINA_TOTALES, TOTAL_ME, TOTAL_FLETE, pesosMap]);

  const data = useMemo(() => {
    const s = search.toLowerCase();
    const filtered = s ? baseRows.filter(r => r.label.toLowerCase().includes(s)) : baseRows;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string')
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [search, sortKey, sortAsc, baseRows]);

  function handleViewMode(mode: 'cliente' | 'articulo') { setViewMode(mode); setSearch(''); }
  function handleTamano(t: string) { setFiltroTamano(t); setSearch(''); }
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

  // Promedio ponderado del conjunto visible (para footer)
  const footerAvg = (key: keyof ItemResumen) => {
    const totalKg = data.reduce((s, r) => s + r.peso, 0);
    if (totalKg === 0) return 0;
    return data.reduce((s, r) => s + (r[key] as number) * r.peso, 0) / totalKg;
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>;

  const thC = 'text-white font-semibold text-right cursor-pointer select-none hover:opacity-80 whitespace-nowrap text-xs py-2';
  const tdC = 'py-1 text-xs';

  return (
    <div className="space-y-6">
      {/* KPIs globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10 md:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ventas Totales</div>
            <div className="text-lg font-bold text-[#1e2a5e]">{fmtMXN(TOTAL_VENTAS)}</div>
            <div className="text-xs text-muted-foreground mt-1">{TOTAL_PESO.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
          </CardContent>
        </Card>
        {[
          { label: 'Cuota Administración', val: CUOTA_ADMIN, total: NOMINA_TOTALES['Administración'] ?? 0, color: 'text-amber-600' },
          { label: 'Cuota Surtido',        val: CUOTA_ALM,   total: NOMINA_TOTALES['Almacén']        ?? 0, color: 'text-teal-600' },
          { label: 'Cuota Preparación',    val: CUOTA_PREP,  total: NOMINA_TOTALES['Preparación']    ?? 0, color: 'text-emerald-600' },
          { label: 'Cuota Embarques',      val: CUOTA_EMB,   total: NOMINA_TOTALES['Embarques']      ?? 0, color: 'text-purple-600' },
          { label: 'Cuota ME',    val: TOTAL_PESO > 0 ? TOTAL_ME    / TOTAL_PESO : 0, total: TOTAL_ME,    color: 'text-blue-600' },
          { label: 'Cuota Flete', val: TOTAL_PESO > 0 ? TOTAL_FLETE / TOTAL_PESO : 0, total: TOTAL_FLETE, color: 'text-indigo-600' },
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

      {/* Filtro mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">Mes:</span>
        {['todos', ...MESES].map(m => (
          <button
            key={m}
            onClick={() => setMesFilter(m)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              mesFilter === m
                ? 'bg-[#1e2a5e] text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {m === 'todos' ? 'Todos' : m}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white ring-1 ring-foreground/10 rounded-lg p-1 shadow-xs">
          {(['cliente', 'articulo'] as const).map(mode => (
            <button key={mode} onClick={() => handleViewMode(mode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === mode ? 'bg-[#1e2a5e] text-white' : 'text-muted-foreground hover:text-foreground'}`}>
              {mode === 'cliente' ? 'Por Cliente' : 'Por Artículo'}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Buscar ${viewMode === 'cliente' ? 'cliente' : 'artículo'}...`}
            value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
      </div>

      {/* Filtro por tamaño */}
      <div className="w-48">
        <Select value={filtroTamano} onValueChange={handleTamano}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tamaño..." /></SelectTrigger>
          <SelectContent>
            {TAMANOS.map(t => (
              <SelectItem key={t} value={t}>{t === 'todos' ? 'Todos los tamaños' : t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla principal */}
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead className="text-white font-semibold cursor-pointer select-none hover:opacity-80 whitespace-nowrap text-xs py-2 sticky top-0 bg-[#1e2a5e]"
                  onClick={() => toggleSort('label')}>
                  {colLabel} <SortIcon k="label" />
                </TableHead>
                <TableHead className={`${thC} sticky top-0 bg-[#1e2a5e]`} onClick={() => toggleSort('ventas')}>Ventas <SortIcon k="ventas" /></TableHead>
                <TableHead className="text-white font-semibold text-right whitespace-nowrap text-xs py-2 sticky top-0 bg-[#1e2a5e]">Kg</TableHead>
                <TableHead className={`${thC} bg-amber-900/50 sticky top-0`}   onClick={() => toggleSort('cuotaAdmin')}>Admin $/kg <SortIcon k="cuotaAdmin" /></TableHead>
                <TableHead className={`${thC} bg-teal-900/50 sticky top-0`}    onClick={() => toggleSort('cuotaAlm')}>Almacén $/kg <SortIcon k="cuotaAlm" /></TableHead>
                <TableHead className={`${thC} bg-emerald-900/50 sticky top-0`} onClick={() => toggleSort('cuotaPrep')}>Prep. $/kg <SortIcon k="cuotaPrep" /></TableHead>
                <TableHead className={`${thC} bg-purple-900/50 sticky top-0`}  onClick={() => toggleSort('cuotaEmb')}>Embarques $/kg <SortIcon k="cuotaEmb" /></TableHead>
                <TableHead className={`${thC} bg-blue-900/50 sticky top-0`}    onClick={() => toggleSort('cuotaMe')}>ME $/kg <SortIcon k="cuotaMe" /></TableHead>
                <TableHead className={`${thC} bg-indigo-900/50 sticky top-0`}  onClick={() => toggleSort('cuotaFlete')}>Flete $/kg <SortIcon k="cuotaFlete" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pag.paged.map((r, i) => (
                <TableRow key={i} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell className={`${tdC} font-medium max-w-[160px] truncate`} title={r.label}>{r.label}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>{fmtMXN(r.ventas)}</TableCell>
                  <TableCell className={`${tdC} text-right text-muted-foreground`}>{r.peso.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-amber-600`}>{fmt2(r.cuotaAdmin)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-teal-600`}>{fmt2(r.cuotaAlm)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-emerald-600`}>{fmt2(r.cuotaPrep)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-purple-600`}>{fmt2(r.cuotaEmb)}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-blue-700`}>{r.cuotaMe > 0 ? fmt2(r.cuotaMe) : '—'}</TableCell>
                  <TableCell className={`${tdC} text-right font-semibold text-indigo-700`}>{r.cuotaFlete > 0 ? fmt2(r.cuotaFlete) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                <TableCell>TOTAL ({data.length} {colLabel.toLowerCase()}s)</TableCell>
                <TableCell className="text-right">{fmtMXN(data.reduce((s, r) => s + r.ventas, 0))}</TableCell>
                <TableCell className="text-right">{data.reduce((s, r) => s + r.peso, 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaAdmin'))}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaAlm'))}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaPrep'))}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaEmb'))}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaMe'))}</TableCell>
                <TableCell className="text-right">{fmt2(footerAvg('cuotaFlete'))}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <TablePagination page={pag.page} totalPages={pag.totalPages} totalItems={data.length}
          pageSize={pag.pageSize} onPageChange={pag.setPage} />
      </div>

      {/* Tabla de personal por sección */}
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead className="text-white font-semibold">Sección</TableHead>
                <TableHead className="text-white font-semibold">Puesto</TableHead>
                <TableHead className="text-white font-semibold text-right">Personas</TableHead>
                <TableHead className="text-white font-semibold text-right">Sueldo Mensual Unit.</TableHead>
                <TableHead className="text-white font-semibold text-right">Sueldo Total Sección</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(PERSONAL_POR_SECCION).map(([seccion, secData]) =>
                Object.entries(secData.puestos).map(([puesto, count], j) => {
                  const sueldoUnit = PLANTILLA_ROWS.find(r => {
                    const subsec = r.subseccion?.trim();
                    const key = subsec ? `${subsec} — ${r.puesto || '(Sin puesto)'}` : r.puesto || '(Sin puesto)';
                    return r.seccion === seccion && key === puesto;
                  });
                  const sueldoUnitVal = sueldoUnit?.sueldoMensual ?? 0;
                  return (
                    <TableRow key={`${seccion}-${puesto}`} className={j === 0 ? 'border-t-2 border-foreground/10' : ''}>
                      <TableCell className={`font-medium ${j === 0 ? '' : 'text-transparent'}`}>{j === 0 ? seccion : ''}</TableCell>
                      <TableCell className="text-muted-foreground">{puesto}</TableCell>
                      <TableCell className="text-right font-semibold">{count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtMXN(sueldoUnitVal)}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(sueldoUnitVal * count)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                <TableCell colSpan={2}>TOTAL ({TOTAL_PERSONAL} empleados)</TableCell>
                <TableCell className="text-right">{TOTAL_PERSONAL}</TableCell>
                <TableCell />
                <TableCell className="text-right">{fmtMXN(TOTAL_SUELDO_PLANTILLA)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
