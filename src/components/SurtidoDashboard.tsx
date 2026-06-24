import { useMemo, useState } from 'react';
import { useNominaData } from '../hooks/useNominaData';
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
import { ALL_ROWS as VENTAS_ROWS } from '../hooks/useSalesData';
import { fmtMXN } from '../lib/format';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr'];
const COLORS = ['#1e2a5e', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const SECCION = 'Almacén';

export default function SurtidoDashboard() {
  const { detalle: DETALLE, plantilla: PLANTILLA, resumen: RESUMEN, loading } = useNominaData();
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [puestoFilter, setPuestoFilter] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');

  const puestos = useMemo(() =>
    Array.from(new Set(DETALLE.filter(r => r.seccion === SECCION).map(r => r.puesto))).sort(),
    [DETALLE],
  );

  function resetFiltros() {
    setMesFilter('todos');
    setPuestoFilter('todos');
    setSearch('');
  }

  const surtidoDetalle = useMemo(() => {
    const s = search.toLowerCase();
    return DETALLE.filter(r => {
      if (r.seccion !== SECCION) return false;
      if (mesFilter !== 'todos' && r.mes !== mesFilter) return false;
      if (puestoFilter !== 'todos' && r.puesto !== puestoFilter) return false;
      if (s && ![r.puesto, r.id, r.periodo].join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
  }, [DETALLE, mesFilter, puestoFilter, search]);

  const surtidoPlantilla = useMemo(() =>
    PLANTILLA.filter(r => r.seccion === SECCION),
    [PLANTILLA],
  );

  const surtidoResumen = RESUMEN.find(r => r.seccion === SECCION);

  const totalNomina = useMemo(() =>
    surtidoDetalle.reduce((s, r) => s + r.pagoPeriodo, 0),
    [surtidoDetalle],
  );

  const totalHoras = useMemo(() =>
    surtidoDetalle.reduce((s, r) => s + r.horas, 0),
    [surtidoDetalle],
  );

  const costoPorHora = totalHoras > 0 ? totalNomina / totalHoras : 0;
  const costoPorMinuto = costoPorHora / 60;

  const byPuesto = useMemo(() => {
    const map: Record<string, { total: number; horas: number; personas: Set<string> }> = {};
    surtidoDetalle.forEach(r => {
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
  }, [surtidoDetalle]);

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

  const pesoKgFiltrado = useMemo(() =>
    mesFilter === 'todos'
      ? totalPesoKg
      : VENTAS_ROWS.filter(r => r.mes === mesFilter).reduce((s, r) => s + r.peso_std, 0),
    [mesFilter, totalPesoKg],
  );

  const byMes = useMemo(() =>
    MESES.map(m => {
      const rows = DETALLE.filter(r => r.seccion === SECCION && r.mes === m);
      const nomina = rows.reduce((s, r) => s + r.pagoPeriodo, 0);
      const horas = rows.reduce((s, r) => s + r.horas, 0);
      const kg = pesoKgPorMes[m] ?? 0;
      return { mes: m, total: nomina, horas, kg, cuota: kg > 0 ? nomina / kg : 0, cuotaMin: horas > 0 ? nomina / (horas * 60) : 0 };
    }),
    [pesoKgPorMes, DETALLE],
  );

  const cuotaTotal = totalPesoKg > 0 ? totalNomina / totalPesoKg : 0;

  const surtidoNominaTotal = useMemo(() =>
    DETALLE.filter(r => r.seccion === SECCION).reduce((s, r) => s + r.pagoPeriodo, 0),
    [DETALLE],
  );

  const resumenSecciones = useMemo(() =>
    RESUMEN.map(r => ({ seccion: r.seccion, total: r.total, personas: r.personas })),
    [RESUMEN],
  );

  const pag = usePagination(surtidoDetalle, 50);

  const byClienteSurtido = useMemo<{ cliente: string; ventas: number; peso: number; nomina: number; cuota: number }[]>(() => {
    const map: Record<string, { ventas: number; peso: number }> = {};
    VENTAS_ROWS.forEach(r => {
      if (!map[r.nombre_cliente]) map[r.nombre_cliente] = { ventas: 0, peso: 0 };
      map[r.nombre_cliente].ventas += r.importe;
      map[r.nombre_cliente].peso += r.peso_std;
    });
    return Object.entries(map)
      .map(([cliente, v]) => ({
        cliente,
        ventas: v.ventas,
        peso: v.peso,
        nomina: totalPesoKg > 0 ? (v.peso / totalPesoKg) * surtidoNominaTotal : 0,
        cuota: totalPesoKg > 0 ? surtidoNominaTotal / totalPesoKg : 0,
      }))
      .sort((a, b) => b.nomina - a.nomina);
  }, [surtidoNominaTotal]);

  const cuotaClientePag = usePagination(byClienteSurtido, 25);

  const byArticuloSurtido = useMemo<{ cliente: string; articulo: string; peso: number; ventas: number; monto: number; cuota: number }[]>(() => {
    const map: Record<string, { peso: number; ventas: number }> = {};
    VENTAS_ROWS.forEach(r => {
      const key = `${r.nombre_cliente}||${r.nombre_articulo}`;
      if (!map[key]) map[key] = { peso: 0, ventas: 0 };
      map[key].peso += r.peso_std;
      map[key].ventas += r.importe;
    });
    return Object.entries(map)
      .map(([key, v]) => {
        const [cliente, articulo] = key.split('||');
        return {
          cliente,
          articulo,
          peso: v.peso,
          ventas: v.ventas,
          monto: totalPesoKg > 0 ? (v.peso / totalPesoKg) * surtidoNominaTotal : 0,
          cuota: totalPesoKg > 0 ? surtidoNominaTotal / totalPesoKg : 0,
        };
      })
      .sort((a, b) => b.monto - a.monto);
  }, [surtidoNominaTotal]);

  const byArticuloSurtidoPag = usePagination(byArticuloSurtido, 50);

  const detalleLineasSurtido = useMemo(() =>
    VENTAS_ROWS.map(r => ({
      ...r,
      montoSurtido: totalPesoKg > 0 ? (r.peso_std / totalPesoKg) * surtidoNominaTotal : 0,
      cuotaSurtido: totalPesoKg > 0 ? surtidoNominaTotal / totalPesoKg : 0,
    })),
    [surtidoNominaTotal],
  );

  const detalleLineasPag = usePagination(detalleLineasSurtido, 50);

  const hayFiltros = mesFilter !== 'todos' || puestoFilter !== 'todos' || search !== '';

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>;

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
          {surtidoDetalle.length} registros
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
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
            <div className="text-xl font-bold text-[#1e2a5e]">{surtidoPlantilla.length}</div>
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
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kg Vendidos</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{pesoKgFiltrado.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-muted-foreground mt-1">kg {mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</div>
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
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Costo/Minuto</div>
            <div className="text-xl font-bold text-emerald-600">{fmtMXN(costoPorMinuto)}</div>
            <div className="text-xs text-muted-foreground mt-1">costo unitario por minuto</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cuota Surtido ($/kg)</div>
            <div className="text-xl font-bold text-teal-600">{fmtMXN(cuotaTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1">nómina surtido / kg vendidos</div>
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
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${mesFilter === m
                ? 'bg-[#1e2a5e] text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {m === 'todos' ? 'Todos' : m}
          </button>
        ))}
      </div>

      {/* Tablas */}
      <Tabs defaultValue="resumen">
        <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9 mb-4">
          <TabsTrigger value="resumen" className="text-sm">Resumen por Puesto</TabsTrigger>
          <TabsTrigger value="plantilla" className="text-sm">Plantilla</TabsTrigger>
          <TabsTrigger value="detalle" className="text-sm">Detalle por Periodo</TabsTrigger>
          <TabsTrigger value="cuotas_cliente" className="text-sm">Cuotas por Cliente</TabsTrigger>
          <TabsTrigger value="cuotas_linea" className="text-sm">Cuotas por Línea</TabsTrigger>
          <TabsTrigger value="cuotas_articulo" className="text-sm">Cuotas por Cliente y Artículo</TabsTrigger>
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
                    <TableHead className="text-white font-semibold text-right">Cuota ($/min)</TableHead>
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
                      <TableCell className="text-right font-semibold text-teal-600">
                        {totalPesoKg > 0 ? fmtMXN(r.total / totalPesoKg) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{fmtMXN(r.costoPorHora)}</TableCell>
                      <TableCell className="text-right font-semibold text-teal-600">
                        {r.horas > 0 ? `$${(r.costoPorHora / 60).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalNomina > 0 ? ((r.total / totalNomina) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell>TOTAL Surtido</TableCell>
                    <TableCell className="text-right">{surtidoPlantilla.length}</TableCell>
                    <TableCell className="text-right">{totalHoras.toLocaleString('es-MX')}</TableCell>
                    <TableCell className="text-right">{fmtMXN(totalNomina)}</TableCell>
                    <TableCell className="text-right font-semibold text-teal-300">{fmtMXN(cuotaTotal)}</TableCell>
                    <TableCell className="text-right">{fmtMXN(costoPorHora)}</TableCell>
                    <TableCell className="text-right font-semibold text-teal-300">
                      {totalHoras > 0 ? `$${costoPorMinuto.toFixed(4)}` : '—'}
                    </TableCell>
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
                  {surtidoPlantilla.map((r, i) => (
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
                    <TableCell colSpan={2}>TOTAL ({surtidoPlantilla.length} empleados)</TableCell>
                    <TableCell className="text-right">
                      {fmtMXN(surtidoPlantilla.reduce((s, r) => s + r.sueldoMensual, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Cuotas por Cliente */}
        <TabsContent value="cuotas_cliente" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">Cliente</TableHead>
                    <TableHead className="text-white font-semibold text-right">Ventas</TableHead>
                    <TableHead className="text-white font-semibold text-right">Peso (kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">% kg s/Total</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Surtido ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Monto Surtido Asignado</TableHead>
                    <TableHead className="text-white font-semibold text-right">% s/Ventas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuotaClientePag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={r.cliente}>{r.cliente}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtMXN(r.ventas)}</TableCell>
                      <TableCell className="text-right">{r.peso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalPesoKg > 0 ? ((r.peso / totalPesoKg) * 100).toFixed(2) : '—'}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-teal-600">
                        {fmtMXN(r.cuota)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.nomina)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.ventas > 0 ? ((r.nomina / r.ventas) * 100).toFixed(2) : '—'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell>TOTAL ({byClienteSurtido.length} clientes)</TableCell>
                    <TableCell className="text-right">{fmtMXN(byClienteSurtido.reduce((s, r) => s + r.ventas, 0))}</TableCell>
                    <TableCell className="text-right">{totalPesoKg.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right text-teal-300">{fmtMXN(cuotaTotal)}</TableCell>
                    <TableCell className="text-right">{fmtMXN(surtidoNominaTotal)}</TableCell>
                    <TableCell className="text-right">
                      {byClienteSurtido.reduce((s, r) => s + r.ventas, 0) > 0
                        ? ((surtidoNominaTotal / byClienteSurtido.reduce((s, r) => s + r.ventas, 0)) * 100).toFixed(2)
                        : '—'}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={cuotaClientePag.page}
              totalPages={cuotaClientePag.totalPages}
              totalItems={byClienteSurtido.length}
              pageSize={cuotaClientePag.pageSize}
              onPageChange={cuotaClientePag.setPage}
            />
          </div>
        </TabsContent>

        {/* Cuotas por Línea */}
        <TabsContent value="cuotas_linea" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">Cliente</TableHead>
                    <TableHead className="text-white font-semibold">Artículo</TableHead>
                    <TableHead className="text-white font-semibold">Tamaño</TableHead>
                    <TableHead className="text-white font-semibold">Color</TableHead>
                    <TableHead className="text-white font-semibold text-center">Mes</TableHead>
                    <TableHead className="text-white font-semibold text-right">Importe Venta</TableHead>
                    <TableHead className="text-white font-semibold text-right">Peso (kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Surtido ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Monto Surtido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalleLineasPag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[160px] truncate" title={r.nombre_cliente}>{r.nombre_cliente}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={r.nombre_articulo}>{r.nombre_articulo}</TableCell>
                      <TableCell>{r.tamano}</TableCell>
                      <TableCell>{r.color}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtMXN(r.importe)}</TableCell>
                      <TableCell className="text-right">{r.peso_std.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      <TableCell className="text-right font-semibold text-teal-600">
                        {r.cuotaSurtido > 0 ? `$${r.cuotaSurtido.toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmtMXN(r.montoSurtido)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell colSpan={5}>TOTAL ({VENTAS_ROWS.length} registros)</TableCell>
                    <TableCell className="text-right">{fmtMXN(VENTAS_ROWS.reduce((s, r) => s + r.importe, 0))}</TableCell>
                    <TableCell className="text-right">{totalPesoKg.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className="text-right text-teal-300">${cuotaTotal.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{fmtMXN(surtidoNominaTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={detalleLineasPag.page}
              totalPages={detalleLineasPag.totalPages}
              totalItems={VENTAS_ROWS.length}
              pageSize={detalleLineasPag.pageSize}
              onPageChange={detalleLineasPag.setPage}
            />
          </div>
        </TabsContent>

        {/* Cuotas por Cliente y Artículo */}
        <TabsContent value="cuotas_articulo" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold text-xs">Cliente</TableHead>
                    <TableHead className="text-white font-semibold text-xs">Artículo</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Ventas</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Peso (kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">% kg s/Total</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Cuota Surtido ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Monto Surtido</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">% s/Ventas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byArticuloSurtidoPag.paged.map((r, i) => (
                    <TableRow key={i} className="text-xs">
                      <TableCell className="font-medium max-w-[160px] truncate py-1.5" title={r.cliente}>{r.cliente}</TableCell>
                      <TableCell className="max-w-[200px] truncate py-1.5" title={r.articulo}>{r.articulo}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">{fmtMXN(r.ventas)}</TableCell>
                      <TableCell className="text-right py-1.5">{r.peso.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">
                        {totalPesoKg > 0 ? ((r.peso / totalPesoKg) * 100).toFixed(2) : '—'}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-teal-600 py-1.5">
                        {r.cuota > 0 ? `$${r.cuota.toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e] py-1.5">{fmtMXN(r.monto)}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">
                        {r.ventas > 0 ? ((r.monto / r.ventas) * 100).toFixed(2) : '—'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold text-xs">
                    <TableCell colSpan={2}>TOTAL ({byArticuloSurtido.length} combinaciones)</TableCell>
                    <TableCell className="text-right">{fmtMXN(byArticuloSurtido.reduce((s, r) => s + r.ventas, 0))}</TableCell>
                    <TableCell className="text-right">{totalPesoKg.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right text-teal-300">${cuotaTotal.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{fmtMXN(surtidoNominaTotal)}</TableCell>
                    <TableCell className="text-right">
                      {byArticuloSurtido.reduce((s, r) => s + r.ventas, 0) > 0
                        ? ((surtidoNominaTotal / byArticuloSurtido.reduce((s, r) => s + r.ventas, 0)) * 100).toFixed(2)
                        : '—'}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={byArticuloSurtidoPag.page}
              totalPages={byArticuloSurtidoPag.totalPages}
              totalItems={byArticuloSurtido.length}
              pageSize={byArticuloSurtidoPag.pageSize}
              onPageChange={byArticuloSurtidoPag.setPage}
            />
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
                    <TableCell colSpan={5}>TOTAL ({surtidoDetalle.length} registros)</TableCell>
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
              totalItems={surtidoDetalle.length}
              pageSize={pag.pageSize}
              onPageChange={pag.setPage}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nómina por mes */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Nómina Surtido por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${((v ?? 0) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtMXN(v ?? 0)} />
                <Bar dataKey="total" name="Nómina" fill="#0d9488" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `$${((v ?? 0) / 1000).toFixed(1)}k`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cuota Surtido $/kg por mes */}
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Cuota Surtido ($/kg) por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v ?? 0).toFixed(2)}`} />
                <Tooltip formatter={(v: any) => `$${(v ?? 0).toFixed(4)}`} />
                <Bar dataKey="cuota" name="$/kg" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cuota" position="top" formatter={(v: any) => `$${(v ?? 0).toFixed(2)}`} style={{ fontSize: 10 }} />
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
                <Tooltip formatter={(v: any) => fmtMXN(v ?? 0)} />
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
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v ?? 0).toFixed(0)}`} />
                <YAxis dataKey="puesto" type="category" tick={{ fontSize: 11 }} width={115} />
                <Tooltip formatter={(v: any) => fmtMXN(v ?? 0)} />
                <Bar dataKey="costoPorHora" name="$/hora" fill="#10b981" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="costoPorHora" position="right" formatter={(v: any) => `$${(v ?? 0).toFixed(2)}`} style={{ fontSize: 10 }} />
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
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${((v ?? 0) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtMXN(v ?? 0)} />
                <Bar dataKey="total" name="Nómina total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" formatter={(v: any) => `$${((v ?? 0) / 1000).toFixed(0)}k`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumen global de secciones */}
      {surtidoResumen && (
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
                  <TableHead className="text-white font-semibold text-right">Cuota ($/min)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RESUMEN.map((r, i) => (
                  <TableRow key={i} className={r.seccion === SECCION ? 'bg-teal-50' : ''}>
                    <TableCell className={`font-medium ${r.seccion === SECCION ? 'text-teal-700 font-bold' : ''}`}>
                      {r.seccion}
                      {r.seccion === SECCION && (
                        <Badge className="ml-2 bg-teal-700 text-white text-xs">Esta sección</Badge>
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
                    <TableCell className="text-right font-semibold text-teal-600">
                      {(() => {
                        const rows = DETALLE.filter(d => d.seccion === r.seccion);
                        const horas = rows.reduce((s, d) => s + d.horas, 0);
                        return horas > 0 ? `$${(r.total / (horas * 60)).toFixed(4)}` : '—';
                      })()}
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
                  <TableCell className="text-right text-teal-300">
                    {(() => {
                      const horas = DETALLE.reduce((s, d) => s + d.horas, 0);
                      const total = RESUMEN.reduce((s, r) => s + r.total, 0);
                      return horas > 0 ? `$${(total / (horas * 60)).toFixed(4)}` : '—';
                    })()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
