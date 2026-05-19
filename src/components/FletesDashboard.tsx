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

export default function FletesDashboard() {
  const { filtered, filters, setFilter, resetFilters, options } = useSalesData();

  const totalFlete = filtered.reduce((s, r) => s + r.monto_fle, 0);
  const totalManiobras = filtered.reduce((s, r) => s + r.monto_myo, 0);
  const totalGeneral = totalFlete + totalManiobras;

  const byCliente = useMemo<{ cliente: string; flete: number; maniobras: number; ventas: number; total: number }[]>(() => {
    const map: Record<string, { flete: number; maniobras: number; ventas: number }> = {};
    filtered.forEach(r => {
      if (!map[r.nombre_cliente]) map[r.nombre_cliente] = { flete: 0, maniobras: 0, ventas: 0 };
      map[r.nombre_cliente].flete += r.monto_fle;
      map[r.nombre_cliente].maniobras += r.monto_myo;
      map[r.nombre_cliente].ventas += r.importe;
    });
    return Object.entries(map)
      .map(([cliente, v]) => ({ cliente, ...v, total: v.flete + v.maniobras }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

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
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Fletes</div>
              <div className="text-2xl font-bold text-[#1e2a5e]">{fmt(totalFlete)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Maniobras</div>
              <div className="text-2xl font-bold text-orange-500">{fmt(totalManiobras)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total General</div>
              <div className="text-2xl font-bold text-green-600">{fmt(totalGeneral)}</div>
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
                      <TableHead className="text-white font-semibold text-right">Fletes</TableHead>
                      <TableHead className="text-white font-semibold text-right">Maniobras</TableHead>
                      <TableHead className="text-white font-semibold text-right">Total Logística</TableHead>
                      <TableHead className="text-white font-semibold text-right">% s/Ventas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenPag.paged.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.cliente}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(r.ventas)}</TableCell>
                        <TableCell className="text-right">{r.flete > 0 ? fmt(r.flete) : '—'}</TableCell>
                        <TableCell className="text-right">{r.maniobras > 0 ? fmt(r.maniobras) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.total)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {r.ventas > 0 ? ((r.total / r.ventas) * 100).toFixed(2) : '—'}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                      <TableCell>TOTAL ({byCliente.length} clientes)</TableCell>
                      <TableCell className="text-right">{fmt(byCliente.reduce((s,r)=>s+r.ventas,0))}</TableCell>
                      <TableCell className="text-right">{fmt(totalFlete)}</TableCell>
                      <TableCell className="text-right">{fmt(totalManiobras)}</TableCell>
                      <TableCell className="text-right">{fmt(totalGeneral)}</TableCell>
                      <TableCell className="text-right">
                        {byCliente.reduce((s,r)=>s+r.ventas,0) > 0
                          ? ((totalGeneral / byCliente.reduce((s,r)=>s+r.ventas,0)) * 100).toFixed(2)
                          : '—'}%
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

          {/* Detalle por línea de venta */}
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
                      <TableHead className="text-white font-semibold text-right">Flete</TableHead>
                      <TableHead className="text-white font-semibold text-right">Maniobras</TableHead>
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
                        <TableCell className="text-right">{r.monto_fle > 0 ? fmt(r.monto_fle) : '—'}</TableCell>
                        <TableCell className="text-right">{r.monto_myo > 0 ? fmt(r.monto_myo) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.monto_fle + r.monto_myo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                      <TableCell colSpan={6}>TOTAL ({filtered.length} registros)</TableCell>
                      <TableCell className="text-right">{fmt(totalFlete)}</TableCell>
                      <TableCell className="text-right">{fmt(totalManiobras)}</TableCell>
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
      </div>
    </div>
  );
}
