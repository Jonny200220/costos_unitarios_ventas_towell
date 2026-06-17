/**
 * Seed: plantilla
 * Ejecutar: npx tsx supabase/seeds/seed_plantilla.ts
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

const ANIO = 2026;

const csvPath = resolve(__dirname, '../../src/database/nomina_plantilla.csv');
const raw = readFileSync(csvPath, 'utf-8');
const rows = parseCSV(raw).filter(r => r['ID'] && r['ID'] !== 'ID' && r['ID'] !== 'TOTAL');

const records = rows.map(r => ({
  id: r['ID'],
  anio: ANIO,
  seccion: r['Sección'],
  subseccion: r['Subsección']?.trim() ?? '',
  puesto: r['Puesto'],
  sueldo_mensual: Number(r['Sueldo Mensual Bruto']) || 0,
  tipo_pago: r['Tipo Pago']?.trim().toLowerCase() ?? 'semanal',
}));

console.log(`Cargando ${records.length} registros de plantilla...`);

const { error } = await supabase
  .from('plantilla')
  .upsert(records, { onConflict: 'id,anio' });

if (error) {
  console.error('Error al cargar plantilla:', error.message);
  process.exit(1);
}

console.log('✓ Plantilla cargada correctamente');
