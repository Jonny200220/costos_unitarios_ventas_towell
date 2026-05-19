export type CostRow = {
  concepto: string;
  tipo: 'Variable' | 'Fijo' | 'Subtotal' | 'Total';
  cuKg: number;
  cuMin: number;
  importe: number;
  pct: number;
};

export type ProductConfig = {
  localidad: string;
  construccion: string;
  tamano: string;
  idProducto: string;
  kilos: number;
  materiaPrima: { nombre: string; kg: number; color: string }[];
  rendimiento: { kgMin: number; minKg: number; minTotales: number };
  costoVariable: number;
  costoFijo: number;
  costoTotal: number;
  costoUnitario: number;
  rows: CostRow[];
};

export const FLETES_SOLO_URDIDO: ProductConfig = {
  localidad: 'Planta A',
  construccion: 'Rizo Terry',
  tamano: '30×60',
  idProducto: 'TC-001 — Toalla Chica (30×60)',
  kilos: 1000,
  materiaPrima: [
    { nombre: 'Hilo 16/1', kg: 720, color: '#4C9EEB' },
    { nombre: 'Colorante', kg: 180, color: '#F97316' },
    { nombre: 'Acabado', kg: 100, color: '#8B5CF6' },
  ],
  rendimiento: { kgMin: 0.082, minKg: 12.2, minTotales: 12195.1 },
  costoVariable: 18500,
  costoFijo: 11200,
  costoTotal: 29700,
  costoUnitario: 29.7,
  rows: [
    { concepto: 'Materia Prima', tipo: 'Variable', cuKg: 11.47, cuMin: 139.88, importe: 11470, pct: 38.6 },
    { concepto: 'Energía', tipo: 'Variable', cuKg: 3.33, cuMin: 40.61, importe: 3330, pct: 11.2 },
    { concepto: 'Mano de Obra', tipo: 'Variable', cuKg: 2.78, cuMin: 33.84, importe: 2775, pct: 9.3 },
    { concepto: 'Insumos', tipo: 'Variable', cuKg: 0.93, cuMin: 11.28, importe: 925, pct: 3.1 },
    { concepto: 'Subtotal Variable', tipo: 'Subtotal', cuKg: 18.5, cuMin: 225.61, importe: 18500, pct: 62.3 },
    { concepto: 'Depreciación', tipo: 'Fijo', cuKg: 4.26, cuMin: 51.9, importe: 4256, pct: 14.3 },
    { concepto: 'Mantenimiento', tipo: 'Fijo', cuKg: 3.14, cuMin: 38.24, importe: 3136, pct: 10.6 },
    { concepto: 'CIF', tipo: 'Fijo', cuKg: 2.69, cuMin: 32.78, importe: 2680, pct: 9.1 },
    { concepto: 'Administración', tipo: 'Fijo', cuKg: 1.12, cuMin: 13.66, importe: 1128, pct: 3.8 },
    { concepto: 'Subtotal Fijo', tipo: 'Subtotal', cuKg: 11.2, cuMin: 136.59, importe: 11200, pct: 37.7 },
    { concepto: 'Costo Total', tipo: 'Total', cuKg: 29.7, cuMin: 362.2, importe: 29700, pct: 100 },
  ],
};

export const FLETES_URDIDO_ENGOMADO: ProductConfig = {
  localidad: 'Planta B',
  construccion: 'Rizo Terry',
  tamano: '50×90',
  idProducto: 'TC-002 — Toalla Grande (50×90)',
  kilos: 1000,
  materiaPrima: [
    { nombre: 'Hilo 16/1', kg: 680, color: '#4C9EEB' },
    { nombre: 'Colorante', kg: 200, color: '#F97316' },
    { nombre: 'Acabado', kg: 120, color: '#8B5CF6' },
  ],
  rendimiento: { kgMin: 0.078, minKg: 12.8, minTotales: 12820 },
  costoVariable: 28700,
  costoFijo: 17400,
  costoTotal: 46100,
  costoUnitario: 46.1,
  rows: [
    { concepto: 'Materia Prima', tipo: 'Variable', cuKg: 17.5, cuMin: 224, importe: 17500, pct: 37.9 },
    { concepto: 'Energía', tipo: 'Variable', cuKg: 4.8, cuMin: 61.4, importe: 4800, pct: 10.4 },
    { concepto: 'Mano de Obra', tipo: 'Variable', cuKg: 4.2, cuMin: 53.8, importe: 4200, pct: 9.1 },
    { concepto: 'Insumos', tipo: 'Variable', cuKg: 2.2, cuMin: 28.1, importe: 2200, pct: 4.8 },
    { concepto: 'Subtotal Variable', tipo: 'Subtotal', cuKg: 28.7, cuMin: 367.3, importe: 28700, pct: 62.3 },
    { concepto: 'Depreciación', tipo: 'Fijo', cuKg: 6.5, cuMin: 83.2, importe: 6500, pct: 14.1 },
    { concepto: 'Mantenimiento', tipo: 'Fijo', cuKg: 4.8, cuMin: 61.4, importe: 4800, pct: 10.4 },
    { concepto: 'CIF', tipo: 'Fijo', cuKg: 4.0, cuMin: 51.2, importe: 4000, pct: 8.7 },
    { concepto: 'Administración', tipo: 'Fijo', cuKg: 2.1, cuMin: 26.9, importe: 2100, pct: 4.6 },
    { concepto: 'Subtotal Fijo', tipo: 'Subtotal', cuKg: 17.4, cuMin: 222.7, importe: 17400, pct: 37.7 },
    { concepto: 'Costo Total', tipo: 'Total', cuKg: 46.1, cuMin: 590, importe: 46100, pct: 100 },
  ],
};

export const ME_SOLO_URDIDO: ProductConfig = {
  localidad: 'Planta A',
  construccion: 'Plano',
  tamano: '30×60',
  idProducto: 'ME-001 — Empaque Chico (30×60)',
  kilos: 500,
  materiaPrima: [
    { nombre: 'Polietileno', kg: 300, color: '#4C9EEB' },
    { nombre: 'Tinta', kg: 120, color: '#F97316' },
    { nombre: 'Adhesivo', kg: 80, color: '#8B5CF6' },
  ],
  rendimiento: { kgMin: 0.065, minKg: 15.4, minTotales: 7700 },
  costoVariable: 9200,
  costoFijo: 5800,
  costoTotal: 15000,
  costoUnitario: 30.0,
  rows: [
    { concepto: 'Materia Prima', tipo: 'Variable', cuKg: 10.2, cuMin: 157.1, importe: 5100, pct: 34 },
    { concepto: 'Energía', tipo: 'Variable', cuKg: 3.1, cuMin: 47.7, importe: 1550, pct: 10.3 },
    { concepto: 'Mano de Obra', tipo: 'Variable', cuKg: 2.9, cuMin: 44.6, importe: 1450, pct: 9.7 },
    { concepto: 'Insumos', tipo: 'Variable', cuKg: 2.2, cuMin: 33.8, importe: 1100, pct: 7.3 },
    { concepto: 'Subtotal Variable', tipo: 'Subtotal', cuKg: 18.4, cuMin: 283.2, importe: 9200, pct: 61.3 },
    { concepto: 'Depreciación', tipo: 'Fijo', cuKg: 4.8, cuMin: 73.8, importe: 2400, pct: 16 },
    { concepto: 'Mantenimiento', tipo: 'Fijo', cuKg: 3.2, cuMin: 49.2, importe: 1600, pct: 10.7 },
    { concepto: 'CIF', tipo: 'Fijo', cuKg: 2.6, cuMin: 40, importe: 1300, pct: 8.7 },
    { concepto: 'Administración', tipo: 'Fijo', cuKg: 1.0, cuMin: 15.4, importe: 500, pct: 3.3 },
    { concepto: 'Subtotal Fijo', tipo: 'Subtotal', cuKg: 11.6, cuMin: 178.4, importe: 5800, pct: 38.7 },
    { concepto: 'Costo Total', tipo: 'Total', cuKg: 30.0, cuMin: 461.6, importe: 15000, pct: 100 },
  ],
};

export const ME_URDIDO_ENGOMADO: ProductConfig = {
  localidad: 'Planta B',
  construccion: 'Plano',
  tamano: '50×90',
  idProducto: 'ME-002 — Empaque Grande (50×90)',
  kilos: 500,
  materiaPrima: [
    { nombre: 'Polietileno', kg: 280, color: '#4C9EEB' },
    { nombre: 'Tinta', kg: 140, color: '#F97316' },
    { nombre: 'Adhesivo', kg: 80, color: '#8B5CF6' },
  ],
  rendimiento: { kgMin: 0.061, minKg: 16.4, minTotales: 8200 },
  costoVariable: 11400,
  costoFijo: 7100,
  costoTotal: 18500,
  costoUnitario: 37.0,
  rows: [
    { concepto: 'Materia Prima', tipo: 'Variable', cuKg: 12.8, cuMin: 209.8, importe: 6400, pct: 34.6 },
    { concepto: 'Energía', tipo: 'Variable', cuKg: 4.0, cuMin: 65.6, importe: 2000, pct: 10.8 },
    { concepto: 'Mano de Obra', tipo: 'Variable', cuKg: 3.6, cuMin: 59, importe: 1800, pct: 9.7 },
    { concepto: 'Insumos', tipo: 'Variable', cuKg: 2.4, cuMin: 39.3, importe: 1200, pct: 6.5 },
    { concepto: 'Subtotal Variable', tipo: 'Subtotal', cuKg: 22.8, cuMin: 373.7, importe: 11400, pct: 61.6 },
    { concepto: 'Depreciación', tipo: 'Fijo', cuKg: 6.0, cuMin: 98.4, importe: 3000, pct: 16.2 },
    { concepto: 'Mantenimiento', tipo: 'Fijo', cuKg: 4.0, cuMin: 65.6, importe: 2000, pct: 10.8 },
    { concepto: 'CIF', tipo: 'Fijo', cuKg: 3.2, cuMin: 52.5, importe: 1600, pct: 8.6 },
    { concepto: 'Administración', tipo: 'Fijo', cuKg: 1.0, cuMin: 16.4, importe: 500, pct: 2.7 },
    { concepto: 'Subtotal Fijo', tipo: 'Subtotal', cuKg: 14.2, cuMin: 232.9, importe: 7100, pct: 38.4 },
    { concepto: 'Costo Total', tipo: 'Total', cuKg: 37.0, cuMin: 606.6, importe: 18500, pct: 100 },
  ],
};
