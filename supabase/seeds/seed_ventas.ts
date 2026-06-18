/**
 * Seed: ventas
 * Ejecutar: npx tsx supabase/seeds/seed_ventas.ts
 * NOTA: el CSV tiene ~56 columnas, solo se insertan las que usa la app.
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

const BATCH_SIZE = 1000;

const csvPath = resolve(__dirname, '../../src/database/base_ventas_ene_abr_26.csv');
const raw = readFileSync(csvPath, 'utf-8');

const lines = raw.trim().split('\n').filter(l => l.trim());
const headers = lines[0].split(',').map(h => h.trim());

function idx(name: string) {
  const i = headers.indexOf(name);
  if (i === -1) throw new Error(`Columna no encontrada: "${name}"`);
  return i;
}

// Pre-calcular índices una sola vez
const iFecha = idx('fecha');
const iMes = idx('mes');
const iCliente = idx('nombre_cliente');
const iCodArt = idx('codigo_articulo2');
const iNomArt = idx('nombre_articulo');
const iConfig = idx('configuracion');
const iTamano = idx('tamano');
const iColor = idx('color');
const iCalidad = idx('calidad');
const iEmpresa = idx('empresa');
const iTipoPed = idx('tipo_pedido');
const iCantidad = idx('cantidad');
const iPesoStd = idx('peso_std');
const iImporte = idx('importe2');
const iMontoMe = idx('monto_me');
const iMontoFle = idx('monto_fle');
const iMontoMyo = idx('monto_myo');

const dataLines = lines.slice(1);
console.log(`Cargando ${dataLines.length} registros de ventas en batches de ${BATCH_SIZE}...`);

for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
  const batch = dataLines.slice(i, i + BATCH_SIZE).map(line => {
    const c = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    return {
      fecha: c[iFecha] || null,
      mes: c[iMes],
      nombre_cliente: c[iCliente],
      codigo_articulo: c[iCodArt],
      nombre_articulo: c[iNomArt],
      configuracion: c[iConfig],
      tamano: c[iTamano],
      color: c[iColor],
      calidad: c[iCalidad],
      empresa: c[iEmpresa],
      tipo_pedido: c[iTipoPed],
      cantidad: Number(c[iCantidad]) || 0,
      peso_std: Number(c[iPesoStd]) || 0,
      importe: Number(c[iImporte]) || 0,
      monto_me: Number(c[iMontoMe]) || 0,
      monto_fle: Number(c[iMontoFle]) || 0,
      monto_myo: Number(c[iMontoMyo]) || 0,
    };
  });

  const { error } = await supabase.from('ventas').insert(batch);
  if (error) {
    console.error(`Error en batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} (${Math.min(i + BATCH_SIZE, dataLines.length)}/${dataLines.length})`);
}

console.log('✓ Ventas cargadas correctamente');
