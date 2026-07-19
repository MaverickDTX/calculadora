import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { HelpTip } from '../HelpTip';
import { MARGIN_PRESETS } from '../../lib/presets';
import { Select } from '../Select';
import { NumberInput } from '../NumberInput';

interface ConsRow { id: number; odd: string; excl: boolean }

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
  hideCalcButton?: boolean;
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

export function ProxyTab({ values, onChange, onLoadExample, onReset, onCalculate, hideCalcButton = false }: Props) {
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
    if (field === 'odd' && typeof value === 'string') value = value.replace(/,/g, '.');
    const next = consRows.map(r => r.id === id ? { ...r, [field]: value } : r);
    setConsRows(next);
    onChange('proxy-cons-odds', next.map(r => r.odd).join(','));
    onChange('proxy-cons-excl', next.map(r => String(r.excl)).join(','));
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        <button type="button" onClick={() => onLoadExample('proxy-single')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Referência única</button>
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      <div className="panel panel-focus space-y-3">
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
                <label className="text-xs text-text-muted mb-1.5 block flex items-center gap-1">Odd de referência<HelpTip text="Odds de mercado eficiente usada como proxy" /></label>
                <NumberInput value={values['proxy-ref'] || ''} onChange={v => onChange('proxy-ref', v)} placeholder="1.70" min={1.01} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block flex items-center gap-1">Margem presumida (%)<HelpTip text="Margem estimada do mercado de referência" /></label>
                <NumberInput value={values['proxy-margin'] || ''} onChange={v => onChange('proxy-margin', v)} placeholder="5.0" min={0} max={30} />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
              <NumberInput value={values['proxy-your'] || ''} onChange={v => onChange('proxy-your', v)} className="input-highlight" placeholder="2.20" min={1.01} />
            </div>
            {!hideCalcButton && (
              <button type="button" onClick={onCalculate} className="btn-calc w-full mt-4">Calcular</button>
            )}
          </>
        ) : (
          <>
            <div className="section-title">Consenso de casas</div>
            <div className="space-y-2">
              {consRows.map(row => (
                <div key={row.id} className="flex items-center gap-2">
                  <NumberInput value={row.odd} onChange={v => updateCons(row.id, 'odd', v)} placeholder="Odd" min={1.01} />
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
                <label className="text-xs text-text-muted mb-1.5 block flex items-center gap-1">Margem presumida (%)<HelpTip text="Margem estimada do mercado de referência" /></label>
                <NumberInput value={values['proxy-cons-margin'] || ''} onChange={v => onChange('proxy-cons-margin', v)} placeholder="5.0" min={0} max={30} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
                <NumberInput value={values['proxy-cons-your'] || ''} onChange={v => onChange('proxy-cons-your', v)} className="input-highlight" placeholder="2.20" min={1.01} />
              </div>
            </div>
            {!hideCalcButton && (
              <button type="button" onClick={onCalculate} className="btn-calc w-full mt-4">Calcular</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}