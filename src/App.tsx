import { useState } from 'react';
import './index.css';
import Header, { type MainTab } from './components/Header';
import Dashboard from './components/Dashboard';
import Comparador from './components/Comparador';
import Historicos from './components/Historicos';
import {
  FLETES_SOLO_URDIDO,
  FLETES_URDIDO_ENGOMADO,
} from './data/mockData';

function App() {
  const [mainTab, setMainTab] = useState<MainTab>('pt');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        activeTab={mainTab}
        onTabChange={setMainTab}
      />

      <main className="flex-1">
        {mainTab === 'historicos' && <Historicos />}
        {mainTab === 'comparador' && <Comparador />}
        {mainTab === 'pt' && (
          <Dashboard
            title="Costos Unitarios"
            soloData={FLETES_SOLO_URDIDO}
            engomadoData={FLETES_URDIDO_ENGOMADO}
          />
        )}
      </main>
    </div>
  );
}

export default App;
