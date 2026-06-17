/**
 * Seed maestro: ejecuta todos los seeds en orden correcto.
 * Ejecutar: npx tsx supabase/seeds/seed_all.ts
 *
 * Orden requerido:
 *   1. plantilla (depende de nada)
 *   2. nomina_detalle (FK -> plantilla)
 *   3. ventas (independiente)
 *   4. fletes_embarques (independiente)
 *   5. material_empaque_detalle (independiente)
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const seeds = [
  'seed_plantilla.ts',
  'seed_nomina_detalle.ts',
  'seed_ventas.ts',
  'seed_fletes.ts',
  'seed_material_empaque.ts',
];

for (const seed of seeds) {
  const file = resolve(__dirname, seed);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Ejecutando: ${seed}`);
  console.log('='.repeat(50));
  execSync(`npx tsx "${file}"`, {
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('\n✅ Todos los seeds completados exitosamente');
