import { useMemo, useState } from 'react';
import { RotateCcw, Save, Search, Settings2, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { fmtMXN, fmtNum } from '../../lib/format';
import { ARTICULOS_PREPARACION, keyConfigPreparacion, useConfigPreparacionCRUD } from './hooks/useConfigPreparacionCRUD';
import { WeightSelector, TiempoInput } from './components/PesosInputs';

const CLIENTES = Array.from(new Set(ARTICULOS_PREPARACION.map(r => r.nombre_cliente))).sort();
const ARTICULOS_POR_CLIENTE = ARTICULOS_PREPARACION.reduce((map, r) => {
  map.set(r.nombre_cliente, (map.get(r.nombre_cliente) ?? 0) + 1);
  return map;
}, new Map<string, number>());

export default function ConfigPreparacionPage() {
  const [selectedCliente, setSelectedCliente] = useState(CLIENTES[0] ?? '');
  const [search, setSearch] = useState('');
  const { rows, isDirty, loading, saving, error, update, reset, save, cancel } = useConfigPreparacionCRUD(selectedCliente);

  const clientesFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return CLIENTES.filter(c => !q || c.toLowerCase().includes(q));
  }, [search]);

  const overrideCounts = useMemo(() => rows.reduce((n, r) => n + (r._isDefault ? 0 : 1), 0), [rows]);
  const thC = 'text-white font-semibold text-xs py-2 sticky top-0 bg-[#1e2a5e] whitespace-nowrap';

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e2a5e] flex items-center justify-center shrink-0">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e2a5e]">Preparación por Artículo</h2>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Define overrides de esfuerzo y tiempo para combinaciones cliente + artículo + tamaño.
            </p>
          </div>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
            <Button size="sm" onClick={() => save()} disabled={saving}
              className="bg-[#1e2a5e] hover:bg-[#1e2a5e]/90 text-white">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs bg-white">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {clientesFiltrados.map(cliente => {
              const selected = cliente === selectedCliente;
              const count = ARTICULOS_POR_CLIENTE.get(cliente) ?? 0;
              return (
                <button key={cliente} type="button" onClick={() => setSelectedCliente(cliente)}
                  className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-muted/60 ${selected ? 'bg-[#1e2a5e]/5' : ''}`}>
                  <div className="text-xs font-medium truncate" title={cliente}>{cliente}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{count} artículos</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs bg-white">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Cargando artículos...</div>
          ) : (
            <>
              <div className="overflow-auto max-h-[560px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                      <TableHead className={`${thC} text-left`}>Artículo</TableHead>
                      <TableHead className={`${thC} text-left`}>Tamaño</TableHead>
                      <TableHead className={`${thC} text-right`}>Kg</TableHead>
                      <TableHead className={`${thC} text-center`}>Esfuerzo</TableHead>
                      <TableHead className={`${thC} text-center`}>Tiempo</TableHead>
                      <TableHead className={`${thC} text-center`}>Estado</TableHead>
                      <TableHead className={`${thC} text-center`}>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const base = ARTICULOS_PREPARACION.find(r => keyConfigPreparacion(r) === keyConfigPreparacion(row));
                      return (
                        <TableRow key={keyConfigPreparacion(row)} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <TableCell className="text-xs font-medium max-w-[220px] truncate" title={row.nombre_articulo}>{row.nombre_articulo}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.tamano}</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{fmtNum(base?.kg ?? 0, 0)}</TableCell>
                          <TableCell>
                            <WeightSelector value={row.peso_preparacion} onChange={v => update(row, 'peso_preparacion', v)} activeColor="bg-violet-500" />
                          </TableCell>
                          <TableCell>
                            <TiempoInput value={row.tiempo_preparacion} onChange={v => update(row, 'tiempo_preparacion', v)} />
                          </TableCell>
                          <TableCell className="text-center">
                            {row._isDefault
                              ? <Badge variant="secondary" className="text-xs">Heredado</Badge>
                              : <Badge className="text-xs bg-orange-500 hover:bg-orange-500">Custom</Badge>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => reset(row)} disabled={row._isDefault && !row._dirty}>
                              <Undo2 className="h-3.5 w-3.5 mr-1" /> Reset
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center gap-3">
                <span>{rows.length} artículos</span>
                <span>{overrideCounts} con override</span>
                <span>{fmtMXN(rows.reduce((s, r) => s + (ARTICULOS_PREPARACION.find(a => keyConfigPreparacion(a) === keyConfigPreparacion(r))?.ventas ?? 0), 0))} ventas</span>
                {isDirty && <span className="text-amber-600 font-medium">● Cambios sin guardar</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
