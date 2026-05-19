import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import TablePagination from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import nominaDetalleRaw from '../database/nomina_detalle.csv?raw';
import nominaPlantillaRaw from '../database/nomina_plantilla.csv?raw';
import nominaResumenRaw from '../database/nomina_resumen_seccion_mes.csv?raw';
import { ALL_ROWS as VENTAS_ROWS } from '../hooks/useSalesData';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr'];
const COLORS = ['#1e2a5e', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
  });
}

function fmtMXN(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type DetalleRow = {
  id: string; seccion: string; puesto: string; mes: string;
  periodo: string; dias: number; horas: number;
  sueldoDiario: number; pagoPeriodo: number; tipoPago: string;
};

type PlantillaRow = {
  id: string; seccion: string; puesto: string;
  sueldoMensual: number; tipoPago: string;
};

type ResumenRow = {
  seccion: string; ene: number; feb: number; mar: number;
  abr: number; total: number; personas: number;
};

const DETALLE: DetalleRow[] = parseCSV(nominaDetalleRaw)
  .filter(r => r['ID'] && r['ID'] !== 'ID')
  .map(r => ({
    id: r['ID'],
    seccion: r['Sección'],
    puesto: r['Puesto'],
    mes: r['Mes'],
    periodo: r['Periodo'],
    dias: Number(r['Días Lab.']) || 0,
    horas: Number(r['Horas']) || 0,
    sueldoDiario: Number(r['Sueldo Diario']) || 0,
    pagoPeriodo: Number(r['Pago Periodo']) || 0,
    tipoPago: r['Tipo Pago'],
  }));

const PLANTILLA: PlantillaRow[] = parseCSV(nominaPlantillaRaw)
  .filter(r => r['ID'] && r['ID'] !== 'ID' && r['ID'] !== 'TOTAL')
  .map(r => ({
    id: r['ID'],
    seccion: r['Sección'],
    puesto: r['Puesto'],
    sueldoMensual: Number(r['Sueldo Mensual Bruto']) || 0,
    tipoPago: r['Tipo Pago'],
  }));

const RESUMEN: ResumenRow[] = parseCSV(nominaResumenRaw)
  .filter(r => r['Sección'] && r['Sección'] !== 'Sección' && r['Sección'] !== 'TOTAL')
  .map(r => ({
    seccion: r['Sección'],
    ene: Number(r['Enero']) || 0,
    feb: Number(r['Febrero']) || 0,
    mar: Number(r['Marzo']) || 0,
    abr: Number(r['Abril']) || 0,
    total: Number(r['Total']) || 0,
    personas: Number(r['Personas']) || 0,
  }));

export default function AdministracionDashboard() {
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [puestoFilter, setPuestoFilter] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');

  const puestos = useMemo(() =>
    Array.from(new Set(DETALLE.filter(r => r.seccion === 'Administración').map(r => r.puesto))).sort(),
    [],
  );

  function resetFiltros() {
    setMesFilter('todos');
    setPuestoFilter('todos');
    setSearch('');
  }

  const adminDetalle = useMemo(() => {
    const s = search.toLowerCase();
    return DETALLE.filter(r => {
      if (r.seccion !== 'Administración') return false;
      if (mesFilter !== 'todos' && r.mes !== mesFilter) return false;
      if (puestoFilter !== 'todos' && r.puesto !== puestoFilter) return false;
      if (s && ![r.puesto, r.id, r.periodo].join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
  }, [mesFilter, puestoFilter, search]);

  const adminPlantilla = useMemo(() =>
    PLANTILLA.filter(r => r.seccion === 'Administración'),
    []);

  const adminResumen = RESUMEN.find(r => r.seccion === 'Administración');

  const totalNomina = useMemo(() =>
    adminDetalle.reduce((s, r) => s + r.pagoPeriodo, 0),
    [adminDetalle],
  );

  const totalHoras = useMemo(() =>
    adminDetalle.reduce((s, r) => s + r.horas, 0),
    [adminDetalle],
  );

  const costoPorHora = totalHoras > 0 ? totalNomina / totalHoras : 0;

  const byPuesto = useMemo(() => {
    const map: Record<string, { total: number; horas: number; personas: Set<string> }> = {};
    adminDetalle.forEach(r => {
      if (!map[r.puesto]) map[r.puesto] = { total: 0, horas: 0, personas: new Set() };
      map[r.puesto].total += r.pagoPeriodo;
      map[r.puesto].horas += r.horas;
      map[r.puesto].personas.add(r.id);
    });
    return Object.entries(map).map(([puesto, v]) => ({
      puesto,
      total: v.total,
      horas: v.horas,
      personas: v.personas.size,
      costoPorHora: v.horas > 0 ? v.total / v.horas : 0,
    })).sort((a, b) => b.total - a.total);
  }, [adminDetalle]);

  const pesoKgPorMes = useMemo(() =>
    Object.fromEntries(
      MESES.map(m => [m, VENTAS_ROWS.filter(r => r.mes === m).reduce((s, r) => s + r.peso_std, 0)])
    ),
    [],
  );

  const totalPesoKg = useMemo(() =>
    VENTAS_ROWS.reduce((s, r) => s + r.peso_std, 0),
    [],
  );

  const byMes = useMemo(() =>
    MESES.map(m => {
      const nomina = DETALLE.filter(r => r.seccion === 'Administración' && r.mes === m)
        .reduce((s, r) => s + r.pagoPeriodo, 0);
      const kg = pesoKgPorMes[m] ?? 0;
      return { mes: m, total: nomina, kg, cuota: kg > 0 ? nomina / kg : 0 };
    }),
    [pesoKgPorMes],
  );

  const cuotaTotal = totalPesoKg > 0 ? totalNomina / totalPesoKg : 0;

  const resumenSecciones = useMemo(() =>
    RESUMEN.map(r => ({ seccion: r.seccion, total: r.total, personas: r.personas })),
    [],
  );

  const pag = usePagination(adminDetalle, 50);

  const hayFiltros = mesFilter !== 'todos' || puestoFilter !== 'todos' || search !== '';

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white ring-1 ring-foreground/10 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, puesto, periodo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={mesFilter} onValueChange={setMesFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los meses</SelectItem>
            {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={puestoFilter} onValueChange={setPuestoFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Puesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los puestos</SelectItem>
            {puestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={resetFiltros} className="h-9 gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {adminDetalle.length} registros
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nómina Periodo</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{fmtMXN(totalNomina)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Personal Activo</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{adminPlantilla.length}</div>
            <div className="text-xs text-muted-foreground mt-1">empleados en plantilla</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Horas</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{totalHoras.toLocaleString('es-MX')}</div>
            <div className="text-xs text-muted-foreground mt-1">horas trabajadas</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Costo/Hora</div>
            <div className="text-xl font-bold text-green-600">{fmtMXN(costoPorHora)}</div>
            <div className="text-xs text-muted-foreground mt-1">costo unitario por hora</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cuota Admin ($/kg)</div>
            <div className="text-xl font-bold text-amber-600">{fmtMXN(cuotaTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1">nómina admin / kg vendidos</div>
          </CardContent>
        </Card>
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

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nómina por mes */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Nómina Administración por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtMXN(v)} />
                <Bar dataKey="total" name="Nómina" fill="#1e2a5e" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" formatter={(v: number) => `$${(v/1000).toFixed(1)}k`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cuota Admin $/kg por mes */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Cuota Admin ($/kg) por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}`} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
                <Bar dataKey="cuota" name="$/kg" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cuota" position="top" formatter={(v: number) => `$${v.toFixed(2)}`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por puesto */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Distribución por Puesto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byPuesto}
                  dataKey="total"
                  nameKey="puesto"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props: any) =>
                    `${byPuesto[props.index]?.puesto ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {byPuesto.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMXN(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Costo/hora por puesto */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Costo por Hora por Puesto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPuesto} layout="vertical" margin={{ top: 4, right: 40, left: 120, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <YAxis dataKey="puesto" type="category" tick={{ fontSize: 11 }} width={115} />
                <Tooltip formatter={(v: number) => fmtMXN(v)} />
                <Bar dataKey="costoPorHora" name="$/hora" fill="#10b981" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="costoPorHora" position="right" formatter={(v: number) => `$${v.toFixed(2)}`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparativo nómina total entre secciones */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Nómina Total por Sección (Ene–Abr)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resumenSecciones} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="seccion" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtMXN(v)} />
                <Bar dataKey="total" name="Nómina total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" formatter={(v: number) => `$${(v/1000).toFixed(0)}k`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tablas */}
      <Tabs defaultValue="resumen">
        <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9 mb-4">
          <TabsTrigger value="resumen" className="text-sm">Resumen por Puesto</TabsTrigger>
          <TabsTrigger value="plantilla" className="text-sm">Plantilla</TabsTrigger>
          <TabsTrigger value="detalle" className="text-sm">Detalle por Periodo</TabsTrigger>
        </TabsList>

        {/* Resumen por puesto */}
        <TabsContent value="resumen" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">Puesto</TableHead>
                    <TableHead className="text-white font-semibold text-right">Personas</TableHead>
                    <TableHead className="text-white font-semibold text-right">Horas</TableHead>
                    <TableHead className="text-white font-semibold text-right">Nómina</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Costo/Hora</TableHead>
                    <TableHead className="text-white font-semibold text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPuesto.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.puesto}</TableCell>
                      <TableCell className="text-right">{r.personas}</TableCell>
                      <TableCell className="text-right">{r.horas.toLocaleString('es-MX')}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.total)}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">
                        {totalPesoKg > 0 ? fmtMXN(r.total / totalPesoKg) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{fmtMXN(r.costoPorHora)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalNomina > 0 ? ((r.total / totalNomina) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell>TOTAL Administración</TableCell>
                    <TableCell className="text-right">{adminPlantilla.length}</TableCell>
                    <TableCell className="text-right">{totalHoras.toLocaleString('es-MX')}</TableCell>
                    <TableCell className="text-right">{fmtMXN(totalNomina)}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-300">{fmtMXN(cuotaTotal)}</TableCell>
                    <TableCell className="text-right">{fmtMXN(costoPorHora)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Plantilla */}
        <TabsContent value="plantilla" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">ID</TableHead>
                    <TableHead className="text-white font-semibold">Puesto</TableHead>
                    <TableHead className="text-white font-semibold text-right">Sueldo Mensual</TableHead>
                    <TableHead className="text-white font-semibold">Tipo Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminPlantilla.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.puesto}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.sueldoMensual)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{r.tipoPago}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell colSpan={2}>TOTAL ({adminPlantilla.length} empleados)</TableCell>
                    <TableCell className="text-right">
                      {fmtMXN(adminPlantilla.reduce((s, r) => s + r.sueldoMensual, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Detalle por periodo */}
        <TabsContent value="detalle" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">ID</TableHead>
                    <TableHead className="text-white font-semibold">Puesto</TableHead>
                    <TableHead className="text-white font-semibold text-center">Mes</TableHead>
                    <TableHead className="text-white font-semibold">Periodo</TableHead>
                    <TableHead className="text-white font-semibold text-right">Días</TableHead>
                    <TableHead className="text-white font-semibold text-right">Horas</TableHead>
                    <TableHead className="text-white font-semibold text-right">Sueldo Diario</TableHead>
                    <TableHead className="text-white font-semibold text-right">Pago Periodo</TableHead>
                    <TableHead className="text-white font-semibold">Tipo Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.puesto}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                      </TableCell>
                      <TableCell>{r.periodo}</TableCell>
                      <TableCell className="text-right">{r.dias}</TableCell>
                      <TableCell className="text-right">{r.horas}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtMXN(r.sueldoDiario)}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.pagoPeriodo)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.tipoPago}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell colSpan={5}>TOTAL ({adminDetalle.length} registros)</TableCell>
                    <TableCell className="text-right">{totalHoras.toLocaleString('es-MX')}</TableCell>
                    <TableCell />
                    <TableCell className="text-right">{fmtMXN(totalNomina)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={pag.page}
              totalPages={pag.totalPages}
              totalItems={adminDetalle.length}
              pageSize={pag.pageSize}
              onPageChange={pag.setPage}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Resumen global de secciones */}
      {adminResumen && (
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Resumen Nómina — Todas las Secciones</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                  <TableHead className="text-white font-semibold">Sección</TableHead>
                  <TableHead className="text-white font-semibold text-right">Personas</TableHead>
                  <TableHead className="text-white font-semibold text-right">Enero</TableHead>
                  <TableHead className="text-white font-semibold text-right">Febrero</TableHead>
                  <TableHead className="text-white font-semibold text-right">Marzo</TableHead>
                  <TableHead className="text-white font-semibold text-right">Abril</TableHead>
                  <TableHead className="text-white font-semibold text-right">Total</TableHead>
                  <TableHead className="text-white font-semibold text-right">% del Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RESUMEN.map((r, i) => (
                  <TableRow key={i} className={r.seccion === 'Administración' ? 'bg-blue-50' : ''}>
                    <TableCell className={`font-medium ${r.seccion === 'Administración' ? 'text-[#1e2a5e] font-bold' : ''}`}>
                      {r.seccion}
                      {r.seccion === 'Administración' && (
                        <Badge className="ml-2 bg-[#1e2a5e] text-white text-xs">Esta sección</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.personas}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMXN(r.ene)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMXN(r.feb)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMXN(r.mar)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMXN(r.abr)}</TableCell>
                    <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {((r.total / RESUMEN.reduce((s, x) => s + x.total, 0)) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{RESUMEN.reduce((s, r) => s + r.personas, 0)}</TableCell>
                  <TableCell className="text-right">{fmtMXN(RESUMEN.reduce((s, r) => s + r.ene, 0))}</TableCell>
                  <TableCell className="text-right">{fmtMXN(RESUMEN.reduce((s, r) => s + r.feb, 0))}</TableCell>
                  <TableCell className="text-right">{fmtMXN(RESUMEN.reduce((s, r) => s + r.mar, 0))}</TableCell>
                  <TableCell className="text-right">{fmtMXN(RESUMEN.reduce((s, r) => s + r.abr, 0))}</TableCell>
                  <TableCell className="text-right">{fmtMXN(RESUMEN.reduce((s, r) => s + r.total, 0))}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
