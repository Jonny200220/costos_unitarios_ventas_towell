import { useState, useEffect, useMemo } from 'react';
import { ALL_ROWS } from './useSalesData';
import { getPesosOC } from '../services/pesosService';
import { getResumen } from '../services/nominaService';
import type { PesosOC } from '../types/pesos';
import type { ResumenRow } from '../types/nomina';

export type CostoOCRow = {
  orden_venta: string;
  nombre_cliente: string;
  kg: number;
  ventas: number;
  cuota_admin: number;
  cuota_almacen: number;
  cuota_preparacion: number;
  cuota_embarque: number;
  cuota_me: number;
  cuota_fletes: number;
  cuota_total: number;
};

// ─── Totales globales calculados una sola vez ─────────────────────────────────

const TOTAL_ME_GLOBAL  = ALL_ROWS.reduce((s, r) => s + r.monto_me, 0);
const TOTAL_FLE_GLOBAL = ALL_ROWS.reduce((s, r) => s + r.monto_fle, 0);

// ─── Agregado por OC (también calculado una sola vez) ─────────────────────────

type OCData = { nombre_cliente: string; kg: number; ventas: number };

const OC_MAP: Map<string, OCData> = new Map();
ALL_ROWS.forEach(r => {
  if (!r.orden_venta) return;
  const prev = OC_MAP.get(r.orden_venta);
  if (prev) {
    prev.kg     += r.peso_std;
    prev.ventas += r.importe;
  } else {
    OC_MAP.set(r.orden_venta, { nombre_cliente: r.nombre_cliente, kg: r.peso_std, ventas: r.importe });
  }
});

// ─── Cálculo ponderado ─────────────────────────────────────────────────────────

function calcularCostos(pesos: PesosOC[], nomina: ResumenRow[]): CostoOCRow[] {
  const pesosMap = new Map(pesos.map(p => [p.orden_venta, p]));
  const getPeso = (oc: string, field: keyof Omit<PesosOC, 'orden_venta'>): number =>
    pesosMap.get(oc)?.[field] ?? 1;

  // Denominador para cada área = Σ (kg_OC × peso_OC)
  let dAdmin = 0, dAlm = 0, dPrep = 0, dEmb = 0, dMe = 0, dFle = 0;
  OC_MAP.forEach((v, oc) => {
    dAdmin += v.kg * getPeso(oc, 'peso_admin');
    dAlm   += v.kg * getPeso(oc, 'peso_almacen');
    dPrep  += v.kg * getPeso(oc, 'peso_preparacion');
    dEmb   += v.kg * getPeso(oc, 'peso_embarque');
    dMe    += v.kg * getPeso(oc, 'peso_me');
    dFle   += v.kg * getPeso(oc, 'peso_fletes');
  });

  const nom = Object.fromEntries(nomina.map(r => [r.seccion, r.total]));
  const tAdmin = nom['Administración'] ?? 0;
  const tAlm   = nom['Almacén']       ?? 0;
  const tPrep  = nom['Preparación']   ?? 0;
  const tEmb   = nom['Embarques']     ?? 0;

  const rows: CostoOCRow[] = [];
  OC_MAP.forEach((v, oc) => {
    const pA  = getPeso(oc, 'peso_admin');
    const pAl = getPeso(oc, 'peso_almacen');
    const pPr = getPeso(oc, 'peso_preparacion');
    const pEm = getPeso(oc, 'peso_embarque');
    const pMe = getPeso(oc, 'peso_me');
    const pFl = getPeso(oc, 'peso_fletes');

    // Cuota $/kg = Costo total área × peso_OC / denominador
    const cuota_admin       = dAdmin > 0 ? tAdmin * pA  / dAdmin : 0;
    const cuota_almacen     = dAlm   > 0 ? tAlm   * pAl / dAlm   : 0;
    const cuota_preparacion = dPrep  > 0 ? tPrep  * pPr / dPrep  : 0;
    const cuota_embarque    = dEmb   > 0 ? tEmb   * pEm / dEmb   : 0;
    const cuota_me          = dMe    > 0 ? TOTAL_ME_GLOBAL  * pMe / dMe  : 0;
    const cuota_fletes      = dFle   > 0 ? TOTAL_FLE_GLOBAL * pFl / dFle : 0;
    const cuota_total = cuota_admin + cuota_almacen + cuota_preparacion + cuota_embarque + cuota_me + cuota_fletes;

    rows.push({ orden_venta: oc, nombre_cliente: v.nombre_cliente, kg: v.kg, ventas: v.ventas,
      cuota_admin, cuota_almacen, cuota_preparacion, cuota_embarque, cuota_me, cuota_fletes, cuota_total });
  });

  return rows.sort((a, b) => b.ventas - a.ventas);
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function useCostosUnitarios() {
  const [pesos, setPesos]   = useState<PesosOC[]>([]);
  const [nomina, setNomina] = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [p, n] = await Promise.all([getPesosOC(), getResumen()]);
        if (!cancelled) { setPesos(p); setNomina(n); }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => calcularCostos(pesos, nomina), [pesos, nomina]);

  return { rows, loading, error };
}
