import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ALL_ROWS } from '../../../hooks/useSalesData';
import { queryKeys } from '../../../lib/queryKeys';
import { getConfigPreparacion, upsertConfigPreparacion, deleteConfigPreparacion } from '../../../services/configPreparacionService';
import type { ConfigPreparacionArticulo, ConfigPreparacionRow } from '../../../types/configPreparacion';

type ArticuloBase = {
  nombre_cliente: string;
  nombre_articulo: string;
  tamano: string;
  kg: number;
  ventas: number;
};

export const ARTICULOS_PREPARACION: ArticuloBase[] = Array.from(ALL_ROWS.reduce((map, r) => {
  if (!r.nombre_cliente || !r.nombre_articulo || !r.tamano) return map;
  const key = `${r.nombre_cliente}||${r.nombre_articulo}||${r.tamano}`;
  const prev = map.get(key);
  if (prev) { prev.kg += r.peso_std; prev.ventas += r.importe; }
  else map.set(key, { nombre_cliente: r.nombre_cliente, nombre_articulo: r.nombre_articulo, tamano: r.tamano, kg: r.peso_std, ventas: r.importe });
  return map;
}, new Map<string, ArticuloBase>()).values()).sort((a, b) => b.ventas - a.ventas);

export function keyConfigPreparacion(row: Pick<ConfigPreparacionArticulo, 'nombre_cliente' | 'nombre_articulo' | 'tamano'>) {
  return `${row.nombre_cliente}||${row.nombre_articulo}||${row.tamano}`;
}

export function useConfigPreparacionCRUD(selectedCliente: string) {
  const queryClient = useQueryClient();

  const { data: serverRows = [], isLoading } = useQuery({
    queryKey: queryKeys.configPreparacion,
    queryFn: getConfigPreparacion,
  });

  const serverMap = useMemo(() => new Map(serverRows.map(r => [keyConfigPreparacion(r), r])), [serverRows]);
  const [localOverrides, setLocalOverrides] = useState<Map<string, ConfigPreparacionRow>>(new Map());
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setLocalOverrides(new Map(serverRows.map(r => [keyConfigPreparacion(r), { ...r, _dirty: false, _isDefault: false }])));
      setDeletedKeys(new Set());
    }
  }, [serverRows, isDirty]);

  const rows = useMemo<ConfigPreparacionRow[]>(() => ARTICULOS_PREPARACION
    .filter(r => r.nombre_cliente === selectedCliente)
    .map(r => {
      const key = keyConfigPreparacion(r);
      const override = localOverrides.get(key);
      if (override && !deletedKeys.has(key)) return override;
      return {
        nombre_cliente: r.nombre_cliente,
        nombre_articulo: r.nombre_articulo,
        tamano: r.tamano,
        peso_preparacion: 1,
        tiempo_preparacion: 1,
        _dirty: false,
        _isDefault: true,
      };
    }), [selectedCliente, localOverrides, deletedKeys]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const upserts: ConfigPreparacionArticulo[] = [];
      localOverrides.forEach((row, key) => {
        if (row._dirty && !deletedKeys.has(key) && !row._isDefault) {
          const { _dirty: _d, _isDefault: _i, ...clean } = row;
          upserts.push(clean);
        }
      });
      const deletes = Array.from(deletedKeys).map(key => {
        const [nombre_cliente, nombre_articulo, tamano] = key.split('||');
        return { nombre_cliente, nombre_articulo, tamano };
      });
      await upsertConfigPreparacion(upserts);
      await deleteConfigPreparacion(deletes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.configPreparacion });
      queryClient.invalidateQueries({ queryKey: queryKeys.pesosCliente });
      setIsDirty(false);
    },
  });

  const update = useCallback((row: ConfigPreparacionRow, field: 'peso_preparacion' | 'tiempo_preparacion', value: number) => {
    const key = keyConfigPreparacion(row);
    setLocalOverrides(prev => {
      const next = new Map(prev);
      const base = next.get(key) ?? { ...row, _isDefault: false };
      next.set(key, { ...base, [field]: value, _dirty: true, _isDefault: false });
      return next;
    });
    setDeletedKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setIsDirty(true);
  }, []);

  const reset = useCallback((row: ConfigPreparacionRow) => {
    const key = keyConfigPreparacion(row);
    setLocalOverrides(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    setDeletedKeys(prev => {
      const next = new Set(prev);
      if (serverMap.has(key)) next.add(key);
      return next;
    });
    setIsDirty(true);
  }, [serverMap]);

  const cancel = useCallback(() => {
    setLocalOverrides(new Map(serverRows.map(r => [keyConfigPreparacion(r), { ...r, _dirty: false, _isDefault: false }])));
    setDeletedKeys(new Set());
    setIsDirty(false);
  }, [serverRows]);

  return {
    rows,
    isDirty,
    loading: isLoading,
    saving: saveMutation.isPending,
    error: saveMutation.error instanceof Error ? saveMutation.error.message : null,
    update,
    reset,
    save: saveMutation.mutate,
    cancel,
  };
}
