import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export type MainTab = 'historicos' | 'comparador' | 'pt';
export type PtSubTab = 'fletes' | 'me';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  ptSubTab: PtSubTab;
  onPtSubTabChange: (sub: PtSubTab) => void;
}

export default function Header({ activeTab, onTabChange, ptSubTab, onPtSubTabChange }: HeaderProps) {
  const [ptOpen, setPtOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setPtOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navBtn = (label: string, tab: MainTab) => (
    <button
      onClick={() => { onTabChange(tab); if (tab !== 'pt') setPtOpen(false); }}
      className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
        activeTab === tab ? 'bg-white text-[#1e2a5e]' : 'text-white hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-[#1e2a5e] text-white flex items-center justify-between px-6 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#1e2a5e] font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-lg tracking-wide">Towell</span>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {navBtn('Históricos', 'historicos')}
        {navBtn('Comparador', 'comparador')}

        {/* PT dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => { onTabChange('pt'); setPtOpen(v => !v); }}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'pt' ? 'bg-white text-[#1e2a5e]' : 'text-white hover:bg-white/20'
            }`}
          >
            PT <ChevronDown size={14} className={`transition-transform ${ptOpen ? 'rotate-180' : ''}`} />
          </button>
          {ptOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => { onPtSubTabChange('fletes'); setPtOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors ${
                  ptSubTab === 'fletes' ? 'font-semibold text-[#1e2a5e] bg-blue-50' : 'text-gray-700'
                }`}
              >
                Fletes
              </button>
              <button
                onClick={() => { onPtSubTabChange('me'); setPtOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors ${
                  ptSubTab === 'me' ? 'font-semibold text-[#1e2a5e] bg-blue-50' : 'text-gray-700'
                }`}
              >
                ME
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
