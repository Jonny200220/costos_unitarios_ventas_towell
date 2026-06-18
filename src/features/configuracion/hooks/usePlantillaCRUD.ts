import { useState, useEffect, useCallback } from 'react';
import type { PlantillaRow, Seccion } from '../../../types/nomina';
import { getPlantillaAsync, upsertPlantilla, deletePlantilla } from '../../../services/nominaService';

export type PlantillaEditRow = PlantillaRow & { _dirty?: boolean; _new?: boolean };

function nextId(rows: PlantillaEditRow[]): string {
  const nums = rows.map(r => Number(r.id)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, '0');
}

export function usePlantillaCRUD(seccion: Seccion) {
  const [rows, setRows] = useState<PlantillaEditRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlantillaAsync(seccion);
      setRows(data.map(r => ({ ...r, _dirty: false, _new: false })));
      setDeletedIds([]);
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la plantilla');
    } finally {
      setLoading(false);
    }
  }, [seccion]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback((id: string, field: keyof PlantillaRow, value: string | number) => {
    setRows(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value, _dirty: true } : r
    ));
    setIsDirty(true);
  }, []);

  const add = useCallback(() => {
    setRows(prev => {
      const newRow: PlantillaEditRow = {
        id: nextId(prev),
        seccion,
        subseccion: '',
        puesto: '',
        sueldoMensual: 0,
        tipoPago: 'semanal',
        _dirty: true,
        _new: true,
      };
      return [...prev, newRow];
    });
    setIsDirty(true);
  }, [seccion]);

  const remove = useCallback((id: string) => {
    setRows(prev => {
      const row = prev.find(r => r.id === id);
      // Solo registramos para borrar en Supabase las filas que ya existían (no las nuevas sin guardar)
      if (row && !row._new) {
        setDeletedIds(d => (d.includes(id) ? d : [...d, id]));
      }
      return prev.filter(r => r.id !== id);
    });
    setIsDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const toUpsert = rows.filter(r => r._dirty || r._new);
      await upsertPlantilla(toUpsert);
      await deletePlantilla(deletedIds);
      setRows(prev => prev.map(r => ({ ...r, _dirty: false, _new: false })));
      setDeletedIds([]);
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  }, [rows, deletedIds]);

  const cancel = useCallback(() => {
    reload();
  }, [reload]);

  return { rows, isDirty, loading, saving, error, update, add, remove, save, cancel };
}
