import { supabase } from '../lib/supabase';
import type { PesosOC } from '../types/pesos';
import { DEFAULT_PESOS } from '../types/pesos';
import { ALL_ROWS } from '../hooks/useSalesData';

// Unique OC list derived from ventas CSV, sorted by orden_venta
function getOCsFromVentas(): { orden_venta: string; nombre_cliente: string }[] {
  const map = new Map<string, string>();
  ALL_ROWS.forEach(r => {
    if (r.orden_venta && !map.has(r.orden_venta)) {
      map.set(r.orden_venta, r.nombre_cliente);
    }
  });
  return Array.from(map.entries())
    .map(([orden_venta, nombre_cliente]) => ({ orden_venta, nombre_cliente }))
    .sort((a, b) => a.orden_venta.localeCompare(b.orden_venta));
}

export function getOCsWithCliente(): { orden_venta: string; nombre_cliente: string }[] {
  return getOCsFromVentas();
}

export async function getPesosOC(): Promise<PesosOC[]> {
  const { data, error } = await supabase
    .from('pesos_oc')
    .select('orden_venta,peso_admin,peso_almacen,peso_preparacion,peso_embarque,peso_me,peso_fletes');

  const savedMap = new Map<string, PesosOC>();
  if (!error && data) {
    data.forEach(r => savedMap.set(r.orden_venta, {
      orden_venta: r.orden_venta,
      peso_admin: r.peso_admin,
      peso_almacen: r.peso_almacen,
      peso_preparacion: r.peso_preparacion,
      peso_embarque: r.peso_embarque,
      peso_me: r.peso_me,
      peso_fletes: r.peso_fletes,
    }));
  } else {
    console.warn('pesosService: fallback defaults', error?.message);
  }

  // Return one row per OC: saved values if exist, defaults otherwise
  return getOCsFromVentas().map(({ orden_venta }) =>
    savedMap.get(orden_venta) ?? { orden_venta, ...DEFAULT_PESOS }
  );
}

export async function upsertPesosOC(rows: PesosOC[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('pesos_oc')
    .upsert(rows, { onConflict: 'orden_venta' });
  if (error) throw new Error(error.message);
}
