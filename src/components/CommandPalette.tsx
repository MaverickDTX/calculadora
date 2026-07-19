import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Settings, Sun } from 'lucide-react';
import type { TabId } from '../types';
import { TABS } from './tabs';
import { useDialog } from '../hooks/useDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (tab: TabId) => void;
  onSettings: () => void;
  onToggleTheme: () => void;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const EXTRA = [
  { id: 'settings', label: 'Configurações', sub: 'Ajuste banca, fração e método de de-vig', icon: Settings, action: 'settings' as const },
  { id: 'theme', label: 'Alternar tema', sub: 'Ink (escuro) · Ivory (claro)', icon: Sun, action: 'theme' as const },
];

export function CommandPalette({ open, onClose, onSelect, onSettings, onToggleTheme }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { dialogProps } = useDialog<HTMLDivElement>({ open, onClose, labelId: 'command-palette-title' });

  const items = useMemo(() => {
    const tabs = TABS.map(t => ({
      id: t.id,
      label: t.label,
      sub: '',
      icon: t.icon,
      action: 'tab' as const,
    }));
    return [...tabs, ...EXTRA];
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(it => normalize(it.label).includes(q) || normalize(it.sub).includes(q));
  }, [query, items]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else { /* abrir é responsabilidade do App */ }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const choose = (index: number) => {
    const it = filtered[index];
    if (!it) return;
    if (it.action === 'tab') onSelect(it.id as TabId);
    else if (it.action === 'settings') onSettings();
    else if (it.action === 'theme') onToggleTheme();
    onClose();
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] animate-fade-in md:bg-black/60 max-md:bg-black/70 max-md:p-0 max-md:pt-0 max-md:items-stretch"
      onClick={onClose}
    >
      <div
        {...dialogProps}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-surface-2 shadow-float overflow-hidden flex flex-col max-h-[70vh] max-md:max-w-full max-md:max-h-full max-md:h-full max-md:rounded-none"
      >
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search size={16} className="text-text-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar mercado ou ação…"
            aria-label="Buscar"
            className="flex-1 bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin p-2" role="listbox" aria-label="Resultados">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-text-muted">Nenhum resultado</div>
          )}
          {filtered.map((it, i) => {
            const Icon = it.icon;
            const selected = i === active;
            return (
              <button
                key={it.id}
                type="button"
                data-idx={i}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 transition-colors ${
                  selected ? 'bg-accent-soft border-accent' : 'border-transparent hover:bg-surface-3'
                }`}
              >
                <Icon size={16} className={selected ? 'text-accent shrink-0' : 'text-text-muted shrink-0'} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block text-sm ${selected ? 'text-accent font-medium' : 'text-text-primary'}`}>{it.label}</span>
                  {it.sub && <span className="block text-xs text-text-muted truncate">{it.sub}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
