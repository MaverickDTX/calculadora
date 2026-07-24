import { useRef, type KeyboardEvent } from 'react';
import type { TabId, Config } from '../types';
import { Calculator } from 'lucide-react';
import { APP_VERSION } from '../version';
import { TABS } from './tabs';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onConfig: () => void;
  config: Config;
}

export function Topbar({ activeTab, onChange, onConfig, config }: Props) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (index + dir + TABS.length) % TABS.length;
      tabRefs.current[next]?.focus();
      onChange(TABS[next].id);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center pr-4 border-b border-border bg-[var(--color-canvas)]">
      {/* Brand */}
      <div className="flex items-center shrink-0">
        <div className="w-14 xl:w-16 h-14 flex items-center justify-center shrink-0" aria-hidden="true">
          <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
            <Calculator size={20} className="text-[var(--color-canvas)]" />
          </div>
        </div>
        <div className="hidden sm:block leading-none pr-4">
          <div className="text-sm font-bold text-text-primary tracking-tight">Kelly Stake Pro</div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">v{APP_VERSION}</div>
        </div>
      </div>

      {/* Pills (desktop) */}
      <nav className="hidden md:flex xl:hidden flex-1 items-center gap-1 overflow-x-auto scrollbar-thin px-2" role="tablist" aria-label="Mercados">
        {TABS.map((t, i) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              ref={el => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              onKeyDown={e => onTabKey(e, i)}
              className={`h-9 px-3.5 rounded-md flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                active
                  ? 'bg-accent-soft text-accent ring-1 ring-accent/40'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <t.icon size={14} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <button type="button" onClick={onConfig} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface text-[11px] font-mono font-semibold text-text-muted hover:border-hairline-strong transition-colors">
          <span className="text-accent">Kelly</span>
          <span>{config.frac}×</span>
          <span className="text-text-muted">·</span>
          <span>R${config.bank.toLocaleString('pt-BR')}</span>
        </button>
      </div>
    </header>
  );
}
