export const queryKeys = {
  pesosCliente:    ['pesos_cliente']                                    as const,
  nominaResumen:   ['nomina_resumen']                                   as const,
  nominaDetalle:   (seccion?: string) => ['nomina_detalle',  seccion ?? 'all'] as const,
  nominaPlantilla: (seccion?: string) => ['nomina_plantilla', seccion ?? 'all'] as const,
} as const;
