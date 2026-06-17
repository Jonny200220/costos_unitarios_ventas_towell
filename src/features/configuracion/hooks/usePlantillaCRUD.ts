import { useState, useEffect, useCallback } from 'react';
import type { PlantillaRow, Seccion } from '../../../types/nomina';
import { getPlantilla } from '../../../services/nominaService';

export type PlantillaEditRow = PlantillaRow & { _dirty?: boolean; _new?: boolean };

const STORAGE_KEY = 'plantilla_overrides_v1';

function loadFromStorage(seccion: Seccion): PlantillaEditRow[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, PlantillaEditRow[]>;
    return all[seccion] ?? null;
  } catch {
    return null;
  }
}

function saveToStorage(seccion: Seccion, rows: PlantillaEditRow[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PlantillaEditRow[]>) : {};
    all[seccion] = rows.map(r => ({ ...r, _dirty: false, _new: false }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function nextId(rows: PlantillaEditRow[]): string {
  const nums = rows.map(r => Number(r.id)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, '0');
}

export function usePlantillaCRUD(seccion: Seccion) {
  const [rows, setRows] = useState<PlantillaEditRow[]>(() => {
    const stored = loadFromStorage(seccion);
    if (stored) return stored;
    return getPlantilla(seccion).map(r => ({ ...r, _dirty: false, _new: false }));
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage(seccion);
    if (stored) {
      setRows(stored);
    } else {
      setRows(getPlantilla(seccion).map(r => ({ ...r, _dirty: false, _new: false })));
    }
    setIsDirty(false);
  }, [seccion]);

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
    setRows(prev => prev.filter(r => r.id !== id));
    setIsDirty(true);
  }, []);

  const save = useCallback(() => {
    saveToStorage(seccion, rows);
    setRows(prev => prev.map(r => ({ ...r, _dirty: false, _new: false })));
    setIsDirty(false);
    // When Supabase is ready: await supabase.from('plantilla').upsert(rows)
  }, [seccion, rows]);

  const cancel = useCallback(() => {
    const stored = loadFromStorage(seccion);
    if (stored) {
      setRows(stored);
    } else {
      setRows(getPlantilla(seccion).map(r => ({ ...r, _dirty: false, _new: false })));
    }
    setIsDirty(false);
  }, [seccion]);

  return { rows, isDirty, update, add, remove, save, cancel };
}
