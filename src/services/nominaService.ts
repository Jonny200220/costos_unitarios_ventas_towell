import nominaDetalleRaw from '../database/nomina_detalle.csv?raw';
import nominaPlantillaRaw from '../database/nomina_plantilla.csv?raw';
import nominaResumenRaw from '../database/nomina_resumen_seccion_mes.csv?raw';
import { parseCSV } from '../lib/csv';
import { supabase } from '../lib/supabase';
import type { DetalleRow, PlantillaRow, ResumenRow, Seccion } from '../types/nomina';

// ─── CSV fallback (parsed once at module load) ────────────────────────────────

const CSV_DETALLE: DetalleRow[] = parseCSV(nominaDetalleRaw)
  .filter(r => r['ID'] && r['ID'] !== 'ID')
  .map(r => ({
    id: r['ID'],
    seccion: r['Sección'],
    puesto: r['Puesto'],
    mes: r['Mes'],
    periodo: r['Periodo'],
    dias: Number(r['Días Lab.']) || 0,
    horas: Number(r['Horas']) || 0,
    sueldoDiario: Number(r['Sueldo Diario']) || 0,
    pagoPeriodo: Number(r['Pago Periodo']) || 0,
    tipoPago: r['Tipo Pago'],
  }));

const CSV_PLANTILLA: PlantillaRow[] = parseCSV(nominaPlantillaRaw)
  .filter(r => r['ID'] && r['ID'] !== 'ID' && r['ID'] !== 'TOTAL')
  .map(r => ({
    id: r['ID'],
    seccion: r['Sección'],
    subseccion: r['Subsección'] ?? '',
    puesto: r['Puesto'],
    sueldoMensual: Number(r['Sueldo Mensual Bruto']) || 0,
    tipoPago: r['Tipo Pago'],
  }));

const CSV_RESUMEN: ResumenRow[] = parseCSV(nominaResumenRaw)
  .filter(r => r['Sección'] && r['Sección'] !== 'Sección' && r['Sección'] !== 'TOTAL')
  .map(r => ({
    seccion: r['Sección'],
    ene: Number(r['Enero']) || 0,
    feb: Number(r['Febrero']) || 0,
    mar: Number(r['Marzo']) || 0,
    abr: Number(r['Abril']) || 0,
    total: Number(r['Total']) || 0,
    personas: Number(r['Personas']) || 0,
  }));

// ─── Sync accessors (CSV) — usados internamente y en usePlantillaCRUD ─────────

export function getPlantilla(seccion?: Seccion): PlantillaRow[] {
  if (!seccion) return CSV_PLANTILLA;
  return CSV_PLANTILLA.filter(r => r.seccion === seccion);
}

// ─── Async API (Supabase) ─────────────────────────────────────────────────────

export async function getNominaDetalle(seccion?: Seccion): Promise<DetalleRow[]> {
  let query = supabase
    .from('nomina_detalle')
    .select('empleado_id,seccion,puesto,mes,periodo,dias_lab,horas,sueldo_diario,pago_periodo,tipo_pago');

  if (seccion) query = query.eq('seccion', seccion);

  const { data, error } = await query;

  if (error || !data) {
    console.warn('nominaService: fallback CSV (nomina_detalle)', error?.message);
    return seccion ? CSV_DETALLE.filter(r => r.seccion === seccion) : CSV_DETALLE;
  }

  return data.map(r => ({
    id: r.empleado_id,
    seccion: r.seccion,
    puesto: r.puesto,
    mes: r.mes,
    periodo: r.periodo,
    dias: r.dias_lab,
    horas: r.horas,
    sueldoDiario: Number(r.sueldo_diario),
    pagoPeriodo: Number(r.pago_periodo),
    tipoPago: r.tipo_pago,
  }));
}

export async function getPlantillaAsync(seccion?: Seccion): Promise<PlantillaRow[]> {
  let query = supabase
    .from('plantilla')
    .select('id,seccion,subseccion,puesto,sueldo_mensual,tipo_pago');

  if (seccion) query = query.eq('seccion', seccion);

  const { data, error } = await query;

  if (error || !data) {
    console.warn('nominaService: fallback CSV (plantilla)', error?.message);
    return getPlantilla(seccion);
  }

  return data.map(r => ({
    id: r.id,
    seccion: r.seccion,
    subseccion: r.subseccion ?? '',
    puesto: r.puesto,
    sueldoMensual: Number(r.sueldo_mensual),
    tipoPago: r.tipo_pago,
  }));
}

export async function getResumen(): Promise<ResumenRow[]> {
  const { data, error } = await supabase
    .from('nomina_detalle')
    .select('seccion,mes,pago_periodo,empleado_id');

  if (error || !data) {
    console.warn('nominaService: fallback CSV (resumen)', error?.message);
    return CSV_RESUMEN;
  }

  const map: Record<string, ResumenRow> = {};
  const empleadosPorSeccion: Record<string, Set<string>> = {};

  for (const r of data) {
    const sec = r.seccion as string;
    if (!map[sec]) {
      map[sec] = { seccion: sec, ene: 0, feb: 0, mar: 0, abr: 0, total: 0, personas: 0 };
      empleadosPorSeccion[sec] = new Set();
    }
    const pago = Number(r.pago_periodo);
    const mes = (r.mes as string).toLowerCase();
    if (mes === 'ene') map[sec].ene += pago;
    else if (mes === 'feb') map[sec].feb += pago;
    else if (mes === 'mar') map[sec].mar += pago;
    else if (mes === 'abr') map[sec].abr += pago;
    map[sec].total += pago;
    empleadosPorSeccion[sec].add(r.empleado_id);
  }

  return Object.values(map).map(r => ({
    ...r,
    personas: empleadosPorSeccion[r.seccion].size,
  }));
}

export async function getResumenBySeccion(seccion: Seccion): Promise<ResumenRow | undefined> {
  const rows = await getResumen();
  return rows.find(r => r.seccion === seccion);
}
