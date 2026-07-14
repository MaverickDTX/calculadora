import { MARGIN_PRESETS } from '../../lib/presets';
import { Select } from '../Select';
import { NumberInput } from '../NumberInput';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
}

export function PropsTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
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
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        <button type="button" onClick={() => onLoadExample('prop-anytime')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Anytime scorer</button>
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      <div className="panel panel-focus space-y-3">
        <div className="section-title">Prop</div>
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">FAMÍLIA</label>
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
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">LADO A APOSTAR</label>
          <Select
            value={evalNo ? 'no' : 'yes'}
            onChange={v => onChange('prop-side-no', String(v === 'no'))}
            options={[
              { value: 'yes', label: 'Sim (evento ocorre)' },
              { value: 'no', label: 'Não (evento não ocorre)' },
            ]}
          />
        </div>
      </div>

      <div className="panel panel-focus space-y-3">
        <div className="section-title">Odds de referência</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">ODDS {evalLabel.toUpperCase()} (REF)</label>
            <NumberInput value={values[evalNo ? 'prop-ref-no' : 'prop-ref-yes'] || ''} onChange={v => onChange(evalNo ? 'prop-ref-no' : 'prop-ref-yes', v)} placeholder="2.10" min={1.01} />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">ODDS {otherLabel.toUpperCase()} (REF)</label>
            <NumberInput value={values[evalNo ? 'prop-ref-yes' : 'prop-ref-no'] || ''} onChange={v => onChange(evalNo ? 'prop-ref-yes' : 'prop-ref-no', v)} placeholder="1.80" min={1.01} />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">SUA ODD</label>
          <NumberInput value={values['prop-your'] || ''} onChange={v => onChange('prop-your', v)} className="input-highlight" placeholder="2.30" min={1.01} />
        </div>

        <div className="pt-2 border-t border-border space-y-3">
          <button
            type="button"
            onClick={() => onChange('prop-margin-on', String(!marginOn))}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${marginOn ? 'bg-accent/15 text-accent border border-accent/40' : 'bg-surface-hover text-text-muted border border-border'}`}
          >
            <span className={`w-2 h-2 rounded-full ${marginOn ? 'bg-accent' : 'bg-[#4B5563]'}`} />
            Margem: {marginOn ? 'Ativada' : 'Desativada'}
          </button>

          {marginOn && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">MARGEM PRESUMIDA (%)</label>
              <NumberInput value={values['prop-margin'] || ''} onChange={v => onChange('prop-margin', v)} placeholder="5.0" min={0} max={30} />
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4 py-3 text-base">
        Calcular
      </button>
    </div>
  );
}
