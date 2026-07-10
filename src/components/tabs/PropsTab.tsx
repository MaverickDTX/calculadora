import { RotateCcw, Lightbulb } from 'lucide-react';
import { MARGIN_PRESETS } from '../../lib/presets';
import { Select } from '../Select';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
}

export function PropsTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
  const propType = values['prop-type'] || 'simnao';
  const propFamily = values['prop-family'] || 'prop_gols';
  const marginOn = values['prop-margin-on'] !== 'false';
  const evalNo = values['prop-side-no'] === 'true';

  const evalLabel = evalNo ? 'Não/Under' : 'Sim/Over';
  const otherLabel = evalNo ? 'Sim/Over' : 'Não/Under';

  const applyPreset = (family: string) => {
    const preset = MARGIN_PRESETS[family];
    if (preset) onChange('prop-margin', preset.pct.toFixed(1).replace('.', ','));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('prop-anytime')} className="btn-ghost text-xs">Anytime scorer</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} aria-hidden="true" /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Configuração da prop</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Formato</label>
            <Select
              value={propType}
              onChange={v => onChange('prop-type', v)}
              options={[
                { value: 'simnao', label: 'Sim/Não' },
                { value: 'ou', label: 'Over/Under' },
                { value: 'custom', label: 'Outro' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Família da margem</label>
            <Select
              value={propFamily}
              onChange={v => { onChange('prop-family', v); applyPreset(v); }}
              options={[
                { value: 'prop_gols', label: 'Gols jogador — 5,0%' },
                { value: 'prop_chutes', label: 'Chutes jogador — 8,0%' },
                { value: 'prop_chutes_gol', label: 'Chutes no gol — 8,0%' },
                { value: 'prop_cartao', label: 'Cartão jogador — 8,0%' },
                { value: 'prop_tackles', label: 'Desarmes jogador — 8,0%' },
                { value: 'prop_faltas', label: 'Faltas jogador — 7,0%' },
                { value: 'prop_saves', label: 'Defesas goleiro — 7,0%' },
                { value: 'custom', label: 'Personalizada' },
              ]}
            />
          </div>
        </div>

        <div className="section-title">Odds de referência</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Ref. {evalLabel}</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values[evalNo ? 'prop-ref-no' : 'prop-ref-yes'] || ''} onChange={e => onChange(evalNo ? 'prop-ref-no' : 'prop-ref-yes', e.target.value)} className="input-dark" placeholder="2.10" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Ref. {otherLabel}</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values[evalNo ? 'prop-ref-yes' : 'prop-ref-no'] || ''} onChange={e => onChange(evalNo ? 'prop-ref-yes' : 'prop-ref-no', e.target.value)} className="input-dark" placeholder="1.80" />
          </div>
        </div>

        {marginOn && (
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Margem presumida (%)</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['prop-margin'] || ''} onChange={e => onChange('prop-margin', e.target.value)} className="input-dark" placeholder="5.0" />
          </div>
        )}

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
          <input type="text" inputMode="decimal" autoComplete="off" value={values['prop-your'] || ''} onChange={e => onChange('prop-your', e.target.value)} className="input-dark input-highlight" placeholder="2.30" />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={marginOn} onChange={e => onChange('prop-margin-on', String(e.target.checked))} className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30" />
            <span className="text-sm text-text-secondary">Usar margem presumida quando não houver lado contrário</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={evalNo} onChange={e => onChange('prop-side-no', String(e.target.checked))} className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30" />
            <span className="text-sm text-text-secondary">Avaliar o lado {evalNo ? 'Não/Under' : 'Sim/Over'}</span>
          </label>
        </div>
      </div>

      <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4 py-3 text-base">
        Calcular
      </button>
    </div>
  );
}
