export type AreaPeso = 'admin' | 'almacen' | 'preparacion' | 'embarque' | 'me' | 'fletes';

export type PesosOC = {
  orden_venta: string;
  peso_admin: number;
  peso_almacen: number;
  peso_preparacion: number;
  peso_embarque: number;
  peso_me: number;
  peso_fletes: number;
};

export const AREAS: { key: AreaPeso; field: keyof PesosOC; label: string; color: string }[] = [
  { key: 'admin',       field: 'peso_admin',       label: 'Administración', color: 'bg-amber-500' },
  { key: 'almacen',     field: 'peso_almacen',     label: 'Almacén',        color: 'bg-teal-500' },
  { key: 'preparacion', field: 'peso_preparacion', label: 'Preparación',    color: 'bg-violet-500' },
  { key: 'embarque',    field: 'peso_embarque',     label: 'Embarques',      color: 'bg-blue-500' },
  { key: 'me',          field: 'peso_me',           label: 'Mat. Empaque',   color: 'bg-sky-500' },
  { key: 'fletes',      field: 'peso_fletes',       label: 'Fletes',         color: 'bg-indigo-500' },
];

export const DEFAULT_PESOS: Omit<PesosOC, 'orden_venta'> = {
  peso_admin: 1,
  peso_almacen: 1,
  peso_preparacion: 1,
  peso_embarque: 1,
  peso_me: 1,
  peso_fletes: 1,
};
