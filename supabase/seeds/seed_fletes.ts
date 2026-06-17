/**
 * Seed: fletes_embarques
 * Ejecutar: npx tsx supabase/seeds/seed_fletes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
);

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
  });
}

const csvPath = resolve(__dirname, '../../src/database/fletes_embarques.csv');
const raw = readFileSync(csvPath, 'utf-8');
const rows = parseCSV(raw).filter(r => r['folio']);

const records = rows.map(r => ({
  folio: r['folio'],
  proveedor: r['proveedor'],
  cliente: r['cliente'],
  vehiculo: r['vehiculo'],
  destino: r['destino'],
  fecha_envio: r['fecha_envio'] || null,
  hora_carga: r['hora_carga'] || null,
  prioridad: Number(r['prioridad']) || 0,
  precio_flete: Number(r['precio_flete']) || 0,
  importe_otros: Number(r['importe_otros']) || 0,
  importe_agregados: Number(r['importe_agregados']) || 0,
  importe_total: Number(r['importe_total']) || 0,
  flete: Number(r['flete']) || 0,
  maniobras_y_otros: Number(r['maniobras_y_otros']) || 0,
  mes: r['mes'],
}));

console.log(`Cargando ${records.length} registros de fletes...`);

const { error } = await supabase
  .from('fletes_embarques')
  .upsert(records, { onConflict: 'folio' });

if (error) {
  console.error('Error al cargar fletes:', error.message);
  process.exit(1);
}

console.log('✓ Fletes cargados correctamente');
