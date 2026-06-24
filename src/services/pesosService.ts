import { supabase } from '../lib/supabase';
import type { PesosCliente } from '../types/pesos';
import { DEFAULT_PESOS } from '../types/pesos';
import { ALL_ROWS } from '../hooks/useSalesData';

// Lista de clientes únicos derivada del CSV de ventas
function getClientesFromVentas(): string[] {
  const set = new Set<string>();
  ALL_ROWS.forEach(r => { if (r.nombre_cliente) set.add(r.nombre_cliente); });
  return Array.from(set).sort();
}

export function getClientes(): string[] {
  return getClientesFromVentas();
}

export async function getPesosCliente(): Promise<PesosCliente[]> {
  const { data, error } = await supabase
    .from('pesos_cliente')
    .select('nombre_cliente,peso_admin,peso_almacen,peso_preparacion,peso_embarque,peso_me,peso_fletes');

  const savedMap = new Map<string, PesosCliente>();
  if (!error && data) {
    data.forEach(r => savedMap.set(r.nombre_cliente, {
      nombre_cliente: r.nombre_cliente,
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

  // Un registro por cliente: guardado si existe, default (1) si no
  return getClientesFromVentas().map(nombre_cliente =>
    savedMap.get(nombre_cliente) ?? { nombre_cliente, ...DEFAULT_PESOS }
  );
}

export async function upsertPesosCliente(rows: PesosCliente[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('pesos_cliente')
    .upsert(rows, { onConflict: 'nombre_cliente' });
  if (error) throw new Error(error.message);
}
