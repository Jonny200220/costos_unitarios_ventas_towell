import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { ProductConfig } from '../data/mockData';

interface Props {
  data: ProductConfig;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
        {label}
      </Label>
      <Select defaultValue={value}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={value}>{value}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function FilterSidebar({ data }: Props) {
  return (
    <aside className="w-48 flex-shrink-0">
      <Card size="sm">
        <CardContent>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Filtrar Por</p>
          <Field label="Localidad" value={data.localidad} />
          <Field label="Construcción" value={data.construccion} />
          <Field label="Tamaño" value={data.tamano} />
          <Field label="ID Producto" value={data.idProducto} />

          <div className="mb-3">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
              Kilos
            </Label>
            <Input
              type="number"
              defaultValue={data.kilos}
              className="h-8 text-sm"
            />
          </div>

          <Separator className="my-3" />

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Materia Prima</p>
          {data.materiaPrima.map((mp, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: mp.color }} />
                <span>{mp.nombre}</span>
              </div>
              <span className="font-semibold text-foreground">{mp.kg.toLocaleString()} kg</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-bold text-foreground border-t border-border pt-1.5 mt-1">
            <span>Total</span>
            <span>{data.kilos.toLocaleString()} kg</span>
          </div>

          <Separator className="my-3" />

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Rendimiento</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>KG / MIN</span>
              <span className="font-semibold text-foreground">{data.rendimiento.kgMin}</span>
            </div>
            <div className="flex justify-between">
              <span>MIN / KG</span>
              <span className="font-semibold text-foreground">{data.rendimiento.minKg}</span>
            </div>
            <div className="flex justify-between">
              <span>MIN Totales</span>
              <span className="font-semibold text-foreground">{data.rendimiento.minTotales.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
