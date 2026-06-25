import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import PlantillaTable from './PlantillaTable';
import PesosOCPage from '../pesos/PesosOCPage';
import ConfigPreparacionPage from '../pesos/ConfigPreparacionPage';
import type { Seccion } from '../../types/nomina';

const SECCIONES: { value: Seccion; label: string; color: string }[] = [
  { value: 'Administración', label: 'Administración', color: 'text-amber-600' },
  { value: 'Almacén', label: 'Almacén', color: 'text-teal-600' },
  { value: 'Preparación', label: 'Preparación', color: 'text-violet-600' },
  { value: 'Embarques', label: 'Embarques', color: 'text-blue-600' },
];

export default function ConfiguracionPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1e2a5e] flex items-center justify-center">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e2a5e]">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Administra la plantilla de personal y los pesos de esfuerzo por orden de venta.
          </p>
        </div>
      </div>

      <Tabs defaultValue="plantilla">
        <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-10 mb-6">
          <TabsTrigger value="plantilla" className="text-sm px-5">Plantilla</TabsTrigger>
          <TabsTrigger value="pesos" className="text-sm px-5">Pesos por Orden</TabsTrigger>
          <TabsTrigger value="prep-articulo" className="text-sm px-5">Preparación por Artículo</TabsTrigger>
        </TabsList>

        {/* Sub-tabs de plantilla por sección */}
        <TabsContent value="plantilla" className="mt-0">
          <Tabs defaultValue="Administración">
            <TabsList className="bg-white ring-1 ring-foreground/10 shadow-xs h-9 mb-5">
              {SECCIONES.map(s => (
                <TabsTrigger key={s.value} value={s.value} className="text-sm px-4">
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SECCIONES.map(s => (
              <TabsContent key={s.value} value={s.value} className="mt-0">
                <PlantillaTable seccion={s.value} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="pesos" className="mt-0">
          <PesosOCPage />
        </TabsContent>

        <TabsContent value="prep-articulo" className="mt-0">
          <ConfigPreparacionPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
