import type { TabId } from '../types';
import { TABS } from './tabs';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[calc(3.5rem+env(safe-area-inset-bottom))] flex items-stretch border-t border-border bg-[var(--color-canvas)] backdrop-blur supports-[backdrop-filter]:bg-[var(--color-canvas)]/90"
      role="tablist"
      aria-label="Mercados"
    >
      {TABS.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              active
                ? 'text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span
              className={`flex items-center justify-center transition-all ${
                active ? 'scale-110' : 'scale-100'
              }`}
            >
              <t.icon size={20} aria-hidden="true" />
            </span>
            <span className="text-[9px] font-medium leading-none tracking-tight">{t.short}</span>
            {active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </nav>
  );
}