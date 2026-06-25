import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ALL_ROWS } from './useSalesData';
import { getPesosCliente } from '../services/pesosService';
import { getConfigPreparacion } from '../services/configPreparacionService';
import { getResumen } from '../services/nominaService';
import type { PesosCliente } from '../types/pesos';
import type { ConfigPreparacionArticulo } from '../types/configPreparacion';
import type { ResumenRow } from '../types/nomina';
import { queryKeys } from '../lib/queryKeys';
import { effectiveWeight } from '../lib/formulaConfig';

export type CostoArticuloRow = {
  nombre_cliente: string;
  nombre_articulo: string;
  tamano: string;
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

type ArticuloKey = string;
type ArticuloData = { nombre_cliente: string; nombre_articulo: string; tamano: string; kg: number; ventas: number };
const ARTICULO_MAP = new Map<ArticuloKey, ArticuloData>();
ALL_ROWS.forEach(r => {
  if (!r.nombre_cliente || !r.nombre_articulo || !r.tamano) return;
  const key = `${r.nombre_cliente}||${r.nombre_articulo}||${r.tamano}`;
  const prev = ARTICULO_MAP.get(key);
  if (prev) { prev.kg += r.peso_std; prev.ventas += r.importe; }
  else ARTICULO_MAP.set(key, { nombre_cliente: r.nombre_cliente, nombre_articulo: r.nombre_articulo, tamano: r.tamano, kg: r.peso_std, ventas: r.importe });
});

// ─── Cálculo ponderado ────────────────────────────────────────────────────────

function getPrepEW(
  cliente: string,
  articulo: string,
  tamano: string,
  configMap: Map<string, ConfigPreparacionArticulo>,
  pesosMap: Map<string, PesosCliente>,
): number {
  const artKey = `${cliente}||${articulo}||${tamano}`;
  const artCfg = configMap.get(artKey);
  if (artCfg) return effectiveWeight(artCfg.peso_preparacion, artCfg.tiempo_preparacion);
  const clienteCfg = pesosMap.get(cliente);
  if (clienteCfg) return effectiveWeight(clienteCfg.peso_preparacion, clienteCfg.tiempo_preparacion);
  return effectiveWeight(1, 1);
}

function calcularCostos(pesos: PesosCliente[], configPreparacion: ConfigPreparacionArticulo[], nomina: ResumenRow[]): CostoArticuloRow[] {
  const pesosMap = new Map(pesos.map(p => [p.nombre_cliente, p]));
  const configMap = new Map(configPreparacion.map(c => [`${c.nombre_cliente}||${c.nombre_articulo}||${c.tamano}`, c]));
  const getPeso = (cliente: string, field: keyof Omit<PesosCliente, 'nombre_cliente'>): number =>
    pesosMap.get(cliente)?.[field] ?? 1;

  // Cachear peso efectivo por cliente único (peso × tiempo según FORMULA_MODE)
  type EW = { admin: number; alm: number; prep: number; emb: number; me: number; fle: number };
  const clienteEW = new Map<string, EW>();
  ARTICULO_MAP.forEach(v => {
    const c = v.nombre_cliente;
    if (!clienteEW.has(c)) {
      clienteEW.set(c, {
        admin: effectiveWeight(getPeso(c, 'peso_admin'),       getPeso(c, 'tiempo_admin')),
        alm:   effectiveWeight(getPeso(c, 'peso_almacen'),     getPeso(c, 'tiempo_almacen')),
        prep:  effectiveWeight(getPeso(c, 'peso_preparacion'), getPeso(c, 'tiempo_preparacion')),
        emb:   effectiveWeight(getPeso(c, 'peso_embarque'),    getPeso(c, 'tiempo_embarque')),
        me:    effectiveWeight(getPeso(c, 'peso_me'),          getPeso(c, 'tiempo_me')),
        fle:   effectiveWeight(getPeso(c, 'peso_fletes'),      getPeso(c, 'tiempo_fletes')),
      });
    }
  });

  // Primera pasada: denominadores Σ(kg × peso_efectivo)
  let dAdmin = 0, dAlm = 0, dPrep = 0, dEmb = 0, dMe = 0, dFle = 0;
  ARTICULO_MAP.forEach(v => {
    const ew = clienteEW.get(v.nombre_cliente)!;
    dAdmin += v.kg * ew.admin;
    dAlm   += v.kg * ew.alm;
    dPrep  += v.kg * getPrepEW(v.nombre_cliente, v.nombre_articulo, v.tamano, configMap, pesosMap);
    dEmb   += v.kg * ew.emb;
    dMe    += v.kg * ew.me;
    dFle   += v.kg * ew.fle;
  });

  const nom = Object.fromEntries(nomina.map(r => [r.seccion, r.total]));
  const tAdmin = nom['Administración'] ?? 0;
  const tAlm   = nom['Almacén']        ?? 0;
  const tPrep  = nom['Preparación']    ?? 0;
  const tEmb   = nom['Embarques']      ?? 0;

  // Segunda pasada: cuotas por OC (usa pesos efectivos ya cacheados)
  const rows: CostoArticuloRow[] = [];
  ARTICULO_MAP.forEach(v => {
    const ew = clienteEW.get(v.nombre_cliente)!;
    const prepEW = getPrepEW(v.nombre_cliente, v.nombre_articulo, v.tamano, configMap, pesosMap);
    const cuota_admin       = dAdmin > 0 ? tAdmin           * ew.admin / dAdmin : 0;
    const cuota_almacen     = dAlm   > 0 ? tAlm             * ew.alm   / dAlm   : 0;
    const cuota_preparacion = dPrep  > 0 ? tPrep            * prepEW   / dPrep  : 0;
    const cuota_embarque    = dEmb   > 0 ? tEmb             * ew.emb   / dEmb   : 0;
    const cuota_me          = dMe    > 0 ? TOTAL_ME_GLOBAL  * ew.me    / dMe    : 0;
    const cuota_fletes      = dFle   > 0 ? TOTAL_FLE_GLOBAL * ew.fle   / dFle   : 0;
    rows.push({
      nombre_cliente: v.nombre_cliente, nombre_articulo: v.nombre_articulo, tamano: v.tamano, kg: v.kg, ventas: v.ventas,
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

  const { data: configPreparacion = [], isLoading: loadingConfig, error: errConfig } = useQuery({
    queryKey: queryKeys.configPreparacion,
    queryFn: getConfigPreparacion,
  });

  const { data: nomina = [], isLoading: loadingNomina, error: errNomina } = useQuery({
    queryKey: queryKeys.nominaResumen,
    queryFn: getResumen,
  });

  const rows = useMemo(() => calcularCostos(pesos, configPreparacion, nomina), [pesos, configPreparacion, nomina]);

  return {
    rows,
    loading: loadingPesos || loadingConfig || loadingNomina,
    error: errPesos?.message ?? errConfig?.message ?? errNomina?.message ?? null,
  };
}
