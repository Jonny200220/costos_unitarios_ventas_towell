import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ProductConfig } from '../data/mockData';
import FilterSidebar from './FilterSidebar';
import KpiCards from './KpiCards';
import Charts from './Charts';
import CostTable from './CostTable';
import FletesDashboard from './FletesDashboard';
import MaterialEmpaqueDashboard from './MaterialEmpaqueDashboard';
import AdministracionDashboard from './AdministracionDashboard';
import SurtidoDashboard from './SurtidoDashboard';
import ResumenDashboard from './ResumenDashboard';

type CostTab = 'resumen' | 'administracion' | 'surtido' | 'preparacion' | 'embarque' | 'me' | 'fletes';

interface Props {
  title: string;
  soloData: ProductConfig;
  engomadoData: ProductConfig;
}

const COST_TABS: { label: string; value: CostTab }[] = [
  { label: 'Resumen', value: 'resumen' },
  { label: 'Administración', value: 'administracion' },
  { label: 'Surtido', value: 'surtido' },
  { label: 'Preparación', value: 'preparacion' },
  { label: 'Embarque', value: 'embarque' },
  { label: 'Material de Empaque', value: 'me' },
  { label: 'Fletes', value: 'fletes' },
];

export default function Dashboard({ title, soloData, engomadoData: _engomadoData }: Props) {
  const [costTab, setCostTab] = useState<CostTab>('resumen');
  const data = soloData;

  return (
    <div className="p-5">
      <Tabs value={costTab} onValueChange={v => setCostTab(v as CostTab)}>
        <TabsList className="mb-5 h-auto flex-wrap gap-1 bg-white ring-1 ring-foreground/10 shadow-xs p-1">
          {COST_TABS.map(({ label, value }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-active:bg-[#1e2a5e] data-active:text-white data-active:shadow text-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="fletes" forceMount className="data-[state=inactive]:hidden">
          <FletesDashboard />
        </TabsContent>

        <TabsContent value="me" forceMount className="data-[state=inactive]:hidden">
          <MaterialEmpaqueDashboard />
        </TabsContent>

        <TabsContent value="administracion" forceMount className="data-[state=inactive]:hidden">
          <AdministracionDashboard />
        </TabsContent>

        <TabsContent value="surtido" forceMount className="data-[state=inactive]:hidden">
          <SurtidoDashboard />
        </TabsContent>

        <TabsContent value="resumen" forceMount className="data-[state=inactive]:hidden">
          <ResumenDashboard />
        </TabsContent>

        {COST_TABS.filter(t => !['fletes', 'me', 'administracion', 'resumen', 'surtido'].includes(t.value)).map(({ value }) => (
          <TabsContent key={value} value={value} forceMount className="data-[state=inactive]:hidden">
            <div className="text-lg font-bold text-foreground mb-4">
              {title} — {value.charAt(0).toUpperCase() + value.slice(1)}
            </div>
            <div className="flex gap-5">
              <FilterSidebar data={data} />
              <div className="flex-1 min-w-0">
                <KpiCards data={data} />
                <Charts data={data} />
                <CostTable rows={data.rows} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
