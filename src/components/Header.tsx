import { Button } from '@/components/ui/button';

export type MainTab = 'historicos' | 'comparador' | 'pt';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
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
        {(['historicos', 'comparador', 'pt'] as MainTab[]).map((tab) => {
          const labels: Record<MainTab, string> = {
            historicos: 'Históricos',
            comparador: 'Comparador',
            pt: 'PT',
          };
          return (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab)}
              className={
                activeTab === tab
                  ? 'bg-white text-[#1e2a5e] hover:bg-white hover:text-[#1e2a5e]'
                  : 'text-white hover:bg-white/20 hover:text-white'
              }
            >
              {labels[tab]}
            </Button>
          );
        })}
      </nav>
    </header>
  );
}
