/**
 * Seed: material_empaque_detalle
 * Ejecutar: npx tsx supabase/seeds/seed_material_empaque.ts
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

const BATCH_SIZE = 500;

const csvPath = resolve(__dirname, '../../src/database/material_empaque_detalle.csv');
const raw = readFileSync(csvPath, 'utf-8');
const rows = parseCSV(raw).filter(r => r['folio']);

const records = rows.map(r => ({
  folio: Number(r['folio']) || 0,
  cuenta_cliente: r['cuenta_cliente'],
  nombre_cliente: r['nombre_cliente'],
  fecha: r['fecha'] || null,
  codigo_articulo: r['codigo_articulo'],
  nombre_articulo: r['nombre_articulo'],
  configuracion: r['configuracion'],
  tamano: r['tamano'],
  cantidad: Number(r['cantidad']) || 0,
  precio_costo: Number(r['precio_costo']) || 0,
  importe_costo: Number(r['importe_costo']) || 0,
  mes: r['mes'],
  cliente_agrupado: r['cliente_agrupado'],
}));

console.log(`Cargando ${records.length} registros de material de empaque en batches de ${BATCH_SIZE}...`);

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('material_empaque_detalle').insert(batch);
  if (error) {
    console.error(`Error en batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} (${Math.min(i + BATCH_SIZE, records.length)}/${records.length})`);
}

console.log('✓ Material de empaque cargado correctamente');
