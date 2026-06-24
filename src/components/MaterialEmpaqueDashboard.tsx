import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts';
import TablePagination from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import { ALL_ROWS as VENTAS_ROWS } from '../hooks/useSalesData';
import { fmtMXN as fmt } from '../lib/format';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr'];
const COLORS = ['#1e2a5e', '#3b82f6', '#10b981', '#f59e0b'];

export default function MaterialEmpaqueDashboard() {
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [clienteFilter, setClienteFilter] = useState<string>('todos');
  const [tamanoFilter, setTamanoFilter] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');

  const clientes = useMemo(() =>
    Array.from(new Set(VENTAS_ROWS.map(r => r.nombre_cliente))).sort(),
    [],
  );

  const tamanos = useMemo(() =>
    Array.from(new Set(VENTAS_ROWS.map(r => r.tamano).filter(Boolean))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return VENTAS_ROWS.filter(r => {
      if (mesFilter !== 'todos' && r.mes !== mesFilter) return false;
      if (clienteFilter !== 'todos' && r.nombre_cliente !== clienteFilter) return false;
      if (tamanoFilter !== 'todos' && r.tamano !== tamanoFilter) return false;
      if (s && ![r.nombre_cliente, r.nombre_articulo, r.codigo_articulo].join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
  }, [mesFilter, clienteFilter, tamanoFilter, search]);

  const hayFiltros = mesFilter !== 'todos' || clienteFilter !== 'todos' || tamanoFilter !== 'todos' || search !== '';

  function resetFiltros() {
    setMesFilter('todos');
    setClienteFilter('todos');
    setTamanoFilter('todos');
    setSearch('');
  }

  const totalGeneral = useMemo(() => filtered.reduce((s, r) => s + r.monto_me, 0), [filtered]);
  const totalPeso = useMemo(() => filtered.reduce((s, r) => s + r.peso_std, 0), [filtered]);
  const totalVentas = useMemo(() => filtered.reduce((s, r) => s + r.importe, 0), [filtered]);
  const cuotaTotal = totalPeso > 0 ? totalGeneral / totalPeso : 0;

  const byMes = useMemo(() =>
    MESES.map(m => {
      const rows = VENTAS_ROWS.filter(r => r.mes === m);
      const me = rows.reduce((s, r) => s + r.monto_me, 0);
      const kg = rows.reduce((s, r) => s + r.peso_std, 0);
      return { mes: m, me, kg, cuota: kg > 0 ? me / kg : 0 };
    }),
    [],
  );

  const byCliente = useMemo<{ cliente: string; me: number; ventas: number; peso: number }[]>(() => {
    const map: Record<string, { me: number; ventas: number; peso: number }> = {};
    filtered.forEach(r => {
      if (!map[r.nombre_cliente]) map[r.nombre_cliente] = { me: 0, ventas: 0, peso: 0 };
      map[r.nombre_cliente].me += r.monto_me;
      map[r.nombre_cliente].ventas += r.importe;
      map[r.nombre_cliente].peso += r.peso_std;
    });
    return Object.entries(map)
      .map(([cliente, v]) => ({ cliente, ...v }))
      .sort((a, b) => b.me - a.me);
  }, [filtered]);

  const resumenPag = usePagination(byCliente, 25);
  const detallePag = usePagination(filtered, 50);

  const byArticuloME = useMemo<{ cliente: string; articulo: string; peso: number; ventas: number; me: number }[]>(() => {
    const map: Record<string, { peso: number; ventas: number; me: number }> = {};
    filtered.forEach(r => {
      const key = `${r.nombre_cliente}||${r.nombre_articulo}`;
      if (!map[key]) map[key] = { peso: 0, ventas: 0, me: 0 };
      map[key].peso += r.peso_std;
      map[key].ventas += r.importe;
      map[key].me += r.monto_me;
    });
    return Object.entries(map)
      .map(([key, v]) => {
        const [cliente, articulo] = key.split('||');
        return { cliente, articulo, ...v };
      })
      .sort((a, b) => b.me - a.me);
  }, [filtered]);

  const byArticuloMEPag = usePagination(byArticuloME, 50);

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white ring-1 ring-foreground/10 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, artículo, código..."
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
        <Select value={clienteFilter} onValueChange={setClienteFilter}>
          <SelectTrigger className="w-52 h-9">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clientes</SelectItem>
            {clientes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tamanoFilter} onValueChange={setTamanoFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Tamaño" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tamaños</SelectItem>
            {tamanos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={resetFiltros} className="h-9 gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registros</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Mat. Empaque Total</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{fmt(totalGeneral)}</div>
            <div className="text-xs text-muted-foreground mt-1">{mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ventas Periodo</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{fmt(totalVentas)}</div>
            <div className="text-xs text-muted-foreground mt-1">importe de ventas</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kg Vendidos</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{totalPeso.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-muted-foreground mt-1">peso estándar</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cuota ME ($/kg)</div>
            <div className="text-xl font-bold text-sky-600">{fmt(cuotaTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1">mat. empaque / kg</div>
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
      <Tabs defaultValue="resumen_cliente">
        <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9 mb-4">
          <TabsTrigger value="resumen_cliente" className="text-sm">Resumen por Cliente</TabsTrigger>
          <TabsTrigger value="detalle" className="text-sm">Detalle por Línea</TabsTrigger>
          <TabsTrigger value="cuotas_articulo" className="text-sm">Cuotas por Cliente y Artículo</TabsTrigger>
        </TabsList>

        {/* Resumen por cliente */}
        <TabsContent value="resumen_cliente" className="mt-0">
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                    <TableHead className="text-white font-semibold">Cliente</TableHead>
                    <TableHead className="text-white font-semibold text-right">Ventas</TableHead>
                    <TableHead className="text-white font-semibold text-right">Peso (kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Mat. Empaque</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota ME ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">% s/Ventas</TableHead>
                    <TableHead className="text-white font-semibold text-right">% del Total ME</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenPag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={r.cliente}>{r.cliente}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(r.ventas)}</TableCell>
                      <TableCell className="text-right">{r.peso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{r.me > 0 ? fmt(r.me) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-sky-600">
                        {r.peso > 0 && r.me > 0 ? `$${(r.me / r.peso).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.ventas > 0 ? ((r.me / r.ventas) * 100).toFixed(2) : '—'}%
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalGeneral > 0 ? ((r.me / totalGeneral) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell>TOTAL ({byCliente.length} clientes)</TableCell>
                    <TableCell className="text-right">{fmt(totalVentas)}</TableCell>
                    <TableCell className="text-right">{totalPeso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                    <TableCell className="text-right text-sky-300">{totalPeso > 0 ? `$${cuotaTotal.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">
                      {totalVentas > 0 ? ((totalGeneral / totalVentas) * 100).toFixed(2) : '—'}%
                    </TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={resumenPag.page}
              totalPages={resumenPag.totalPages}
              totalItems={byCliente.length}
              pageSize={resumenPag.pageSize}
              onPageChange={resumenPag.setPage}
            />
          </div>
        </TabsContent>

        {/* Detalle por línea */}
        <TabsContent value="detalle" className="mt-0">
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
                    <TableHead className="text-white font-semibold text-right">Mat. Empaque</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota ME ($/kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detallePag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[160px] truncate" title={r.nombre_cliente}>{r.nombre_cliente}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={r.nombre_articulo}>{r.nombre_articulo}</TableCell>
                      <TableCell>{r.tamano}</TableCell>
                      <TableCell>{r.color}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(r.importe)}</TableCell>
                      <TableCell className="text-right">{r.peso_std.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{r.monto_me > 0 ? fmt(r.monto_me) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-sky-600">
                        {r.peso_std > 0 && r.monto_me > 0 ? `$${(r.monto_me / r.peso_std).toFixed(4)}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell colSpan={5}>TOTAL ({filtered.length} registros)</TableCell>
                    <TableCell className="text-right">{fmt(totalVentas)}</TableCell>
                    <TableCell className="text-right">{totalPeso.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                    <TableCell className="text-right text-sky-300">{totalPeso > 0 ? `$${cuotaTotal.toFixed(4)}` : '—'}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={detallePag.page}
              totalPages={detallePag.totalPages}
              totalItems={filtered.length}
              pageSize={detallePag.pageSize}
              onPageChange={detallePag.setPage}
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
                    <TableHead className="text-white font-semibold text-right text-xs">% del Total</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Mat. Empaque</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">Cuota ME ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right text-xs">% s/Ventas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byArticuloMEPag.paged.map((r, i) => (
                    <TableRow key={i} className="text-xs">
                      <TableCell className="font-medium max-w-[160px] truncate py-1.5" title={r.cliente}>{r.cliente}</TableCell>
                      <TableCell className="max-w-[200px] truncate py-1.5" title={r.articulo}>{r.articulo}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">{fmt(r.ventas)}</TableCell>
                      <TableCell className="text-right py-1.5">{r.peso.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">
                        {totalPeso > 0 ? ((r.peso / totalPeso) * 100).toFixed(2) : '—'}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e] py-1.5">{r.me > 0 ? fmt(r.me) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-sky-600 py-1.5">
                        {r.peso > 0 && r.me > 0 ? `$${(r.me / r.peso).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-1.5">
                        {r.ventas > 0 ? ((r.me / r.ventas) * 100).toFixed(2) : '—'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold text-xs">
                    <TableCell colSpan={2}>TOTAL ({byArticuloME.length} combinaciones)</TableCell>
                    <TableCell className="text-right">{fmt(totalVentas)}</TableCell>
                    <TableCell className="text-right">{totalPeso.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                    <TableCell className="text-right text-sky-300">{totalPeso > 0 ? `$${cuotaTotal.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">
                      {totalVentas > 0 ? ((totalGeneral / totalVentas) * 100).toFixed(2) : '—'}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <TablePagination
              page={byArticuloMEPag.page}
              totalPages={byArticuloMEPag.totalPages}
              totalItems={byArticuloME.length}
              pageSize={byArticuloMEPag.pageSize}
              onPageChange={byArticuloMEPag.setPage}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Mat. Empaque por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="me" name="Mat. Empaque" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="me" position="top" formatter={(v: any) => `$${(v / 1000).toFixed(1)}k`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Cuota ME ($/kg) por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `$${v.toFixed(2)}`} />
                <Tooltip formatter={(v: any) => `$${v.toFixed(4)}`} />
                <Bar dataKey="cuota" name="$/kg" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cuota" position="top" formatter={(v: any) => `$${v.toFixed(2)}`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-foreground/10 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Top 10 Clientes por Mat. Empaque
              <span className="ml-2 text-xs font-normal text-muted-foreground">— {mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byCliente.slice(0, 10).map(c => ({ cliente: c.cliente.split(' ')[0], me: c.me }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="me" name="Mat. Empaque" fill="#1e2a5e" radius={[4, 4, 0, 0]}>
                  {byCliente.slice(0, 10).map((_, i) => (
                    <rect key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por mes */}
      <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Resumen Mat. Empaque por Mes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead className="text-white font-semibold">Concepto</TableHead>
                <TableHead className="text-white font-semibold text-right">Enero</TableHead>
                <TableHead className="text-white font-semibold text-right">Febrero</TableHead>
                <TableHead className="text-white font-semibold text-right">Marzo</TableHead>
                <TableHead className="text-white font-semibold text-right">Abril</TableHead>
                <TableHead className="text-white font-semibold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Mat. Empaque</TableCell>
                {byMes.map(m => (
                  <TableCell key={m.mes} className="text-right">{fmt(m.me)}</TableCell>
                ))}
                <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(byMes.reduce((s, m) => s + m.me, 0))}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Kg Vendidos</TableCell>
                {byMes.map(m => (
                  <TableCell key={m.mes} className="text-right text-muted-foreground">{m.kg.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</TableCell>
                ))}
                <TableCell className="text-right text-muted-foreground">{byMes.reduce((s, m) => s + m.kg, 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cuota ($/kg)</TableCell>
                {byMes.map(m => (
                  <TableCell key={m.mes} className="text-right font-semibold text-sky-600">{m.kg > 0 ? `$${m.cuota.toFixed(4)}` : '—'}</TableCell>
                ))}
                <TableCell className="text-right font-semibold text-sky-600">
                  {byMes.reduce((s, m) => s + m.kg, 0) > 0
                    ? `$${(byMes.reduce((s, m) => s + m.me, 0) / byMes.reduce((s, m) => s + m.kg, 0)).toFixed(4)}`
                    : '—'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
