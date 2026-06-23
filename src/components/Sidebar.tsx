import type { TabId } from '../types';
import {
  Hash, ToggleLeft, Radio, GitBranch, Layers, Puzzle, TrendingUp,
  Settings, History, Calculator
} from 'lucide-react';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onConfig: () => void;
  onHistory: () => void;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'nres', label: 'N Resultados', icon: Hash },
  { id: 'props', label: 'Props', icon: ToggleLeft },
  { id: 'proxy', label: 'Proxy', icon: Radio },
  { id: 'aub', label: 'A ou B', icon: GitBranch },
  { id: 'combo', label: 'Combinada', icon: Layers },
  { id: 'poi', label: 'Bet Builder', icon: Puzzle },
  { id: 'asia', label: 'Asiáticos', icon: TrendingUp },
];

export function Sidebar({ activeTab, onChange, onConfig, onHistory }: Props) {
  return (
    <aside className="w-60 border-r border-border flex flex-col shrink-0"
      style={{
        background: 'rgba(11, 15, 23, 0.7)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
      }}
    >
      <div className="px-4 py-5 border-b border-border"
        style={{ background: 'rgba(11, 15, 23, 0.4)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow">
            <Calculator size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary tracking-tight">Kelly Stake Pro</div>
            <div className="text-[10px] text-text-muted font-mono">v2.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="section-title px-2">Mercados</div>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-selected={activeTab === t.id}
            className="nav-item"
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <div className="section-title px-2">Sistema</div>
        <button type="button" onClick={onConfig} className="nav-item">
          <Settings size={16} />
          <span>Configurações</span>
        </button>
        <button type="button" onClick={onHistory} className="nav-item">
          <History size={16} />
          <span>Histórico</span>
        </button>
      </div>
    </aside>
  );
}
