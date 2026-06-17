import { useState, useEffect } from 'react';
import { getNominaDetalle, getPlantillaAsync, getResumen } from '../services/nominaService';
import type { DetalleRow, PlantillaRow, ResumenRow, Seccion } from '../types/nomina';

export type NominaDataState = {
  detalle: DetalleRow[];
  plantilla: PlantillaRow[];
  resumen: ResumenRow[];
  loading: boolean;
  error: string | null;
};

export function useNominaData(seccion?: Seccion): NominaDataState {
  const [state, setState] = useState<NominaDataState>({
    detalle: [],
    plantilla: [],
    resumen: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const [detalle, plantilla, resumen] = await Promise.all([
          getNominaDetalle(seccion),
          getPlantillaAsync(seccion),
          getResumen(),
        ]);
        if (!cancelled) {
          setState({ detalle, plantilla, resumen, loading: false, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: String(e) }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [seccion]);

  return state;
}
