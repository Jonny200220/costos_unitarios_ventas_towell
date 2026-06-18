import { useState } from 'react';
import { Plus, Save, X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import type { Seccion } from '../../types/nomina';
import { usePlantillaCRUD } from './hooks/usePlantillaCRUD';
import { fmtMXN } from '../../lib/format';

interface Props {
  seccion: Seccion;
}

const TIPOS_PAGO = ['semanal', 'quincenal', 'mensual'];

export default function PlantillaTable({ seccion }: Props) {
  const { rows, isDirty, loading, saving, error, update, add, remove, save, cancel } = usePlantillaCRUD(seccion);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalSueldo = rows.reduce((s, r) => s + r.sueldoMensual, 0);

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      remove(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }

  return (
    <div className="space-y-4">


      {/* Banner de error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={add}
            disabled={loading || saving}
            className="h-8 gap-1 bg-[#1e2a5e] hover:bg-[#1e2a5e]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar empleado
          </Button>
          {isDirty && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border border-amber-300">
              Cambios sin guardar
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={cancel}
            disabled={!isDirty || saving}
            className="h-8 gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={!isDirty || saving}
            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Tabla editable */}
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
                <TableHead className="text-white font-semibold w-16">ID</TableHead>
                <TableHead className="text-white font-semibold">Subsección</TableHead>
                <TableHead className="text-white font-semibold">Puesto</TableHead>
                <TableHead className="text-white font-semibold text-right w-40">Sueldo Mensual Bruto</TableHead>
                <TableHead className="text-white font-semibold w-32">Tipo Pago</TableHead>
                <TableHead className="text-white font-semibold w-16 text-center">Acc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  className={`${r._new ? 'bg-emerald-50' : r._dirty ? 'bg-blue-50' : ''} transition-colors`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r._new ? <span className="text-emerald-600 font-semibold">NUEVO</span> : r.id}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.subseccion}
                      onChange={e => update(r.id, 'subseccion', e.target.value)}
                      className="h-8 text-sm w-full min-w-[100px]"
                      placeholder="Subsección..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.puesto}
                      onChange={e => update(r.id, 'puesto', e.target.value)}
                      className="h-8 text-sm w-full min-w-[180px]"
                      placeholder="Puesto requerido"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={r.sueldoMensual}
                      onChange={e => update(r.id, 'sueldoMensual', Number(e.target.value))}
                      className="h-8 text-sm text-right w-full min-w-[120px]"
                      min={0}
                      step={100}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.tipoPago}
                      onValueChange={v => update(r.id, 'tipoPago', v)}
                    >
                      <SelectTrigger className="h-8 text-sm w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PAGO.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant={confirmDelete === r.id ? 'destructive' : 'ghost'}
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(r.id)}
                      title={confirmDelete === r.id ? 'Confirmar eliminación' : 'Eliminar'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando plantilla...
                      </span>
                    ) : (
                      'No hay empleados en esta sección. Agrega uno con el botón de arriba.'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
                <TableCell colSpan={3}>TOTAL ({rows.length} empleados)</TableCell>
                <TableCell className="text-right">{fmtMXN(totalSueldo)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      {confirmDelete && (
        <div className="text-xs text-red-600 font-medium px-1">
          ⚠ Haz clic de nuevo en el botón rojo para confirmar la eliminación, o en otro lugar para cancelar.
        </div>
      )}
    </div>
  );
}
