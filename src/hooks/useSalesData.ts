import { useMemo, useState } from 'react';
// Parsed once at module load — shared across all hook instances
import baseVentasRaw from '../database/base_ventas_ene_abr_26.csv?raw';

export type SalesRow = {
  fecha: string;
  mes: string;
  nombre_cliente: string;
  codigo_articulo: string;
  nombre_articulo: string;
  configuracion: string;
  tamano: string;
  color: string;
  calidad: string;
  empresa: string;
  tipo_pedido: string;
  cantidad: number;
  importe: number;
  monto_me: number;
  monto_fle: number;
  monto_myo: number;
};

export type SalesFilters = {
  codigo_articulo: string;
  nombre_articulo: string;
  tamano: string;
  color: string;
  calidad: string;
  empresa: string;
  tipo_pedido: string;
  mes: string;
  cliente: string;
  search: string;
};

const EMPTY_FILTERS: SalesFilters = {
  codigo_articulo: 'todos',
  nombre_articulo: 'todos',
  tamano: 'todos',
  color: 'todos',
  calidad: 'todos',
  empresa: 'todos',
  tipo_pedido: 'todos',
  mes: 'todos',
  cliente: 'todos',
  search: '',
};

function parseRaw(raw: string): SalesRow[] {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur);

    const g = (name: string) => (cols[idx(name)] ?? '').trim().replace(/^"|"$/g, '');
    const n = (name: string) => { const v = g(name); return isNaN(Number(v)) ? 0 : Number(v); };

    return {
      fecha: g('fecha'),
      mes: g('mes'),
      nombre_cliente: g('nombre_cliente'),
      codigo_articulo: g('codigo_articulo'),
      nombre_articulo: g('nombre_articulo'),
      configuracion: g('configuracion'),
      tamano: g('tamano'),
      color: g('color'),
      calidad: g('calidad'),
      empresa: g('empresa'),
      tipo_pedido: g('tipo_pedido'),
      cantidad: n('cantidad'),
      importe: n('importe'),
      monto_me: n('monto_me'),
      monto_fle: n('monto_fle'),
      monto_myo: n('monto_myo'),
    };
  });
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(v => v && v.trim()))).sort();
}

const ALL_ROWS: SalesRow[] = parseRaw(baseVentasRaw);

const OPTIONS = {
  codigo_articulo: unique(ALL_ROWS.map(r => r.codigo_articulo)),
  nombre_articulo: unique(ALL_ROWS.map(r => r.nombre_articulo)),
  tamano: unique(ALL_ROWS.map(r => r.tamano)),
  color: unique(ALL_ROWS.map(r => r.color)),
  calidad: unique(ALL_ROWS.map(r => r.calidad)),
  empresa: unique(ALL_ROWS.map(r => r.empresa)),
  tipo_pedido: unique(ALL_ROWS.map(r => r.tipo_pedido)),
  mes: unique(ALL_ROWS.map(r => r.mes)),
  cliente: unique(ALL_ROWS.map(r => r.nombre_cliente)),
};

export function useSalesData() {
  const [filters, setFilters] = useState<SalesFilters>(EMPTY_FILTERS);

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase();
    return ALL_ROWS.filter(r => {
      if (filters.codigo_articulo !== 'todos' && r.codigo_articulo !== filters.codigo_articulo) return false;
      if (filters.nombre_articulo !== 'todos' && r.nombre_articulo !== filters.nombre_articulo) return false;
      if (filters.tamano !== 'todos' && r.tamano !== filters.tamano) return false;
      if (filters.color !== 'todos' && r.color !== filters.color) return false;
      if (filters.calidad !== 'todos' && r.calidad !== filters.calidad) return false;
      if (filters.empresa !== 'todos' && r.empresa !== filters.empresa) return false;
      if (filters.tipo_pedido !== 'todos' && r.tipo_pedido !== filters.tipo_pedido) return false;
      if (filters.mes !== 'todos' && r.mes !== filters.mes) return false;
      if (filters.cliente !== 'todos' && r.nombre_cliente !== filters.cliente) return false;
      if (s) {
        const haystack = [r.nombre_cliente, r.codigo_articulo, r.nombre_articulo, r.color, r.tamano, r.empresa].join(' ').toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [filters]);

  function setFilter<K extends keyof SalesFilters>(key: K, value: SalesFilters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  return { filtered, filters, setFilter, resetFilters, options: OPTIONS };
}
