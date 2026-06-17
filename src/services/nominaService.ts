import nominaDetalleRaw from '../database/nomina_detalle.csv?raw';
import nominaPlantillaRaw from '../database/nomina_plantilla.csv?raw';
import nominaResumenRaw from '../database/nomina_resumen_seccion_mes.csv?raw';
import { parseCSV } from '../lib/csv';
import type { DetalleRow, PlantillaRow, ResumenRow, Seccion } from '../types/nomina';

// ─── Parsed once at module load ───────────────────────────────────────────────

const ALL_DETALLE: DetalleRow[] = parseCSV(nominaDetalleRaw)
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

const ALL_PLANTILLA: PlantillaRow[] = parseCSV(nominaPlantillaRaw)
  .filter(r => r['ID'] && r['ID'] !== 'ID' && r['ID'] !== 'TOTAL')
  .map(r => ({
    id: r['ID'],
    seccion: r['Sección'],
    subseccion: r['Subsección'] ?? '',
    puesto: r['Puesto'],
    sueldoMensual: Number(r['Sueldo Mensual Bruto']) || 0,
    tipoPago: r['Tipo Pago'],
  }));

const ALL_RESUMEN: ResumenRow[] = parseCSV(nominaResumenRaw)
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

// ─── Public API ───────────────────────────────────────────────────────────────
// When Supabase is ready, replace the body of each function with a query.
// The consumers (dashboards, services) will not need to change.

export function getNominaDetalle(seccion?: Seccion): DetalleRow[] {
  if (!seccion) return ALL_DETALLE;
  return ALL_DETALLE.filter(r => r.seccion === seccion);
}

export function getPlantilla(seccion?: Seccion): PlantillaRow[] {
  if (!seccion) return ALL_PLANTILLA;
  return ALL_PLANTILLA.filter(r => r.seccion === seccion);
}

export function getResumen(): ResumenRow[] {
  return ALL_RESUMEN;
}

export function getResumenBySeccion(seccion: Seccion): ResumenRow | undefined {
  return ALL_RESUMEN.find(r => r.seccion === seccion);
}
