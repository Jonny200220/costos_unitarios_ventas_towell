export type AreaPeso = 'admin' | 'almacen' | 'preparacion' | 'embarque' | 'me' | 'fletes';

export type PesosCliente = {
  nombre_cliente: string;
  // Esfuerzo (escala 1-4)
  peso_admin:        number;
  peso_almacen:      number;
  peso_preparacion:  number;
  peso_embarque:     number;
  peso_me:           number;
  peso_fletes:       number;
  // Tiempo real (min/kg) por área
  tiempo_admin:       number;
  tiempo_almacen:     number;
  tiempo_preparacion: number;
  tiempo_embarque:    number;
  tiempo_me:          number;
  tiempo_fletes:      number;
};

export const AREAS: {
  key:         AreaPeso;
  pesoField:   keyof PesosCliente;
  tiempoField: keyof PesosCliente;
  label:       string;
  color:       string;
  bgHeader:    string;
}[] = [
  { key: 'admin',       pesoField: 'peso_admin',       tiempoField: 'tiempo_admin',       label: 'Administración', color: 'bg-amber-500',  bgHeader: 'bg-amber-900/50'   },
  { key: 'almacen',     pesoField: 'peso_almacen',     tiempoField: 'tiempo_almacen',     label: 'Almacén',        color: 'bg-teal-500',   bgHeader: 'bg-teal-900/50'    },
  { key: 'preparacion', pesoField: 'peso_preparacion', tiempoField: 'tiempo_preparacion', label: 'Preparación',    color: 'bg-violet-500', bgHeader: 'bg-emerald-900/50' },
  { key: 'embarque',    pesoField: 'peso_embarque',    tiempoField: 'tiempo_embarque',    label: 'Embarques',      color: 'bg-blue-500',   bgHeader: 'bg-purple-900/50'  },
  { key: 'me',          pesoField: 'peso_me',          tiempoField: 'tiempo_me',          label: 'Mat. Empaque',   color: 'bg-sky-500',    bgHeader: 'bg-blue-900/50'    },
  { key: 'fletes',      pesoField: 'peso_fletes',      tiempoField: 'tiempo_fletes',      label: 'Fletes',         color: 'bg-indigo-500', bgHeader: 'bg-indigo-900/50'  },
];

export const DEFAULT_PESOS: Omit<PesosCliente, 'nombre_cliente'> = {
  peso_admin: 1,        tiempo_admin: 1,
  peso_almacen: 1,      tiempo_almacen: 1,
  peso_preparacion: 1,  tiempo_preparacion: 1,
  peso_embarque: 1,     tiempo_embarque: 1,
  peso_me: 1,           tiempo_me: 1,
  peso_fletes: 1,       tiempo_fletes: 1,
};
