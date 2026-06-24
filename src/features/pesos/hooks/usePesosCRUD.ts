import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PesosCliente } from '../../../types/pesos';
import { getPesosCliente, upsertPesosCliente } from '../../../services/pesosService';
import { queryKeys } from '../../../lib/queryKeys';

export type PesosEditRow = PesosCliente & { _dirty?: boolean };

export function usePesosCRUD() {
  const queryClient = useQueryClient();

  // Fuente de verdad del servidor — compartida con ResumenDashboard y CostosUnitariosDashboard
  const { data: serverRows = [], isLoading } = useQuery({
    queryKey: queryKeys.pesosCliente,
    queryFn: getPesosCliente,
  });

  // Estado local de edición (sólo vive mientras hay cambios sin guardar)
  const [localRows, setLocalRows] = useState<PesosEditRow[]>([]);
  const [isDirty, setIsDirty]     = useState(false);

  // Sincroniza datos del servidor → estado local cuando no hay cambios pendientes
  useEffect(() => {
    if (!isDirty) {
      setLocalRows(serverRows.map(r => ({ ...r, _dirty: false })));
    }
  }, [serverRows, isDirty]);

  const mutation = useMutation({
    mutationFn: (dirty: PesosCliente[]) => upsertPesosCliente(dirty),
    onSuccess: () => {
      // Invalida la caché → ResumenDashboard y CostosUnitariosDashboard se actualizan solos
      queryClient.invalidateQueries({ queryKey: queryKeys.pesosCliente });
      setLocalRows(prev => prev.map(r => ({ ...r, _dirty: false })));
      setIsDirty(false);
    },
  });

  const update = useCallback((nombre_cliente: string, field: keyof PesosCliente, value: number) => {
    setLocalRows(prev =>
      prev.map(r => r.nombre_cliente === nombre_cliente ? { ...r, [field]: value, _dirty: true } : r)
    );
    setIsDirty(true);
  }, []);

  const save = useCallback(() => {
    const dirty = localRows.filter(r => r._dirty).map(({ _dirty: _, ...r }) => r);
    if (dirty.length > 0) mutation.mutate(dirty);
  }, [localRows, mutation]);

  const cancel = useCallback(() => {
    setLocalRows(serverRows.map(r => ({ ...r, _dirty: false })));
    setIsDirty(false);
  }, [serverRows]);

  return {
    rows:    localRows,
    isDirty,
    loading: isLoading,
    saving:  mutation.isPending,
    error:   mutation.error instanceof Error ? mutation.error.message : null,
    update,
    save,
    cancel,
  };
}
