import { RotateCcw, Lightbulb, Loader2 } from 'lucide-react';
import { HelpTip } from '../HelpTip';
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

export function AsianTab({ values, onChange, onLoadExample, onReset, onCalculate, isLoading }: Props) {
  const mode = values['asia-mode'] || 'total';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel border-warn/30">
        <p className="text-xs text-text-secondary leading-relaxed">
          Use para linhas com <b>push, meia vitória ou meia derrota</b>: Over 2.25, Under 2.75, DNB e handicaps asiáticos. O cálculo usa retornos por estado — EV e Kelly são resolvidos por crescimento logarítmico.
        </p>
      </div>

      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('asia-total')} className="btn-ghost text-xs">Total asiático</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} aria-hidden="true" /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Modo de cálculo</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tipo</label>
            <Select
              value={mode}
              onChange={v => onChange('asia-mode', v)}
              options={[
                { value: 'total', label: 'Total asiático por Poisson' },
                { value: 'handicap', label: 'Handicap asiático por Dixon-Coles' },
                { value: 'manual', label: 'Estados manuais' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
            <NumberInput value={values['asia-your'] || ''} onChange={v => onChange('asia-your', v)} className="input-highlight" placeholder="1.95" min={1.01} />
          </div>
        </div>

        {mode === 'total' && (
          <div className="space-y-3 animate-fade-in">
            <div className="section-title">Calibração Poisson</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Linha O/U calibradora<HelpTip text="Linha de gols com odds Over/Under conhecidas, usada para estimar a intensidade (μ) da Poisson. Ex.: 2.5" /></label>
                <NumberInput value={values['asia-cal-line'] || ''} onChange={v => onChange('asia-cal-line', v)} placeholder="2.5" min={0} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd Over ref.</label>
                <NumberInput value={values['asia-over-ref'] || ''} onChange={v => onChange('asia-over-ref', v)} placeholder="1.95" min={1.01} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd Under ref.</label>
                <NumberInput value={values['asia-under-ref'] || ''} onChange={v => onChange('asia-under-ref', v)} placeholder="1.95" min={1.01} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Lado apostado</label>
                <Select value={values['asia-side'] || 'over'} onChange={v => onChange('asia-side', v)} options={[
                  { value: 'over', label: 'Over' },
                  { value: 'under', label: 'Under' },
                ]} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Linha asiática alvo</label>
                <NumberInput value={values['asia-line'] || ''} onChange={v => onChange('asia-line', v)} placeholder="2.25" min={0} />
              </div>
            </div>
          </div>
        )}

        {mode === 'handicap' && (
          <div className="space-y-3 animate-fade-in">
            <div className="section-title">Odds simples do jogo</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-text-muted mb-1.5 block">Casa (1)</label><NumberInput value={values['asiah-h'] || ''} onChange={v => onChange('asiah-h', v)} placeholder="1.80" min={1.01} /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Empate (X)</label><NumberInput value={values['asiah-d'] || ''} onChange={v => onChange('asiah-d', v)} placeholder="3.60" min={1.01} /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Fora (2)</label><NumberInput value={values['asiah-a'] || ''} onChange={v => onChange('asiah-a', v)} placeholder="4.50" min={1.01} /></div>
            </div>
            <div className="section-title">Calibração</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-text-muted mb-1.5 block">Linha O/U gols</label><NumberInput value={values['asiah-ouline'] || ''} onChange={v => onChange('asiah-ouline', v)} placeholder="2.5" min={0} /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Odd Over</label><NumberInput value={values['asiah-over'] || ''} onChange={v => onChange('asiah-over', v)} placeholder="1.95" min={1.01} /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Odd Under</label><NumberInput value={values['asiah-under'] || ''} onChange={v => onChange('asiah-under', v)} placeholder="1.95" min={1.01} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Dixon-Coles ρ<HelpTip text="Correção de dependência entre poucos gols (Dixon-Coles). Valores típicos entre -0.15 e 0; ~-0.05 é comum. 0 = Poisson pura." /></label>
                <NumberInput value={values['asiah-rho'] || ''} onChange={v => onChange('asiah-rho', v)} placeholder="-0,05" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Lado</label>
                <Select value={values['asiah-side'] || 'home'} onChange={v => onChange('asiah-side', v)} options={[
                  { value: 'home', label: 'Casa' },
                  { value: 'away', label: 'Fora' },
                ]} />
              </div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Handicap</label><NumberInput value={values['asiah-line'] || ''} onChange={v => onChange('asiah-line', v)} placeholder="-0,5" /></div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Digite o sinal: -0.5 = casa favorita, +0.5 = casa desfavorecida, 0 = neutro. O visitante recebe o inverso.
            </p>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-3 animate-fade-in">
            <div className="section-title">Probabilidades manuais (%)</div>
            <div className="grid grid-cols-5 gap-2">
              <div><label className="text-[10px] text-text-muted mb-1 block">Ganha cheio</label><NumberInput value={values['asia-pwin'] || ''} onChange={v => onChange('asia-pwin', v)} placeholder="45" min={0} max={100} /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Ganha meio</label><NumberInput value={values['asia-phwin'] || ''} onChange={v => onChange('asia-phwin', v)} placeholder="0" min={0} max={100} /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Push</label><NumberInput value={values['asia-ppush'] || ''} onChange={v => onChange('asia-ppush', v)} placeholder="8" min={0} max={100} /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Perde meio</label><NumberInput value={values['asia-phloss'] || ''} onChange={v => onChange('asia-phloss', v)} placeholder="0" min={0} max={100} /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Perde cheio</label><NumberInput value={values['asia-ploss'] || ''} onChange={v => onChange('asia-ploss', v)} placeholder="47" min={0} max={100} /></div>
            </div>
          </div>
        )}

        <button type="button" onClick={onCalculate} disabled={isLoading} className="btn-primary w-full mt-4 py-3 text-base">
          {isLoading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Calculando...</> : 'Calcular'}
        </button>
      </div>
    </div>
  );
}