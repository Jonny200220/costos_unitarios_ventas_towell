import { useQuery } from '@tanstack/react-query';
import { getNominaDetalle, getPlantillaAsync, getResumen } from '../services/nominaService';
import type { DetalleRow, PlantillaRow, ResumenRow, Seccion } from '../types/nomina';
import { queryKeys } from '../lib/queryKeys';

export type NominaDataState = {
  detalle: DetalleRow[];
  plantilla: PlantillaRow[];
  resumen: ResumenRow[];
  loading: boolean;
  error: string | null;
};

// Con forceMount en todos los tabs, los 4 dashboards que llaman useNominaData()
// comparten las mismas cache keys — Supabase sólo recibe 3 requests en total.
export function useNominaData(seccion?: Seccion): NominaDataState {
  const detalle = useQuery({
    queryKey: queryKeys.nominaDetalle(seccion),
    queryFn: () => getNominaDetalle(seccion),
  });

  const plantilla = useQuery({
    queryKey: queryKeys.nominaPlantilla(seccion),
    queryFn: () => getPlantillaAsync(seccion),
  });

  const resumen = useQuery({
    queryKey: queryKeys.nominaResumen,
    queryFn: getResumen,
  });

  return {
    detalle:  detalle.data  ?? [],
    plantilla: plantilla.data ?? [],
    resumen:  resumen.data  ?? [],
    loading:  detalle.isLoading || plantilla.isLoading || resumen.isLoading,
    error:    detalle.error?.message ?? plantilla.error?.message ?? resumen.error?.message ?? null,
  };
}
