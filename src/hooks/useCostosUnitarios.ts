import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ALL_ROWS } from './useSalesData';
import { getPesosCliente } from '../services/pesosService';
import { getResumen } from '../services/nominaService';
import type { PesosCliente } from '../types/pesos';
import type { ResumenRow } from '../types/nomina';
import { queryKeys } from '../lib/queryKeys';

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

// ─── Agregados de módulo (calculados una sola vez) ────────────────────────────

const TOTAL_ME_GLOBAL  = ALL_ROWS.reduce((s, r) => s + r.monto_me,  0);
const TOTAL_FLE_GLOBAL = ALL_ROWS.reduce((s, r) => s + r.monto_fle, 0);

type OCData = { nombre_cliente: string; kg: number; ventas: number };
const OC_MAP = new Map<string, OCData>();
ALL_ROWS.forEach(r => {
  if (!r.orden_venta) return;
  const prev = OC_MAP.get(r.orden_venta);
  if (prev) { prev.kg += r.peso_std; prev.ventas += r.importe; }
  else OC_MAP.set(r.orden_venta, { nombre_cliente: r.nombre_cliente, kg: r.peso_std, ventas: r.importe });
});

// ─── Cálculo ponderado ────────────────────────────────────────────────────────

function calcularCostos(pesos: PesosCliente[], nomina: ResumenRow[]): CostoOCRow[] {
  const pesosMap = new Map(pesos.map(p => [p.nombre_cliente, p]));
  const getPeso = (cliente: string, field: keyof Omit<PesosCliente, 'nombre_cliente'>): number =>
    pesosMap.get(cliente)?.[field] ?? 1;

  // Cachear pesos por cliente único para evitar lookups repetidos
  const clientePesos = new Map<string, Omit<PesosCliente, 'nombre_cliente'>>();
  OC_MAP.forEach(v => {
    if (!clientePesos.has(v.nombre_cliente)) {
      clientePesos.set(v.nombre_cliente, {
        peso_admin:       getPeso(v.nombre_cliente, 'peso_admin'),
        peso_almacen:     getPeso(v.nombre_cliente, 'peso_almacen'),
        peso_preparacion: getPeso(v.nombre_cliente, 'peso_preparacion'),
        peso_embarque:    getPeso(v.nombre_cliente, 'peso_embarque'),
        peso_me:          getPeso(v.nombre_cliente, 'peso_me'),
        peso_fletes:      getPeso(v.nombre_cliente, 'peso_fletes'),
      });
    }
  });

  // Primera pasada: denominadores Σ(kg × peso)
  let dAdmin = 0, dAlm = 0, dPrep = 0, dEmb = 0, dMe = 0, dFle = 0;
  OC_MAP.forEach(v => {
    const p = clientePesos.get(v.nombre_cliente)!;
    dAdmin += v.kg * p.peso_admin;
    dAlm   += v.kg * p.peso_almacen;
    dPrep  += v.kg * p.peso_preparacion;
    dEmb   += v.kg * p.peso_embarque;
    dMe    += v.kg * p.peso_me;
    dFle   += v.kg * p.peso_fletes;
  });

  const nom = Object.fromEntries(nomina.map(r => [r.seccion, r.total]));
  const tAdmin = nom['Administración'] ?? 0;
  const tAlm   = nom['Almacén']        ?? 0;
  const tPrep  = nom['Preparación']    ?? 0;
  const tEmb   = nom['Embarques']      ?? 0;

  // Segunda pasada: cuotas por OC (usa pesos ya cacheados)
  const rows: CostoOCRow[] = [];
  OC_MAP.forEach((v, oc) => {
    const p = clientePesos.get(v.nombre_cliente)!;
    const cuota_admin       = dAdmin > 0 ? tAdmin           * p.peso_admin       / dAdmin : 0;
    const cuota_almacen     = dAlm   > 0 ? tAlm             * p.peso_almacen     / dAlm   : 0;
    const cuota_preparacion = dPrep  > 0 ? tPrep            * p.peso_preparacion / dPrep  : 0;
    const cuota_embarque    = dEmb   > 0 ? tEmb             * p.peso_embarque    / dEmb   : 0;
    const cuota_me          = dMe    > 0 ? TOTAL_ME_GLOBAL  * p.peso_me          / dMe    : 0;
    const cuota_fletes      = dFle   > 0 ? TOTAL_FLE_GLOBAL * p.peso_fletes      / dFle   : 0;
    rows.push({
      orden_venta: oc, nombre_cliente: v.nombre_cliente, kg: v.kg, ventas: v.ventas,
      cuota_admin, cuota_almacen, cuota_preparacion, cuota_embarque, cuota_me, cuota_fletes,
      cuota_total: cuota_admin + cuota_almacen + cuota_preparacion + cuota_embarque + cuota_me + cuota_fletes,
    });
  });

  return rows.sort((a, b) => b.ventas - a.ventas);
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function useCostosUnitarios() {
  const { data: pesos = [], isLoading: loadingPesos, error: errPesos } = useQuery({
    queryKey: queryKeys.pesosCliente,
    queryFn: getPesosCliente,
  });

  const { data: nomina = [], isLoading: loadingNomina, error: errNomina } = useQuery({
    queryKey: queryKeys.nominaResumen,
    queryFn: getResumen,
  });

  const rows = useMemo(() => calcularCostos(pesos, nomina), [pesos, nomina]);

  return {
    rows,
    loading: loadingPesos || loadingNomina,
    error: errPesos?.message ?? errNomina?.message ?? null,
  };
}
