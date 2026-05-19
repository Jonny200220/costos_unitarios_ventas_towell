import { useState } from 'react';
import './index.css';
import Header, { type MainTab, type PtSubTab } from './components/Header';
import Dashboard from './components/Dashboard';
import Comparador from './components/Comparador';
import Historicos from './components/Historicos';
import {
  FLETES_SOLO_URDIDO,
  FLETES_URDIDO_ENGOMADO,
  ME_SOLO_URDIDO,
  ME_URDIDO_ENGOMADO,
} from './data/mockData';

function App() {
  const [mainTab, setMainTab] = useState<MainTab>('pt');
  const [ptSubTab, setPtSubTab] = useState<PtSubTab>('fletes');

  function handleTabChange(tab: MainTab) {
    setMainTab(tab);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        activeTab={mainTab}
        onTabChange={handleTabChange}
        ptSubTab={ptSubTab}
        onPtSubTabChange={setPtSubTab}
      />

      <main className="flex-1">
        {mainTab === 'historicos' && <Historicos />}
        {mainTab === 'comparador' && <Comparador />}
        {mainTab === 'pt' && ptSubTab === 'fletes' && (
          <Dashboard
            title="Fletes"
            soloData={FLETES_SOLO_URDIDO}
            engomadoData={FLETES_URDIDO_ENGOMADO}
          />
        )}
        {mainTab === 'pt' && ptSubTab === 'me' && (
          <Dashboard
            title="Material de Empaque"
            soloData={ME_SOLO_URDIDO}
            engomadoData={ME_URDIDO_ENGOMADO}
          />
        )}
      </main>
    </div>
  );
}

export default App;
