/**
 * Seed: nomina_detalle
 * Ejecutar: npx tsx supabase/seeds/seed_nomina_detalle.ts
 * IMPORTANTE: ejecutar DESPUÉS de seed_plantilla.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
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
const BATCH_SIZE = 500;

const csvPath = resolve(__dirname, '../../src/database/nomina_detalle.csv');
const raw = readFileSync(csvPath, 'utf-8');
const rows = parseCSV(raw).filter(r => r['ID'] && r['ID'] !== 'ID');

const records = rows.map(r => ({
  empleado_id: r['ID'],
  anio: ANIO,
  seccion: r['Sección'],
  subseccion: r['Subsección']?.trim() ?? '',
  puesto: r['Puesto'],
  mes: r['Mes'],
  periodo: r['Periodo'],
  fecha_inicio: r['Fecha Inicio'] || null,
  fecha_fin: r['Fecha Fin'] || null,
  dias_lab: Number(r['Días Lab.']) || 0,
  horas: Number(r['Horas']) || 0,
  sueldo_diario: Number(r['Sueldo Diario']) || 0,
  pago_periodo: Number(r['Pago Periodo']) || 0,
  tipo_pago: r['Tipo Pago']?.trim().toLowerCase() ?? 'semanal',
  jornada: r['Jornada']?.trim() ?? '',
}));

console.log(`Cargando ${records.length} registros de nómina detalle en batches de ${BATCH_SIZE}...`);

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('nomina_detalle').insert(batch);
  if (error) {
    console.error(`Error en batch ${i / BATCH_SIZE + 1}:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓ Batch ${i / BATCH_SIZE + 1} (${Math.min(i + BATCH_SIZE, records.length)}/${records.length})`);
}

console.log('✓ Nómina detalle cargada correctamente');
