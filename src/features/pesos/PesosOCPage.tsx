import { useState, useMemo } from 'react';
import { Save, RotateCcw, Sliders, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePesosCRUD } from './hooks/usePesosCRUD';
import { AREAS } from '../../types/pesos';
import type { PesosCliente } from '../../types/pesos';
import { fmtNum } from '../../lib/format';
import { ALL_ROWS } from '../../hooks/useSalesData';

// ─── KG y OC count por cliente ────────────────────────────────────────────────

const STATS_POR_CLIENTE = new Map<string, { kg: number; ocs: Set<string> }>();
ALL_ROWS.forEach(r => {
  if (!r.nombre_cliente) return;
  const prev = STATS_POR_CLIENTE.get(r.nombre_cliente);
  if (prev) { prev.kg += r.peso_std; if (r.orden_venta) prev.ocs.add(r.orden_venta); }
  else STATS_POR_CLIENTE.set(r.nombre_cliente, { kg: r.peso_std, ocs: new Set(r.orden_venta ? [r.orden_venta] : []) });
});

// ─── Selector compacto 1-2-3-4 ────────────────────────────────────────────────

function WeightSelector({ value, onChange, activeColor }: {
  value: number; onChange: (v: number) => void; activeColor: string;
}) {
  return (
    <div className="flex gap-0.5">
      {([1, 2, 3, 4] as const).map(v => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={[
            'w-6 h-6 rounded text-xs font-bold transition-colors',
            value === v ? `${activeColor} text-white shadow-sm` : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PesosClientePage() {
  const { rows, isDirty, loading, saving, error, update, save, cancel } = usePesosCRUD();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => !q || r.nombre_cliente.toLowerCase().includes(q));
  }, [rows, search]);

  const thC = 'text-white font-semibold text-xs py-2 whitespace-nowrap sticky top-0 bg-[#1e2a5e]';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e2a5e] flex items-center justify-center shrink-0">
            <Sliders className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e2a5e]">Pesos por Cliente</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Asigna un nivel de esfuerzo del <strong>1 al 4</strong> por área para cada cliente.
              Todas sus órdenes de compra heredan estos pesos automáticamente.
              Con todos en 1, el costo se distribuye proporcional al kg.
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
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
      )}

      {/* Leyenda + buscador */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <div className="flex flex-wrap gap-3">
          {AREAS.map(a => (
            <div key={a.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-3 h-3 rounded-sm ${a.color}`} />
              {a.label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Cargando clientes...</div>
      ) : (
        <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
          <div className="overflow-auto max-h-[480px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                  <TableHead className={`${thC} text-left`}>Cliente</TableHead>
                  <TableHead className={`${thC} text-right`}>OCs</TableHead>
                  <TableHead className={`${thC} text-right`}>Kg Total</TableHead>
                  {AREAS.map(a => (
                    <TableHead key={a.key} className={`${thC} text-center`}>{a.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => {
                  const stats = STATS_POR_CLIENTE.get(row.nombre_cliente);
                  return (
                    <TableRow key={row.nombre_cliente}
                      className={[
                        i % 2 === 0 ? '' : 'bg-muted/30',
                        row._dirty ? 'ring-1 ring-inset ring-amber-400/60' : '',
                      ].join(' ')}
                    >
                      <TableCell className="text-xs font-medium py-2 max-w-[200px] truncate"
                        title={row.nombre_cliente}>
                        {row.nombre_cliente}
                      </TableCell>
                      <TableCell className="text-xs text-right py-2 text-muted-foreground">
                        {stats?.ocs.size ?? 0}
                      </TableCell>
                      <TableCell className="text-xs text-right py-2 text-muted-foreground">
                        {fmtNum(stats?.kg ?? 0, 0)}
                      </TableCell>
                      {AREAS.map(a => (
                        <TableCell key={a.key} className="py-2 text-center">
                          <div className="flex justify-center">
                            <WeightSelector
                              value={row[a.field as keyof PesosCliente] as number}
                              onChange={v => update(row.nombre_cliente, a.field as keyof PesosCliente, v)}
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
          <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            {filtered.length} clientes
            {isDirty && <span className="ml-3 text-amber-600 font-medium">● Cambios sin guardar</span>}
          </div>
        </div>
      )}
    </div>
  );
}
