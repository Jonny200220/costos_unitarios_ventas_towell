import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SalesFilterSidebar from './SalesFilterSidebar';
import TablePagination from './TablePagination';
import { useSalesData } from '../hooks/useSalesData';
import { usePagination } from '../hooks/usePagination';

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr'];

export default function MaterialEmpaqueDashboard() {
  const { filtered, filters, setFilter, resetFilters, options } = useSalesData();

  const totalGeneral = filtered.reduce((s, r) => s + r.monto_me, 0);
  const totalesMes = MESES.map(m =>
    filtered.filter(r => r.mes === m).reduce((s, r) => s + r.monto_me, 0)
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

  const totalPeso = useMemo(() => filtered.reduce((s, r) => s + r.peso_std, 0), [filtered]);

  const resumenPag = usePagination(byCliente, 25);
  const detallePag = usePagination(filtered, 50);

  return (
    <div className="flex gap-5">
      <SalesFilterSidebar
        filters={filters}
        options={options}
        onFilter={setFilter}
        onReset={resetFilters}
        resultCount={filtered.length}
      />

      <div className="flex-1 min-w-0">
        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4 mb-5">
          {MESES.map((m, i) => (
            <Card key={m} size="sm">
              <CardContent>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{m}</div>
                <div className="text-xl font-bold text-[#1e2a5e]">{fmt(totalesMes[i])}</div>
              </CardContent>
            </Card>
          ))}
          <Card size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total General</div>
              <div className="text-xl font-bold text-green-600">{fmt(totalGeneral)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="resumen">
          <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9 mb-4">
            <TabsTrigger value="resumen" className="text-sm">Resumen por Cliente</TabsTrigger>
            <TabsTrigger value="detalle" className="text-sm">Detalle por Línea</TabsTrigger>
          </TabsList>

          {/* Resumen agrupado por cliente */}
          <TabsContent value="resumen" className="mt-0">
            <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                      <TableHead className="text-white font-semibold">Cliente</TableHead>
                      <TableHead className="text-white font-semibold text-right">Ventas</TableHead>
                      <TableHead className="text-white font-semibold text-right">Mat. Empaque</TableHead>
                      <TableHead className="text-white font-semibold text-right">Cuota ME ($/kg)</TableHead>
                      <TableHead className="text-white font-semibold text-right">% s/Ventas</TableHead>
                      <TableHead className="text-white font-semibold text-right">% del Total ME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenPag.paged.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.cliente}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(r.ventas)}</TableCell>
                        <TableCell className="text-right font-semibold text-[#1e2a5e]">{r.me > 0 ? fmt(r.me) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {r.peso > 0 && r.me > 0 ? `$${(r.me / r.peso).toFixed(2)}` : '—'}
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
                      <TableCell className="text-right">{fmt(byCliente.reduce((s,r)=>s+r.ventas,0))}</TableCell>
                      <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {totalPeso > 0 ? `$${(totalGeneral / totalPeso).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {byCliente.reduce((s,r)=>s+r.ventas,0) > 0
                          ? ((totalGeneral / byCliente.reduce((s,r)=>s+r.ventas,0)) * 100).toFixed(2)
                          : '—'}%
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
                      <TableHead className="text-white font-semibold">Código</TableHead>
                      <TableHead className="text-white font-semibold">Tamaño</TableHead>
                      <TableHead className="text-white font-semibold">Color</TableHead>
                      <TableHead className="text-white font-semibold">Calidad</TableHead>
                      <TableHead className="text-white font-semibold text-center">Mes</TableHead>
                      <TableHead className="text-white font-semibold text-right">Cantidad</TableHead>
                      <TableHead className="text-white font-semibold text-right">Importe Venta</TableHead>
                      <TableHead className="text-white font-semibold text-right">Mat. Empaque</TableHead>
                      <TableHead className="text-white font-semibold text-right">Cuota ME ($/kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detallePag.paged.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium max-w-[150px] truncate" title={r.nombre_cliente}>{r.nombre_cliente}</TableCell>
                        <TableCell className="max-w-[180px] truncate" title={r.nombre_articulo}>{r.nombre_articulo}</TableCell>
                        <TableCell className="font-mono text-xs">{r.codigo_articulo}</TableCell>
                        <TableCell>{r.tamano}</TableCell>
                        <TableCell>{r.color}</TableCell>
                        <TableCell>{r.calidad}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{r.cantidad.toLocaleString('es-MX')}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(r.importe)}</TableCell>
                        <TableCell className="text-right font-semibold text-[#1e2a5e]">{r.monto_me > 0 ? fmt(r.monto_me) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {r.peso_std > 0 && r.monto_me > 0 ? `$${(r.monto_me / r.peso_std).toFixed(2)}` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                      <TableCell colSpan={9}>TOTAL ({filtered.length} registros)</TableCell>
                      <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {totalPeso > 0 ? `$${(totalGeneral / totalPeso).toFixed(2)}` : '—'}
                      </TableCell>
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
      </div>
    </div>
  );
}
