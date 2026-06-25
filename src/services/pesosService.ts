import { supabase } from '../lib/supabase';
import type { PesosCliente } from '../types/pesos';
import { DEFAULT_PESOS } from '../types/pesos';
import { ALL_ROWS } from '../hooks/useSalesData';

const CLIENTES: string[] = Array.from(
  new Set(ALL_ROWS.filter(r => r.nombre_cliente).map(r => r.nombre_cliente))
).sort();

export function getClientes(): string[] {
  return CLIENTES;
}

const SELECT_FIELDS = [
  'nombre_cliente',
  'peso_admin', 'peso_almacen', 'peso_preparacion', 'peso_embarque', 'peso_me', 'peso_fletes',
  'tiempo_admin', 'tiempo_almacen', 'tiempo_preparacion', 'tiempo_embarque', 'tiempo_me', 'tiempo_fletes',
].join(',');

export async function getPesosCliente(): Promise<PesosCliente[]> {
  const { data, error } = await supabase
    .from('pesos_cliente')
    .select(SELECT_FIELDS)
    .returns<PesosCliente[]>();

  const savedMap = new Map<string, PesosCliente>();
  if (!error && data) {
    data.forEach(r => savedMap.set(r.nombre_cliente, {
      nombre_cliente:     r.nombre_cliente,
      peso_admin:         r.peso_admin,
      peso_almacen:       r.peso_almacen,
      peso_preparacion:   r.peso_preparacion,
      peso_embarque:      r.peso_embarque,
      peso_me:            r.peso_me,
      peso_fletes:        r.peso_fletes,
      tiempo_admin:       Number(r.tiempo_admin)       || 1,
      tiempo_almacen:     Number(r.tiempo_almacen)     || 1,
      tiempo_preparacion: Number(r.tiempo_preparacion) || 1,
      tiempo_embarque:    Number(r.tiempo_embarque)    || 1,
      tiempo_me:          Number(r.tiempo_me)          || 1,
      tiempo_fletes:      Number(r.tiempo_fletes)      || 1,
    }));
  } else {
    console.warn('pesosService: fallback defaults', error?.message);
  }

  return CLIENTES.map(nombre_cliente =>
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
