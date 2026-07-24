import type { TabId } from '../types';
import { TABS } from './tabs';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function SideRail({ activeTab, onChange }: Props) {
  return (
    <aside className="hidden xl:flex w-16 flex-col items-center py-4 border-r border-hairline bg-canvas shrink-0 gap-2 animate-slide-in-left">
      <div className="flex flex-col gap-2 w-full px-2">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`relative group w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                active
                  ? 'bg-accent-soft text-accent ring-1 ring-accent/30'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <t.icon size={18} />
              <span className="absolute left-full ml-2 bg-surface-elevated border border-hairline text-text-primary text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
