export type SalesRow = {
  fecha: string;
  mes: string;
  nombre_cliente: string;
  codigo_articulo: string;
  nombre_articulo: string;
  configuracion: string;
  tamano: string;
  color: string;
  calidad: string;
  empresa: string;
  tipo_pedido: string;
  cantidad: number;
  peso_std: number;
  importe: number;
  monto_me: number;
  monto_fle: number;
  monto_myo: number;
};

export type SalesFilters = {
  codigo_articulo: string;
  nombre_articulo: string;
  tamano: string;
  color: string;
  calidad: string;
  empresa: string;
  tipo_pedido: string;
  mes: string;
  cliente: string;
  search: string;
};
