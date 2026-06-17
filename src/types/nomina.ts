export type Seccion = 'Administración' | 'Almacén' | 'Preparación' | 'Embarques';

export type DetalleRow = {
  id: string;
  seccion: string;
  puesto: string;
  mes: string;
  periodo: string;
  dias: number;
  horas: number;
  sueldoDiario: number;
  pagoPeriodo: number;
  tipoPago: string;
};

export type PlantillaRow = {
  id: string;
  seccion: string;
  subseccion: string;
  puesto: string;
  sueldoMensual: number;
  tipoPago: string;
};

export type ResumenRow = {
  seccion: string;
  ene: number;
  feb: number;
  mar: number;
  abr: number;
  total: number;
  personas: number;
};
