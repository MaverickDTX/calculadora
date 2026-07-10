import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Lightbulb } from 'lucide-react';
import { MARGIN_PRESETS } from '../../lib/presets';
import { Select } from '../Select';

interface ConsRow { id: number; odd: string; excl: boolean }

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
}

function parseConsRows(oddsStr: string, exclStr: string): ConsRow[] {
  const odds = oddsStr ? oddsStr.split(',').map(s => s.trim()) : [];
  const excls = exclStr ? exclStr.split(',').map(s => s.trim() === 'true') : [];
  const rows: ConsRow[] = [];
  for (let i = 0; i < Math.max(odds.length, excls.length, 1); i++) {
    rows.push({ id: i + 1, odd: odds[i] || '', excl: excls[i] || false });
  }
  return rows;
}

export function ProxyTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
  const mode = values['proxy-mode'] || 'single';
  const family = values['proxy-family'] || 'ou_gols_ft';
  const [consRows, setConsRows] = useState<ConsRow[]>([]);

  useEffect(() => {
    const rows = parseConsRows(values['proxy-cons-odds'] || '', values['proxy-cons-excl'] || '');
    setConsRows(rows);
  }, [values['proxy-cons-odds'], values['proxy-cons-excl']]);

  const applyPreset = (f: string) => {
    const preset = MARGIN_PRESETS[f];
    if (preset) {
      onChange('proxy-margin', preset.pct.toFixed(1).replace('.', ','));
      onChange('proxy-cons-margin', preset.pct.toFixed(1).replace('.', ','));
    }
  };

  const addCons = () => {
    const next = [...consRows, { id: Date.now(), odd: '', excl: false }];
    setConsRows(next);
    onChange('proxy-cons-odds', next.map(r => r.odd).join(','));
    onChange('proxy-cons-excl', next.map(r => String(r.excl)).join(','));
  };
  const removeCons = (id: number) => {
    const next = consRows.filter(r => r.id !== id);
    setConsRows(next);
    onChange('proxy-cons-odds', next.map(r => r.odd).join(','));
    onChange('proxy-cons-excl', next.map(r => String(r.excl)).join(','));
  };
  const updateCons = (id: number, field: 'odd' | 'excl', value: string | boolean) => {
    if (field === 'odd' && typeof value === 'string') value = value.replace(/,/g, '.'); // força ponto; evita colisão com ','
    const next = consRows.map(r => r.id === id ? { ...r, [field]: value } : r);
    setConsRows(next);
    onChange('proxy-cons-odds', next.map(r => r.odd).join(','));
    onChange('proxy-cons-excl', next.map(r => String(r.excl)).join(','));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('proxy-single')} className="btn-ghost text-xs">Referência única</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} aria-hidden="true" /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Modo</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tipo</label>
            <Select
              value={mode}
              onChange={v => onChange('proxy-mode', v)}
              options={[
                { value: 'single', label: 'Uma referência + margem' },
                { value: 'consensus', label: 'Consenso de casas' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Família da margem</label>
            <Select
              value={family}
              onChange={v => { onChange('proxy-family', v); applyPreset(v); }}
              options={[
                { value: 'ou_gols_ft', label: 'O/U gols FT — 5,0%' },
                { value: '1x2_ft', label: '1X2 FT — 6,0%' },
                { value: 'asian_handicap_ft', label: 'Asian handicap FT — 5,0%' },
                { value: 'btts_ft', label: 'BTTS FT — 5,0%' },
                { value: 'dnb_ft', label: 'DNB FT — 5,0%' },
                { value: 'handicap_europeu_ft', label: 'Handicap europeu FT — 6,0%' },
                { value: 'corners_ou_ft', label: 'Corners O/U FT — 6,0%' },
                { value: 'bookings_ou_ft', label: 'Cartões O/U FT — 6,5%' },
                { value: 'prop_gols', label: 'Prop gols jogador — 5,0%' },
                { value: 'prop_chutes', label: 'Prop chutes jogador — 8,0%' },
                { value: 'prop_chutes_gol', label: 'Prop chutes no gol — 8,0%' },
                { value: 'prop_cartao', label: 'Prop cartão jogador — 8,0%' },
                { value: 'prop_tackles', label: 'Prop desarmes jogador — 8,0%' },
                { value: 'prop_faltas', label: 'Prop faltas jogador — 7,0%' },
                { value: 'prop_saves', label: 'Prop defesas goleiro — 7,0%' },
                { value: 'custom', label: 'Personalizada' },
              ]}
            />
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div className="section-title">Referência</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd de referência</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['proxy-ref'] || ''} onChange={e => onChange('proxy-ref', e.target.value)} className="input-dark" placeholder="1.70" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Margem presumida (%)</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['proxy-margin'] || ''} onChange={e => onChange('proxy-margin', e.target.value)} className="input-dark" placeholder="5.0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
              <input type="text" inputMode="decimal" autoComplete="off" value={values['proxy-your'] || ''} onChange={e => onChange('proxy-your', e.target.value)} className="input-dark input-highlight" placeholder="2.20" />
            </div>
            <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4">Calcular</button>
          </>
        ) : (
          <>
            <div className="section-title">Consenso de casas</div>
            <div className="space-y-2">
              {consRows.map(row => (
                <div key={row.id} className="flex items-center gap-2">
                  <input type="text" inputMode="decimal" autoComplete="off" value={row.odd} onChange={e => updateCons(row.id, 'odd', e.target.value)} className="input-dark flex-1" placeholder="Odd" />
                  <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer shrink-0">
                    <input type="checkbox" checked={row.excl} onChange={e => updateCons(row.id, 'excl', e.target.checked)} className="w-4 h-4 rounded border-border bg-surface text-accent" />
                    alvo
                  </label>
                  <button type="button" aria-label="Remover casa" onClick={() => removeCons(row.id)} className="icon-btn text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Trash2 size={14} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCons} className="btn-ghost text-xs flex items-center gap-1.5"><Plus size={14} aria-hidden="true" /> Casa</button>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Margem presumida (%)</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['proxy-cons-margin'] || ''} onChange={e => onChange('proxy-cons-margin', e.target.value)} className="input-dark" placeholder="5.0" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['proxy-cons-your'] || ''} onChange={e => onChange('proxy-cons-your', e.target.value)} className="input-dark input-highlight" placeholder="2.20" />
              </div>
            </div>
            <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4">Calcular</button>
          </>
        )}
      </div>
    </div>
  );
}
