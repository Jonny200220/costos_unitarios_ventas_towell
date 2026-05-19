import { useState } from 'react';
import type { ProductConfig } from '../data/mockData';
import FilterSidebar from './FilterSidebar';
import KpiCards from './KpiCards';
import Charts from './Charts';
import CostTable from './CostTable';

type DashTab = 'solo' | 'engomado';

interface Props {
  title: string;
  soloData: ProductConfig;
  engomadoData: ProductConfig;
}

export default function Dashboard({ title, soloData, engomadoData }: Props) {
  const [tab, setTab] = useState<DashTab>('solo');
  const data = tab === 'solo' ? soloData : engomadoData;

  const tabBtn = (label: string, value: DashTab) => (
    <button
      onClick={() => setTab(value)}
      className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
        tab === value
          ? 'bg-[#1e2a5e] text-white shadow'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 mb-5 bg-white rounded-full px-2 py-1 w-fit shadow-sm border border-gray-100">
        {tabBtn('Solo Urdido', 'solo')}
        {tabBtn('Urdido + Engomado', 'engomado')}
        <button className="px-5 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-200 transition-colors">
          Tejido
        </button>
      </div>

      <div className="text-lg font-bold text-gray-700 mb-4">{title}</div>

      <div className="flex gap-5">
        <FilterSidebar data={data} />
        <div className="flex-1 min-w-0">
          <KpiCards data={data} />
          <Charts data={data} />
          <CostTable rows={data.rows} />
        </div>
      </div>
    </div>
  );
}
