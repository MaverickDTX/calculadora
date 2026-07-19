import type { TabId } from '../types';
import {
  Hash, ToggleLeft, Radio, GitBranch, Layers, Puzzle, TrendingUp,
  Settings, Calculator
} from 'lucide-react';
import { APP_VERSION } from '../version';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onConfig: () => void;
}

const TABS: { id: TabId; label: string; short: string; icon: React.ElementType }[] = [
  { id: 'nres', label: 'N Resultados', short: 'N Res.', icon: Hash },
  { id: 'props', label: 'Props', short: 'Props', icon: ToggleLeft },
  { id: 'proxy', label: 'Proxy', short: 'Proxy', icon: Radio },
  { id: 'aub', label: 'A ou B', short: 'A/B', icon: GitBranch },
  { id: 'combo', label: 'Combinada', short: 'Combo', icon: Layers },
  { id: 'poi', label: 'Bet Builder', short: 'Builder', icon: Puzzle },
  { id: 'asia', label: 'Asiáticos', short: 'Asiát.', icon: TrendingUp },
];

const solidBg: React.CSSProperties = {
  background: 'var(--color-surface)',
};

export function Sidebar({ activeTab, onChange, onConfig }: Props) {
  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-60 border-r border-border flex-col shrink-0" style={solidBg}>
        <div className="px-4 py-5 border-b border-border" style={{ background: 'var(--color-surface-hover)' }}>
          <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Calculator size={18} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary tracking-tight">Kelly Stake Pro</div>
              <div className="text-[10px] text-text-muted font-mono">v{APP_VERSION}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin" role="tablist" aria-label="Mercados">
          <div className="section-title px-2" aria-hidden="true">Mercados</div>
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              onClick={() => onChange(t.id)}
              aria-selected={activeTab === t.id}
              className="nav-item"
            >
              <t.icon size={16} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <div className="section-title px-2" aria-hidden="true">Sistema</div>
          <button type="button" onClick={onConfig} className="nav-item" aria-label="Abrir configurações">
            <Settings size={16} aria-hidden="true" />
            <span>Configurações</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav
        role="tablist"
        aria-label="Mercados"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border flex items-stretch"
        style={{ background: 'var(--color-surface-elevated)' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => onChange(t.id)}
            aria-label={t.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === t.id ? 'text-accent' : 'text-text-muted'
            }`}
          >
            <t.icon size={18} aria-hidden="true" />
            <span className="text-[9px] leading-tight font-medium">{t.short}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onConfig}
          aria-label="Abrir configurações"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-text-muted transition-colors"
        >
          <Settings size={18} aria-hidden="true" />
          <span className="text-[9px] leading-tight font-medium">Config</span>
        </button>
      </nav>
    </>
  );
}
