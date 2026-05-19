import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import fleteResumenRaw from '../database/fletes_resumen_cliente_mes.csv?raw';
import fletesDetalleRaw from '../database/fletes_embarques.csv?raw';

type ResumenRow = {
  cliente: string;
  flete_ene: number; flete_feb: number; flete_mar: number; flete_abr: number;
  maniobra_ene: number; maniobra_feb: number; maniobra_mar: number; maniobra_abr: number;
  total_fletes: number; total_maniobras: number;
};

type DetalleRow = {
  folio: string; proveedor: string; cliente: string; vehiculo: string;
  destino: string; fecha_envio: string; hora_carga: string; prioridad: string;
  precio_flete: number; importe_otros: number; importe_agregados: number;
  importe_total: number; flete: number; maniobras_y_otros: number; mes: string;
};

function parseCSV<T>(raw: string): T[] {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',');
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const v = (vals[i] ?? '').trim();
      obj[h] = isNaN(Number(v)) || v === '' ? v : Number(v);
    });
    return obj as T;
  });
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr'];

export default function FletesDashboard() {
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const resumen = useMemo(() => parseCSV<ResumenRow>(fleteResumenRaw), []);
  const detalle = useMemo(() => parseCSV<DetalleRow>(fletesDetalleRaw), []);

  const totalFletes = resumen.reduce((s, r) => s + r.total_fletes, 0);
  const totalManiobras = resumen.reduce((s, r) => s + r.total_maniobras, 0);
  const totalGeneral = totalFletes + totalManiobras;

  const detalleFiltered = useMemo(() => {
    return detalle.filter(r => {
      const matchMes = mesFilter === 'todos' || r.mes === mesFilter;
      const matchSearch = search === '' ||
        r.cliente.toLowerCase().includes(search.toLowerCase()) ||
        r.folio.toLowerCase().includes(search.toLowerCase()) ||
        r.destino.toLowerCase().includes(search.toLowerCase());
      return matchMes && matchSearch;
    });
  }, [detalle, mesFilter, search]);

  const resumenFiltered = useMemo(() => {
    return resumen.filter(r =>
      search === '' || r.cliente.toLowerCase().includes(search.toLowerCase())
    );
  }, [resumen, search]);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Fletes</div>
            <div className="text-2xl font-bold text-[#1e2a5e]">{fmt(totalFletes)}</div>
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
        {/* Controles */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9">
            <TabsTrigger value="resumen" className="data-active:bg-[#1e2a5e] data-active:text-white text-sm">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="detalle" className="data-active:bg-[#1e2a5e] data-active:text-white text-sm">
              Detalle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalle" className="mt-0 flex gap-1">
            {(['todos', ...MESES] as string[]).map(m => (
              <Button
                key={m}
                variant={mesFilter === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMesFilter(m)}
                className={mesFilter === m ? 'bg-[#1e2a5e] hover:bg-[#1e2a5e]/90' : ''}
              >
                {m === 'todos' ? 'Todos' : m.toUpperCase()}
              </Button>
            ))}
          </TabsContent>

          <Input
            placeholder="Buscar cliente, folio, destino..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 h-9 text-sm"
          />
        </div>

        {/* Tabla Resumen */}
        <TabsContent value="resumen" className="mt-0">
          <div className="rounded-xl overflow-auto ring-1 ring-foreground/10 shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                  <TableHead className="text-white font-semibold sticky left-0 bg-[#1e2a5e]">Cliente</TableHead>
                  <TableHead className="text-white font-semibold text-right">Flete Ene</TableHead>
                  <TableHead className="text-white font-semibold text-right">Flete Feb</TableHead>
                  <TableHead className="text-white font-semibold text-right">Flete Mar</TableHead>
                  <TableHead className="text-white font-semibold text-right">Flete Abr</TableHead>
                  <TableHead className="text-white font-semibold text-right">Maniobra Ene</TableHead>
                  <TableHead className="text-white font-semibold text-right">Maniobra Feb</TableHead>
                  <TableHead className="text-white font-semibold text-right">Maniobra Mar</TableHead>
                  <TableHead className="text-white font-semibold text-right">Maniobra Abr</TableHead>
                  <TableHead className="text-white font-semibold text-right">Total Fletes</TableHead>
                  <TableHead className="text-white font-semibold text-right">Total Maniobras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenFiltered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.cliente}</TableCell>
                    <TableCell className="text-right">{r.flete_ene > 0 ? fmt(r.flete_ene) : '—'}</TableCell>
                    <TableCell className="text-right">{r.flete_feb > 0 ? fmt(r.flete_feb) : '—'}</TableCell>
                    <TableCell className="text-right">{r.flete_mar > 0 ? fmt(r.flete_mar) : '—'}</TableCell>
                    <TableCell className="text-right">{r.flete_abr > 0 ? fmt(r.flete_abr) : '—'}</TableCell>
                    <TableCell className="text-right">{r.maniobra_ene > 0 ? fmt(r.maniobra_ene) : '—'}</TableCell>
                    <TableCell className="text-right">{r.maniobra_feb > 0 ? fmt(r.maniobra_feb) : '—'}</TableCell>
                    <TableCell className="text-right">{r.maniobra_mar > 0 ? fmt(r.maniobra_mar) : '—'}</TableCell>
                    <TableCell className="text-right">{r.maniobra_abr > 0 ? fmt(r.maniobra_abr) : '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.total_fletes)}</TableCell>
                    <TableCell className="text-right font-semibold text-orange-500">{r.total_maniobras > 0 ? fmt(r.total_maniobras) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.flete_ene,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.flete_feb,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.flete_mar,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.flete_abr,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.maniobra_ene,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.maniobra_feb,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.maniobra_mar,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.maniobra_abr,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.total_fletes,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.total_maniobras,0))}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>

        {/* Tabla Detalle */}
        <TabsContent value="detalle" className="mt-0">
          <div className="rounded-xl overflow-auto ring-1 ring-foreground/10 shadow-xs">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
              {detalleFiltered.length} registros
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                  <TableHead className="text-white font-semibold">Folio</TableHead>
                  <TableHead className="text-white font-semibold">Proveedor</TableHead>
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead className="text-white font-semibold">Vehículo</TableHead>
                  <TableHead className="text-white font-semibold">Destino</TableHead>
                  <TableHead className="text-white font-semibold">Fecha</TableHead>
                  <TableHead className="text-white font-semibold text-center">Mes</TableHead>
                  <TableHead className="text-white font-semibold text-right">Flete</TableHead>
                  <TableHead className="text-white font-semibold text-right">Maniobras</TableHead>
                  <TableHead className="text-white font-semibold text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalleFiltered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.folio}</TableCell>
                    <TableCell>{r.proveedor}</TableCell>
                    <TableCell className="font-medium">{r.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{r.vehiculo}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destino}</TableCell>
                    <TableCell className="text-muted-foreground">{r.fecha_envio}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmt(r.flete)}</TableCell>
                    <TableCell className="text-right">{r.maniobras_y_otros > 0 ? fmt(r.maniobras_y_otros) : '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.importe_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                  <TableCell colSpan={7}>TOTAL ({detalleFiltered.length} registros)</TableCell>
                  <TableCell className="text-right">{fmt(detalleFiltered.reduce((s,r)=>s+r.flete,0))}</TableCell>
                  <TableCell className="text-right">{fmt(detalleFiltered.reduce((s,r)=>s+r.maniobras_y_otros,0))}</TableCell>
                  <TableCell className="text-right">{fmt(detalleFiltered.reduce((s,r)=>s+r.importe_total,0))}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
