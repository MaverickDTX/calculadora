import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, RotateCcw, Lightbulb } from 'lucide-react';
import { numDec } from '../../lib/math';

interface ComboLeg {
  id: number;
  nWays: number;
  sideIdx: number;
  odds: string[];
}

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
}

function parseLegs(saved: string): ComboLeg[] {
  if (!saved) return [];
  return saved.split(';').map(legStr => {
    const parts = legStr.split('|');
    return { id: Math.random(), nWays: parseInt(parts[0]) || 2, sideIdx: parseInt(parts[1]) || 0, odds: parts[2] ? parts[2].split(',') : ['', ''] };
  });
}

function serializeLegs(legs: ComboLeg[]): string {
  return legs.map(l => `${l.nWays}|${l.sideIdx}|${l.odds.join(',')}`).join(';');
}

export function ComboTab({ values, onChange, onLoadExample, onReset }: Props) {
  const [legs, setLegs] = useState<ComboLeg[]>([]);

  useEffect(() => {
    setLegs(parseLegs(values['combo-legs'] || ''));
  }, [values['combo-legs']]);

  const addLeg = () => {
    const next = [...legs, { id: Date.now(), nWays: 2, sideIdx: 0, odds: ['', ''] }];
    setLegs(next);
    onChange('combo-legs', serializeLegs(next));
  };
  const removeLeg = (id: number) => {
    const next = legs.filter(l => l.id !== id);
    setLegs(next);
    onChange('combo-legs', serializeLegs(next));
  };
  const updateLeg = (id: number, updates: Partial<ComboLeg>) => {
    const next = legs.map(l => l.id === id ? { ...l, ...updates } : l);
    setLegs(next);
    onChange('combo-legs', serializeLegs(next));
  };
  const updateOdd = (legId: number, idx: number, value: string) => {
    const next = legs.map(l => l.id !== legId ? l : { ...l, odds: l.odds.map((o, i) => i === idx ? value : o) });
    setLegs(next);
    onChange('combo-legs', serializeLegs(next));
  };

  const hasTail = legs.some(l => { const o = numDec(l.odds[l.sideIdx]); return o > 0 && (o < 1.20 || o > 10); });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel border-warn/30" style={{ background: 'rgba(245, 158, 11, 0.04)' }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Use para combinadas de <b>jogos diferentes</b>. O de-vig é feito internamente nas 4 escalas (proporcional, probit, log, Shin). O veredito mostra a faixa de EV entre escalas.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('combo-boost')} className="btn-ghost text-xs">4 pernas</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Sua odd</div>
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Odd combinada (com boost se houver)</label>
          <input type="text" value={values['combo-your'] || ''} onChange={e => onChange('combo-your', e.target.value)} className="input-dark input-highlight" placeholder="7,03" />
        </div>

        <div className="divider" />

        <div className="section-title">Pernas</div>
        <div className="space-y-3">
          {legs.map(leg => (
            <div key={leg.id} className="panel p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <select value={leg.nWays} onChange={e => updateLeg(leg.id, { nWays: parseInt(e.target.value), sideIdx: 0, odds: parseInt(e.target.value) >= 3 ? [...leg.odds, ''] : leg.odds.slice(0, 2) })} className="input-dark h-9 text-xs">
                  <option value={2}>2 vias</option>
                  <option value={3}>3 vias</option>
                </select>
                <select value={leg.sideIdx} onChange={e => updateLeg(leg.id, { sideIdx: parseInt(e.target.value) })} className="input-dark h-9 text-xs">
                  <option value={0}>Via 1 (apostado)</option>
                  <option value={1}>Via 2</option>
                  {leg.nWays >= 3 && <option value={2}>Via 3</option>}
                </select>
                <button type="button" onClick={() => removeLeg(leg.id)} className="ml-auto text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {leg.odds.map((o, i) => (
                  <div key={i}>
                    <label className="text-[10px] text-text-muted mb-1 block">Odd via {i + 1}</label>
                    <input type="text" value={o} onChange={e => updateOdd(leg.id, i, e.target.value)} className="input-dark h-9 text-xs" />
                  </div>
                ))}
              </div>
              {hasTail && (
                <div className="flex items-center gap-1.5 text-[11px] text-warn">
                  <AlertTriangle size={12} />
                  Perna de cauda — divergência entre escalas pode ser material
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addLeg} className="btn-ghost text-xs flex items-center gap-1.5">
          <Plus size={14} /> Perna
        </button>

        <div className="divider" />

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={values['combo-corr'] === 'true'} onChange={e => onChange('combo-corr', String(e.target.checked))} className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30" />
          <span className="text-sm text-text-secondary">Pernas do mesmo jogo / potencialmente correlacionadas</span>
        </label>
        {values['combo-corr'] === 'true' && (
          <div className="flex items-start gap-2 text-xs text-danger rounded-lg p-2.5 border border-danger/20" style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Para pernas do mesmo jogo, use a aba <b>Bet Builder</b> — o produto de independentes é inválido quando correlacionado.
          </div>
        )}
      </div>
    </div>
  );
}
