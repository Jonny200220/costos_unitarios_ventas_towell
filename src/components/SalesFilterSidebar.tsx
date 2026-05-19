import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { SalesFilters } from '../hooks/useSalesData';

interface Props {
  filters: SalesFilters;
  options: Record<keyof Omit<SalesFilters, 'search'>, string[]>;
  onFilter: <K extends keyof SalesFilters>(key: K, value: SalesFilters[K]) => void;
  onReset: () => void;
  resultCount: number;
}

const FILTER_LABELS: { key: keyof Omit<SalesFilters, 'search'>; label: string }[] = [
  { key: 'mes', label: 'Mes' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'tipo_pedido', label: 'Tipo de Pedido' },
  { key: 'codigo_articulo', label: 'Código de Artículo' },
  { key: 'nombre_articulo', label: 'Nombre de Artículo' },
  { key: 'tamano', label: 'Tamaño' },
  { key: 'color', label: 'Color' },
  { key: 'calidad', label: 'Calidad' },
];

export default function SalesFilterSidebar({ filters, options, onFilter, onReset, resultCount }: Props) {
  const activeCount = Object.entries(filters)
    .filter(([k, v]) => k !== 'search' && v !== 'todos')
    .length + (filters.search ? 1 : 0);

  return (
    <aside className="w-52 flex-shrink-0">
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filtrar Por</p>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-6 px-2 text-xs text-[#1e2a5e]">
                Limpiar ({activeCount})
              </Button>
            )}
          </div>

          {/* Buscador */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
              Búsqueda
            </Label>
            <Input
              placeholder="Buscar..."
              value={filters.search}
              onChange={e => onFilter('search', e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <Separator className="my-3" />

          {/* Filtros dinámicos */}
          {FILTER_LABELS.map(({ key, label }) => (
            <div key={key} className="mb-3">
              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                {label}
              </Label>
              <Select
                value={filters[key]}
                onValueChange={v => onFilter(key, v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {options[key].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <Separator className="my-3" />

          <p className="text-xs text-muted-foreground text-center">
            <span className="font-bold text-foreground">{resultCount.toLocaleString()}</span> registros
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
