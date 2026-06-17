import { ALL_ROWS } from '../hooks/useSalesData';
import type { SalesRow } from '../types/ventas';

// ─── Public API ───────────────────────────────────────────────────────────────
// When Supabase is ready, replace the body of each function with a query.

export function getAllVentas(): SalesRow[] {
  return ALL_ROWS;
}

export function getVentasByMes(mes: string): SalesRow[] {
  return ALL_ROWS.filter(r => r.mes === mes);
}

export function getTotalPesoKg(): number {
  return ALL_ROWS.reduce((s, r) => s + r.peso_std, 0);
}

export function getPesoKgByMes(mes: string): number {
  return ALL_ROWS.filter(r => r.mes === mes).reduce((s, r) => s + r.peso_std, 0);
}
