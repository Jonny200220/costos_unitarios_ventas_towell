export type ConfigPreparacionArticulo = {
  nombre_cliente: string;
  nombre_articulo: string;
  tamano: string;
  peso_preparacion: number;
  tiempo_preparacion: number;
};

export type ConfigPreparacionRow = ConfigPreparacionArticulo & {
  _dirty?: boolean;
  _isDefault?: boolean;
};
