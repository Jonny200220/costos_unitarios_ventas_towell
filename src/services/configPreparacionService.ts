import { supabase } from '../lib/supabase';
import type { ConfigPreparacionArticulo } from '../types/configPreparacion';

const SELECT_FIELDS = [
  'nombre_cliente',
  'nombre_articulo',
  'tamano',
  'peso_preparacion',
  'tiempo_preparacion',
].join(',');

export async function getConfigPreparacion(): Promise<ConfigPreparacionArticulo[]> {
  const { data, error } = await supabase
    .from('config_preparacion_articulo')
    .select(SELECT_FIELDS)
    .returns<ConfigPreparacionArticulo[]>();

  if (error) {
    console.warn('configPreparacionService: fallback empty', error.message);
    return [];
  }

  return (data ?? []).map(r => ({
    nombre_cliente: r.nombre_cliente,
    nombre_articulo: r.nombre_articulo,
    tamano: r.tamano,
    peso_preparacion: Number(r.peso_preparacion) || 1,
    tiempo_preparacion: Number(r.tiempo_preparacion) || 1,
  }));
}

export async function upsertConfigPreparacion(rows: ConfigPreparacionArticulo[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('config_preparacion_articulo')
    .upsert(rows, { onConflict: 'nombre_cliente,nombre_articulo,tamano' });
  if (error) throw new Error(error.message);
}

export async function deleteConfigPreparacion(keys: Pick<ConfigPreparacionArticulo, 'nombre_cliente' | 'nombre_articulo' | 'tamano'>[]): Promise<void> {
  if (keys.length === 0) return;

  for (const key of keys) {
    const { error } = await supabase
      .from('config_preparacion_articulo')
      .delete()
      .eq('nombre_cliente', key.nombre_cliente)
      .eq('nombre_articulo', key.nombre_articulo)
      .eq('tamano', key.tamano);
    if (error) throw new Error(error.message);
  }
}
