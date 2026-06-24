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

export default function FletesDashboard() {
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [clienteFilter, setClienteFilter] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');

  const clientes = useMemo(() =>
    Array.from(new Set(VENTAS_ROWS.map(r => r.nombre_cliente))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return VENTAS_ROWS.filter(r => {
      if (mesFilter !== 'todos' && r.mes !== mesFilter) return false;
      if (clienteFilter !== 'todos' && r.nombre_cliente !== clienteFilter) return false;
      if (s && ![r.nombre_cliente, r.nombre_articulo, r.codigo_articulo].join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
  }, [mesFilter, clienteFilter, search]);

  const hayFiltros = mesFilter !== 'todos' || clienteFilter !== 'todos' || search !== '';

  function resetFiltros() {
    setMesFilter('todos');
    setClienteFilter('todos');
    setSearch('');
  }

  const totalFlete = useMemo(() => filtered.reduce((s, r) => s + r.monto_fle, 0), [filtered]);
  const totalManiobras = useMemo(() => filtered.reduce((s, r) => s + r.monto_myo, 0), [filtered]);
  const totalGeneral = totalFlete + totalManiobras;
  const totalPeso = useMemo(() => filtered.reduce((s, r) => s + r.peso_std, 0), [filtered]);
  const totalVentas = useMemo(() => filtered.reduce((s, r) => s + r.importe, 0), [filtered]);
  const cuotaFlete = totalPeso > 0 ? totalFlete / totalPeso : 0;
  const cuotaManiobras = totalPeso > 0 ? totalManiobras / totalPeso : 0;

  const byMes = useMemo(() =>
    MESES.map(m => {
      const rows = VENTAS_ROWS.filter(r => r.mes === m);
      const flete = rows.reduce((s, r) => s + r.monto_fle, 0);
      const maniobras = rows.reduce((s, r) => s + r.monto_myo, 0);
      const kg = rows.reduce((s, r) => s + r.peso_std, 0);
      return { mes: m, flete, maniobras, total: flete + maniobras, kg, cuota: kg > 0 ? (flete + maniobras) / kg : 0 };
    }),
    [],
  );

  const byCliente = useMemo<{ cliente: string; flete: number; maniobras: number; ventas: number; total: number; peso: number }[]>(() => {
    const map: Record<string, { flete: number; maniobras: number; ventas: number; peso: number }> = {};
    filtered.forEach(r => {
      if (!map[r.nombre_cliente]) map[r.nombre_cliente] = { flete: 0, maniobras: 0, ventas: 0, peso: 0 };
      map[r.nombre_cliente].flete += r.monto_fle;
      map[r.nombre_cliente].maniobras += r.monto_myo;
      map[r.nombre_cliente].ventas += r.importe;
      map[r.nombre_cliente].peso += r.peso_std;
    });
    return Object.entries(map)
      .map(([cliente, v]) => ({ cliente, ...v, total: v.flete + v.maniobras }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const resumenPag = usePagination(byCliente, 25);
  const detallePag = usePagination(filtered, 50);

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
        <Select value={clienteFilter} onValueChange={setClienteFilter}>
          <SelectTrigger className="w-52 h-9">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clientes</SelectItem>
            {clientes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Fletes</div>
            <div className="text-xl font-bold text-[#1e2a5e]">{fmt(totalFlete)}</div>
            <div className="text-xs text-muted-foreground mt-1">{mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Maniobras</div>
            <div className="text-xl font-bold text-orange-500">{fmt(totalManiobras)}</div>
            <div className="text-xs text-muted-foreground mt-1">{mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Logística</div>
            <div className="text-xl font-bold text-emerald-600">{fmt(totalGeneral)}</div>
            <div className="text-xs text-muted-foreground mt-1">fletes + maniobras</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cuota Flete ($/kg)</div>
            <div className="text-xl font-bold text-sky-600">{fmt(cuotaFlete)}</div>
            <div className="text-xs text-muted-foreground mt-1">flete / kg vendidos</div>
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
                    <TableHead className="text-white font-semibold text-right">Fletes</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Flete ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Maniobras</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Maniobras ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Total Logística</TableHead>
                    <TableHead className="text-white font-semibold text-right">% s/Ventas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenPag.paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[180px] truncate" title={r.cliente}>{r.cliente}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(r.ventas)}</TableCell>
                      <TableCell className="text-right">{r.peso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{r.flete > 0 ? fmt(r.flete) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-sky-600">
                        {r.peso > 0 && r.flete > 0 ? `$${(r.flete / r.peso).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">{r.maniobras > 0 ? fmt(r.maniobras) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-500">
                        {r.peso > 0 && r.maniobras > 0 ? `$${(r.maniobras / r.peso).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{r.total > 0 ? fmt(r.total) : '—'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.ventas > 0 ? ((r.total / r.ventas) * 100).toFixed(2) : '—'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell>TOTAL ({byCliente.length} clientes)</TableCell>
                    <TableCell className="text-right">{fmt(totalVentas)}</TableCell>
                    <TableCell className="text-right">{totalPeso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{fmt(totalFlete)}</TableCell>
                    <TableCell className="text-right text-sky-300">{totalPeso > 0 ? `$${cuotaFlete.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">{fmt(totalManiobras)}</TableCell>
                    <TableCell className="text-right text-orange-300">{totalPeso > 0 ? `$${cuotaManiobras.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                    <TableCell className="text-right">
                      {totalVentas > 0 ? ((totalGeneral / totalVentas) * 100).toFixed(2) : '—'}%
                    </TableCell>
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
                    <TableHead className="text-white font-semibold text-right">Flete</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Flete ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Maniobras</TableHead>
                    <TableHead className="text-white font-semibold text-right">Cuota Maniobras ($/kg)</TableHead>
                    <TableHead className="text-white font-semibold text-right">Total</TableHead>
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
                      <TableCell className="text-right">{r.monto_fle > 0 ? fmt(r.monto_fle) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-sky-600">
                        {r.peso_std > 0 && r.monto_fle > 0 ? `$${(r.monto_fle / r.peso_std).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">{r.monto_myo > 0 ? fmt(r.monto_myo) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-500">
                        {r.peso_std > 0 && r.monto_myo > 0 ? `$${(r.monto_myo / r.peso_std).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.monto_fle + r.monto_myo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                    <TableCell colSpan={5}>TOTAL ({filtered.length} registros)</TableCell>
                    <TableCell className="text-right">{fmt(totalVentas)}</TableCell>
                    <TableCell className="text-right">{totalPeso.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className="text-right">{fmt(totalFlete)}</TableCell>
                    <TableCell className="text-right text-sky-300">{totalPeso > 0 ? `$${cuotaFlete.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">{fmt(totalManiobras)}</TableCell>
                    <TableCell className="text-right text-orange-300">{totalPeso > 0 ? `$${cuotaManiobras.toFixed(4)}` : '—'}</TableCell>
                    <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
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
      </Tabs>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Fletes y Maniobras por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="flete" name="Fletes" fill="#1e2a5e" radius={[4, 4, 0, 0]} stackId="a">
                  <LabelList dataKey="flete" position="inside" formatter={(v: number) => v > 0 ? `$${(v / 1000).toFixed(0)}k` : ''} style={{ fontSize: 9, fill: '#fff' }} />
                </Bar>
                <Bar dataKey="maniobras" name="Maniobras" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a">
                  <LabelList dataKey="maniobras" position="top" formatter={(v: number) => v > 0 ? `$${(v / 1000).toFixed(0)}k` : ''} style={{ fontSize: 9 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Cuota Logística ($/kg) por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
                <Bar dataKey="cuota" name="$/kg" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="cuota" position="top" formatter={(v: number) => `$${v.toFixed(2)}`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-foreground/10 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Top 10 Clientes por Logística
              <span className="ml-2 text-xs font-normal text-muted-foreground">— {mesFilter === 'todos' ? 'Ene–Abr 2026' : mesFilter}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byCliente.slice(0, 10).map(c => ({ cliente: c.cliente.split(' ')[0], flete: c.flete, maniobras: c.maniobras }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="flete" name="Fletes" fill="#1e2a5e" stackId="b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="maniobras" name="Maniobras" fill="#f97316" stackId="b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
