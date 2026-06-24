import { useState, useEffect, useCallback } from 'react';
import type { PesosCliente } from '../../../types/pesos';
import { getPesosCliente, upsertPesosCliente } from '../../../services/pesosService';

export type PesosEditRow = PesosCliente & { _dirty?: boolean };

export function usePesosCRUD() {
  const [rows, setRows]       = useState<PesosEditRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPesosCliente();
      setRows(data.map(r => ({ ...r, _dirty: false })));
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pesos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const update = useCallback((nombre_cliente: string, field: keyof PesosCliente, value: number) => {
    setRows(prev =>
      prev.map(r => r.nombre_cliente === nombre_cliente ? { ...r, [field]: value, _dirty: true } : r)
    );
    setIsDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const dirty = rows.filter(r => r._dirty).map(({ _dirty: _, ...r }) => r);
      await upsertPesosCliente(dirty);
      setRows(prev => prev.map(r => ({ ...r, _dirty: false })));
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar pesos');
    } finally {
      setSaving(false);
    }
  }, [rows]);

  const cancel = useCallback(() => reload(), [reload]);

  return { rows, isDirty, loading, saving, error, update, save, cancel };
}
