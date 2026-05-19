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
import meResumenRaw from '../database/material_empaque_resumen.csv?raw';
import meDetalleRaw from '../database/material_empaque_detalle.csv?raw';

type ResumenRow = {
  cliente: string;
  ene: number; feb: number; mar: number; abr: number; total: number;
};

type DetalleRow = {
  folio: string;
  cuenta_cliente: string;
  nombre_cliente: string;
  fecha: string;
  codigo_articulo: string;
  nombre_articulo: string;
  configuracion: string;
  tamano: string;
  cantidad: number;
  precio_costo: number;
  importe_costo: number;
  mes: string;
  cliente_agrupado: string;
};

function parseCSV<T>(raw: string): T[] {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
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

export default function MaterialEmpaqueDashboard() {
  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const resumen = useMemo(() => parseCSV<ResumenRow>(meResumenRaw), []);
  const detalle = useMemo(() => parseCSV<DetalleRow>(meDetalleRaw), []);

  const totalGeneral = resumen.reduce((s, r) => s + r.total, 0);
  const totalesMes = MESES.map(m => resumen.reduce((s, r) => s + (r[m as keyof ResumenRow] as number), 0));

  const detalleFiltered = useMemo(() => {
    return detalle.filter(r => {
      const matchMes = mesFilter === 'todos' || r.mes === mesFilter;
      const matchSearch = search === '' ||
        r.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
        r.nombre_articulo.toLowerCase().includes(search.toLowerCase()) ||
        r.codigo_articulo.toLowerCase().includes(search.toLowerCase()) ||
        r.folio.toLowerCase().includes(search.toLowerCase());
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
      <div className="grid grid-cols-5 gap-4 mb-5">
        {MESES.map((m, i) => (
          <Card key={m} size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </div>
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
            placeholder="Buscar cliente, artículo, folio..."
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
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead className="text-white font-semibold text-right">Enero</TableHead>
                  <TableHead className="text-white font-semibold text-right">Febrero</TableHead>
                  <TableHead className="text-white font-semibold text-right">Marzo</TableHead>
                  <TableHead className="text-white font-semibold text-right">Abril</TableHead>
                  <TableHead className="text-white font-semibold text-right">Total</TableHead>
                  <TableHead className="text-white font-semibold text-right">% Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenFiltered
                  .sort((a, b) => b.total - a.total)
                  .map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.cliente}</TableCell>
                      <TableCell className="text-right">{r.ene > 0 ? fmt(r.ene) : '—'}</TableCell>
                      <TableCell className="text-right">{r.feb > 0 ? fmt(r.feb) : '—'}</TableCell>
                      <TableCell className="text-right">{r.mar > 0 ? fmt(r.mar) : '—'}</TableCell>
                      <TableCell className="text-right">{r.abr > 0 ? fmt(r.abr) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalGeneral > 0 ? ((r.total / totalGeneral) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.ene,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.feb,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.mar,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.abr,0))}</TableCell>
                  <TableCell className="text-right">{fmt(resumenFiltered.reduce((s,r)=>s+r.total,0))}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
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
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead className="text-white font-semibold">Fecha</TableHead>
                  <TableHead className="text-white font-semibold">Código</TableHead>
                  <TableHead className="text-white font-semibold">Artículo</TableHead>
                  <TableHead className="text-white font-semibold">Config.</TableHead>
                  <TableHead className="text-white font-semibold text-center">Mes</TableHead>
                  <TableHead className="text-white font-semibold text-right">Cantidad</TableHead>
                  <TableHead className="text-white font-semibold text-right">P. Costo</TableHead>
                  <TableHead className="text-white font-semibold text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalleFiltered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.folio}</TableCell>
                    <TableCell className="font-medium max-w-[160px] truncate" title={r.nombre_cliente}>{r.nombre_cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{r.fecha}</TableCell>
                    <TableCell className="font-mono text-xs">{r.codigo_articulo}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={r.nombre_articulo}>{r.nombre_articulo}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.configuracion}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="uppercase text-xs">{r.mes}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.cantidad.toLocaleString('es-MX')}</TableCell>
                    <TableCell className="text-right">{fmt(r.precio_costo)}</TableCell>
                    <TableCell className="text-right font-semibold text-[#1e2a5e]">{fmt(r.importe_costo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                  <TableCell colSpan={9}>TOTAL ({detalleFiltered.length} registros)</TableCell>
                  <TableCell className="text-right">{fmt(detalleFiltered.reduce((s,r)=>s+r.importe_costo,0))}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
