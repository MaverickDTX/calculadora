import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { numDec, splitComboOdds } from '../../lib/math';
import { Select } from '../Select';
import { NumberInput } from '../NumberInput';

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
  onCalculate: () => void;
  isLoading?: boolean;
}

function parseLegs(saved: string): ComboLeg[] {
  if (!saved) return [];
  return saved.split(';').map(legStr => {
    const parts = legStr.split('|');
    const nWays = parseInt(parts[0]) || 2;
    return { id: Math.random(), nWays, sideIdx: parseInt(parts[1]) || 0, odds: parts[2] ? splitComboOdds(parts[2], nWays) : ['', ''] };
  });
}

function serializeLegs(legs: ComboLeg[]): string {
  return legs.map(l => `${l.nWays}|${l.sideIdx}|${l.odds.join(',')}`).join(';');
}

export function ComboTab({ values, onChange, onLoadExample, onReset, onCalculate, isLoading }: Props) {
  const [legs, setLegs] = useState<ComboLeg[]>([]);

  useEffect(() => {
    const incoming = values['combo-legs'] || '';
    setLegs(prev => incoming === serializeLegs(prev) ? prev : parseLegs(incoming));
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
    value = value.replace(/,/g, '.');
    const next = legs.map(l => l.id !== legId ? l : { ...l, odds: l.odds.map((o, i) => i === idx ? value : o) });
    setLegs(next);
    onChange('combo-legs', serializeLegs(next));
  };

  const hasTail = legs.some(l => { const o = numDec(l.odds[l.sideIdx]); return o > 0 && (o < 1.20 || o > 10); });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Examples row */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        <button type="button" onClick={() => onLoadExample('combo-boost')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">4 pernas</button>
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      {/* Pernas card */}
      <div className="panel panel-focus space-y-4">
        <div className="section-title">PERNAS ({legs.length})</div>

        <div className="space-y-3">
          {legs.map((leg, idx) => (
            <div key={leg.id} className="panel p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-muted mr-1">#{idx + 1}</span>
                <Select
                  value={String(leg.nWays)}
                  onChange={v => updateLeg(leg.id, { nWays: parseInt(v), sideIdx: 0, odds: parseInt(v) >= 3 ? [...leg.odds, ''] : leg.odds.slice(0, 2) })}
                  options={[
                    { value: '2', label: '2 vias' },
                    { value: '3', label: '3 vias' },
                  ]}
                />
                <Select
                  value={String(leg.sideIdx)}
                  onChange={v => updateLeg(leg.id, { sideIdx: parseInt(v) })}
                  options={[
                    { value: '0', label: 'Via 1 (apostado)' },
                    { value: '1', label: 'Via 2' },
                    ...(leg.nWays >= 3 ? [{ value: '2', label: 'Via 3' }] : []),
                  ]}
                />
                <button type="button" aria-label="Remover perna" onClick={() => removeLeg(leg.id)} className="icon-btn ml-auto text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors">
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {leg.odds.map((o, i) => (
                  <div key={i}>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 block">ODD VIA {i + 1}</label>
                    <NumberInput value={o} onChange={v => updateOdd(leg.id, i, v)} />
                  </div>
                ))}
              </div>
              {hasTail && (
                <div className="flex items-center gap-1.5 text-[11px] text-warn">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Perna de cauda — divergência entre escalas pode ser material
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addLeg} className="btn-ghost text-xs flex items-center gap-1.5">
          <Plus size={14} aria-hidden="true" /> Adicionar perna
        </button>
      </div>

      {/* Aposta combinada */}
      <div className="panel panel-focus space-y-4">
        <div className="section-title">APOSTA COMBINADA</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">SUA ODD COMBINADA</label>
            <NumberInput value={values['combo-your'] || ''} onChange={v => onChange('combo-your', v)} className="input-highlight" placeholder="7.03" min={1.01} />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">ODD JUSTA ESTIMADA</label>
            <input type="text" inputMode="text" autoComplete="off" className="input-dark" placeholder="—" readOnly tabIndex={-1} />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={values['combo-corr'] === 'true'} onChange={e => onChange('combo-corr', String(e.target.checked))} className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30" />
          <span className="text-sm text-text-secondary">Pernas do mesmo jogo / potencialmente correlacionadas</span>
        </label>
        {values['combo-corr'] === 'true' && (
          <div className="flex items-start gap-2 text-xs text-danger rounded-lg p-2.5 border border-danger/20" style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            Para pernas do mesmo jogo, use a aba <b>Bet Builder</b> — o produto de independentes é inválido quando correlacionado.
          </div>
        )}

        <button type="button" onClick={onCalculate} disabled={isLoading} className="btn-primary w-full">
          {isLoading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Calculando...</> : 'Calcular'}
        </button>
      </div>

      {/* Info footer */}
      <div className="px-4 py-3 rounded-lg border border-border/50 bg-surface text-[11px] text-text-muted leading-relaxed">
        Use para combinadas de <b>jogos diferentes</b>. O de-vig é feito internamente nas 4 escalas (proporcional, probit, log, Shin). O veredito mostra a faixa de EV entre escalas.
      </div>
    </div>
  );
}
