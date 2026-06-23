import { useState, useMemo } from 'react';
import { Save, RotateCcw, Sliders, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import TablePagination from '../../components/TablePagination';
import { usePagination } from '../../hooks/usePagination';
import { usePesosCRUD } from './hooks/usePesosCRUD';
import { AREAS } from '../../types/pesos';
import type { PesosOC } from '../../types/pesos';
import { getOCsWithCliente } from '../../services/pesosService';
import { fmtNum } from '../../lib/format';
import { ALL_ROWS } from '../../hooks/useSalesData';

// ─── KG por OC precalculado ───────────────────────────────────────────────────

const KG_POR_OC: Map<string, number> = new Map();
ALL_ROWS.forEach(r => {
  if (!r.orden_venta) return;
  KG_POR_OC.set(r.orden_venta, (KG_POR_OC.get(r.orden_venta) ?? 0) + r.peso_std);
});

// ─── Selector de peso 1-2-3-4 ─────────────────────────────────────────────────

function WeightSelector({
  value,
  onChange,
  activeColor,
}: {
  value: number;
  onChange: (v: number) => void;
  activeColor: string;
}) {
  return (
    <div className="flex gap-0.5">
      {([1, 2, 3, 4] as const).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={[
            'w-6 h-6 rounded text-xs font-bold transition-colors',
            value === v
              ? `${activeColor} text-white shadow-sm`
              : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const OC_CLIENTE = getOCsWithCliente();

export default function PesosOCPage() {
  const { rows, isDirty, loading, saving, error, update, save, cancel } = usePesosCRUD();
  const [search, setSearch] = useState('');

  const pesosMap = useMemo(
    () => new Map(rows.map(r => [r.orden_venta, r])),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return OC_CLIENTE.filter(
      oc => !q || oc.orden_venta.toLowerCase().includes(q) || oc.nombre_cliente.toLowerCase().includes(q),
    );
  }, [search]);

  const pag = usePagination(filtered, 25);

  function handleChange(orden_venta: string, field: keyof PesosOC, value: number) {
    update(orden_venta, field, value);
  }

  const thC = 'text-white font-semibold text-xs py-2 whitespace-nowrap';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e2a5e] flex items-center justify-center shrink-0">
            <Sliders className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e2a5e]">Pesos por Orden de Venta</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Asigna un esfuerzo del <strong>1 al 4</strong> por área para cada OC.
              El sistema distribuye el costo total de cada área proporcionalmente:
              una OC con peso 4 absorbe cuatro veces más cuota que una con peso 1.
            </p>
          </div>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
            <Button size="sm" onClick={save} disabled={saving}
              className="bg-[#1e2a5e] hover:bg-[#1e2a5e]/90 text-white">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar OC o cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-3">
        {AREAS.map(a => (
          <div key={a.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded-sm ${a.color}`} />
            {a.label}
          </div>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Cargando órdenes de venta...</div>
      ) : (
        <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                  <TableHead className={`${thC} text-left`}>Orden de Venta</TableHead>
                  <TableHead className={`${thC} text-left`}>Cliente</TableHead>
                  <TableHead className={`${thC} text-right`}>Kg Total</TableHead>
                  {AREAS.map(a => (
                    <TableHead key={a.key} className={`${thC} text-center`}>
                      {a.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pag.paged.map((oc, i) => {
                  const p = pesosMap.get(oc.orden_venta);
                  const kg = KG_POR_OC.get(oc.orden_venta) ?? 0;
                  const isDirtyRow = p?._dirty;
                  return (
                    <TableRow
                      key={oc.orden_venta}
                      className={[
                        i % 2 === 0 ? '' : 'bg-muted/30',
                        isDirtyRow ? 'ring-1 ring-inset ring-amber-400/60' : '',
                      ].join(' ')}
                    >
                      <TableCell className="text-xs font-mono font-medium py-1.5">
                        {oc.orden_venta}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 max-w-[160px] truncate" title={oc.nombre_cliente}>
                        {oc.nombre_cliente}
                      </TableCell>
                      <TableCell className="text-xs text-right py-1.5 text-muted-foreground">
                        {fmtNum(kg, 0)}
                      </TableCell>
                      {AREAS.map(a => (
                        <TableCell key={a.key} className="py-1.5 text-center">
                          <div className="flex justify-center">
                            <WeightSelector
                              value={p?.[a.field as keyof PesosOC] as number ?? 1}
                              onChange={v => handleChange(oc.orden_venta, a.field as keyof PesosOC, v)}
                              activeColor={a.color}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={pag.page}
            totalPages={pag.totalPages}
            totalItems={filtered.length}
            pageSize={pag.pageSize}
            onPageChange={pag.setPage}
          />
        </div>
      )}
    </div>
  );
}
