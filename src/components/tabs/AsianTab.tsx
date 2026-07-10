import { RotateCcw, Lightbulb } from 'lucide-react';
import { HelpTip } from '../HelpTip';
import { Select } from '../Select';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
}

export function AsianTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
  const mode = values['asia-mode'] || 'total';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel border-warn/30 bg-warn-soft/20">
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
              <input type="text" inputMode="decimal" autoComplete="off" value={values['asia-your'] || ''} onChange={e => onChange('asia-your', e.target.value)} className="input-dark input-highlight" placeholder="1.95" />
            </div>
          </div>

        {mode === 'total' && (
          <div className="space-y-3 animate-fade-in">
            <div className="section-title">Calibração Poisson</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Linha O/U calibradora<HelpTip text="Linha de gols com odds Over/Under conhecidas, usada para estimar a intensidade (μ) da Poisson. Ex.: 2.5" /></label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['asia-cal-line'] || ''} onChange={e => onChange('asia-cal-line', e.target.value)} className="input-dark" placeholder="2.5" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd Over ref.</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['asia-over-ref'] || ''} onChange={e => onChange('asia-over-ref', e.target.value)} className="input-dark" placeholder="1.95" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd Under ref.</label>
                <input type="text" inputMode="decimal" autoComplete="off" value={values['asia-under-ref'] || ''} onChange={e => onChange('asia-under-ref', e.target.value)} className="input-dark" placeholder="1.95" />
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
              <input type="text" inputMode="decimal" autoComplete="off" value={values['asia-line'] || ''} onChange={e => onChange('asia-line', e.target.value)} className="input-dark" placeholder="2.25" />
            </div>
          </div>
          </div>
        )}

        {mode === 'handicap' && (
          <div className="space-y-3 animate-fade-in">
            <div className="section-title">Odds simples do jogo</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-text-muted mb-1.5 block">Casa (1)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-h'] || ''} onChange={e => onChange('asiah-h', e.target.value)} className="input-dark" placeholder="1.80" /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Empate (X)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-d'] || ''} onChange={e => onChange('asiah-d', e.target.value)} className="input-dark" placeholder="3.60" /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Fora (2)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-a'] || ''} onChange={e => onChange('asiah-a', e.target.value)} className="input-dark" placeholder="4.50" /></div>
            </div>
            <div className="section-title">Calibração</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-text-muted mb-1.5 block">Linha O/U gols</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-ouline'] || ''} onChange={e => onChange('asiah-ouline', e.target.value)} className="input-dark" placeholder="2.5" /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Odd Over</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-over'] || ''} onChange={e => onChange('asiah-over', e.target.value)} className="input-dark" placeholder="1.95" /></div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Odd Under</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asiah-under'] || ''} onChange={e => onChange('asiah-under', e.target.value)} className="input-dark" placeholder="1.95" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-text-muted mb-1.5 block">Dixon-Coles ρ<HelpTip text="Correção de dependência entre poucos gols (Dixon-Coles). Valores típicos entre -0.15 e 0; ~-0.05 é comum. 0 = Poisson pura." /></label><input type="text" inputMode="text" autoComplete="off" value={values['asiah-rho'] || ''} onChange={e => onChange('asiah-rho', e.target.value)} className="input-dark" placeholder="-0.05" /></div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Lado</label>
                <Select value={values['asiah-side'] || 'home'} onChange={v => onChange('asiah-side', v)} options={[
                  { value: 'home', label: 'Casa' },
                  { value: 'away', label: 'Fora' },
                ]} />
              </div>
              <div><label className="text-xs text-text-muted mb-1.5 block">Handicap</label><input type="text" inputMode="text" autoComplete="off" value={values['asiah-line'] || ''} onChange={e => onChange('asiah-line', e.target.value)} className="input-dark" placeholder="-0.5" /></div>
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
              <div><label className="text-[10px] text-text-muted mb-1 block">Ganha cheio</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asia-pwin'] || ''} onChange={e => onChange('asia-pwin', e.target.value)} className="input-dark h-9 text-xs" placeholder="45" /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Ganha meio</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asia-phwin'] || ''} onChange={e => onChange('asia-phwin', e.target.value)} className="input-dark h-9 text-xs" placeholder="0" /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Push</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asia-ppush'] || ''} onChange={e => onChange('asia-ppush', e.target.value)} className="input-dark h-9 text-xs" placeholder="8" /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Perde meio</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asia-phloss'] || ''} onChange={e => onChange('asia-phloss', e.target.value)} className="input-dark h-9 text-xs" placeholder="0" /></div>
              <div><label className="text-[10px] text-text-muted mb-1 block">Perde cheio</label><input type="text" inputMode="decimal" autoComplete="off" value={values['asia-ploss'] || ''} onChange={e => onChange('asia-ploss', e.target.value)} className="input-dark h-9 text-xs" placeholder="47" /></div>
            </div>
          </div>
        )}

        <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4 py-3 text-base">
          Calcular
        </button>
      </div>
    </div>
  );
}
