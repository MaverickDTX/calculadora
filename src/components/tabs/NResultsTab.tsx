import { Plus, Minus, Sparkles, RotateCw, AlertTriangle } from 'lucide-react';
import { HelpTip } from '../HelpTip';
import { Select } from '../Select';
import { NumberInput } from '../NumberInput';
import { useMemo } from 'react';
import type { Config } from '../../types';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
  hideCalcButton?: boolean;
  config: Config;
}

export function NResultsTab({ values, onChange, onLoadExample, onReset, onCalculate, hideCalcButton = false, config }: Props) {
  const raw = values['nres-others'] || '';
  const others = raw ? raw.split(',').map(s => s.trim()) : [''];
  const outcomeLabels = {
    '1X2 / Moneyline': ['Casa', 'Empate', 'Fora'],
    'Over/Under': ['Over', 'Under'],
    'Dupla chance': ['Casa/Empate', 'Casa/Fora', 'Empate/Fora'],
    'Ambas marcam': ['Sim', 'Não'],
    'Handicap asiático (3 vias)': ['Casa', 'Empate', 'Fora'],
  }[values['nres-type'] || '1X2 / Moneyline'];
  const outcomeLabel = (index: number) => outcomeLabels?.[index] || `Resultado ${index + 1}`;

  const updateOthers = (newOthers: string[]) => {
    newOthers = newOthers.map(s => s.replace(/,/g, '.'));
    onChange('nres-others', newOthers.join(','));
  };

  const addOther = () => updateOthers([...others, '']);
  const removeOther = (i: number) => {
    const next = others.filter((_, idx) => idx !== i);
    updateOthers(next.length > 0 ? next : ['']);
  };
  const changeOther = (i: number, v: string) => {
    const next = [...others];
    next[i] = v;
    updateOthers(next);
  };

  const presets = [
    { key: 'nres-1x2', label: 'Mercado 1X2 / Moneyline', desc: 'Casa 2.50 · Empate 3.30 · Fora 2.80' },
    { key: 'nres-ou', label: 'Over/Under de Gols', desc: 'Over 1.95 · Under 1.95' },
  ];

  const numWays = values['nres-type'] === 'Over/Under' || values['nres-type'] === 'Ambas marcam' ? 2 : 3;

  const sumProb = useMemo(() => {
    const evalOdd = Number(values['nres-eval']?.replace(',', '.') || 0);
    const othersOdds = others.map(o => Number(o.replace(',', '.')).valueOf()).filter(o => o > 1);
    if (evalOdd <= 1 || othersOdds.length === 0) return null;
    const prob = (1 / evalOdd) + othersOdds.reduce((s, o) => s + (1 / o), 0);
    return prob;
  }, [values['nres-eval'], others]);

  const hasOddsFilled = (values['nres-eval']?.trim() ?? '') !== '' && others.some(o => o.trim() !== '');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Exemplos (full width, fino) */}
      <div className="panel py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Exemplos de Mercado</span>
          <button type="button" onClick={onReset} className="text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors flex items-center gap-1">
            <RotateCw size={11} /> Limpar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {presets.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => onLoadExample(p.key)}
              className="border border-border bg-canvas/30 hover:border-accent hover:bg-surface-hover p-2 rounded-lg text-left transition-all flex items-start gap-2 group"
            >
              <div className="w-7 h-7 rounded bg-accent-soft text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-canvas transition-colors">
                <Sparkles size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">{p.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5 font-mono truncate">{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cards 1-2-3 (grid assimétrico) */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_280px] gap-4">
        {/* Card 1: Mercado */}
        <div className="panel" style={{ minHeight: '170px' }}>
          <div className="section-title">Mercado</div>
          <label className="text-xs text-text-muted mb-1.5 block">Tipo do mercado</label>
          <Select
            value={values['nres-type'] || '1X2 / Moneyline'}
            onChange={v => { onChange('nres-type', v); onChange('nres-name', v); }}
            options={[
              { value: '1X2 / Moneyline', label: '1X2 / Moneyline' },
              { value: 'Over/Under', label: 'Over/Under' },
              { value: 'Dupla chance', label: 'Dupla chance' },
              { value: 'Ambas marcam', label: 'Ambas marcam' },
              { value: 'Handicap asiático (3 vias)', label: 'Handicap asiático (3 vias)' },
              { value: 'Outro', label: 'Outro' },
            ]}
          />
        </div>

        {/* Card 2: Odds da Casa */}
        <div className="panel">
          <div className="section-title flex items-center gap-1">
            Odds da casa (mercado completo)
            <HelpTip text="Todas as vias são usadas juntas para remover a margem do mercado." />
          </div>
          <div className={`grid gap-3 ${numWays === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1">{outcomeLabel(0)}</label>
              <NumberInput value={values['nres-eval'] || ''} onChange={v => onChange('nres-eval', v)} placeholder="2.50" min={1.01} />
            </div>
            {others.map((v, i) => (
              <div key={i} className="relative">
                <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1">{outcomeLabel(i + 1)}</label>
                <NumberInput value={v} onChange={v => changeOther(i, v)} placeholder="Odd" min={1.01} />
                {others.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remover resultado"
                    onClick={() => removeOther(i)}
                    className="absolute top-5 right-1 text-text-muted hover:text-danger p-1 rounded hover:bg-danger-soft transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOther}
            className="mt-3 w-full border border-dashed border-hairline-strong hover:border-accent rounded-lg p-2.5 text-xs text-text-muted hover:text-accent transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Adicionar resultado
          </button>
          {sumProb !== null && (
            <div className={`mt-3 flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
              sumProb > 1.20 ? 'border-danger/30 bg-danger/10 text-danger' :
              sumProb > 1.10 ? 'border-warn/30 bg-warn/10 text-warn' :
              sumProb < 1.00 ? 'border-accent/25 bg-accent/10 text-accent' :
              'border-hairline bg-canvas text-text-secondary'
            }`}
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">
                  {sumProb > 1.20 ? `Erro de Linha: Overround Extremo (${((sumProb - 1) * 100).toFixed(1)}%)` :
                   sumProb > 1.10 ? `Margem de Casa Salgada (${((sumProb - 1) * 100).toFixed(1)}%)` :
                   sumProb < 1.00 ? `Margem Negativa / Arbitragem (${((sumProb - 1) * 100).toFixed(1)}%)` :
                   `Mercado Saudável (Overround: ${((sumProb - 1) * 100).toFixed(1)}%)`}
                </div>
                <div className="text-text-secondary mt-0.5">
                  {sumProb > 1.20 ? 'A soma das probabilidades deste mercado é excessivamente alta. Verifique se digitou as odds corretamente.' :
                   sumProb > 1.10 ? 'O overround de mercado está alto. O de-vig funcionará, mas odds com altas margens reduzem o valor matemático sugerido.' :
                   sumProb < 1.00 ? 'As odds criam uma soma de probabilidades inferior a 100%. Odds fantásticas ou oportunidade clara de arbitragem.' :
                   'Parâmetros normais de de-vig'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Sua Aposta */}
        <div className="panel" style={{ minHeight: '170px', background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent)' }}>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-accent)' }}>Odd da sua aposta</label>
          <NumberInput value={values['nres-your'] || ''} onChange={v => onChange('nres-your', v)} className="input-highlight" placeholder="2.65" min={1.01} />
          <p className="mt-1.5 text-[11px] text-text-muted">Casa onde você vai apostar</p>
          {!hideCalcButton && (
            <button type="button" onClick={onCalculate} className="btn-calc w-full mt-4">
              Calcular
            </button>
          )}
        </div>
      </div>

      {/* Card 4: Decomposição (full width, condicional) */}
      {hasOddsFilled && (
        <div className="panel animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Decomposição & Distribuição</span>
            <span className="text-[10px] font-mono text-accent">
              {config.method === 'auto' ? 'Consenso: Automático' : `Método: ${config.method.charAt(0).toUpperCase() + config.method.slice(1)}`}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-canvas rounded border border-hairline p-3">
            <div className="h-3 bg-accent rounded" style={{ width: '38%' }} title="Casa (38%)"></div>
            <div className="h-3 bg-warn rounded" style={{ width: '28%' }} title="Empate (28%)"></div>
            <div className="h-3 bg-danger rounded" style={{ width: '34%' }} title="Fora (34%)"></div>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs text-text-muted font-mono">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-accent rounded-sm"></span>Casa (38%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-warn rounded-sm"></span>Empate (28%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-danger rounded-sm"></span>Fora (34%)</div>
          </div>
        </div>
      )}
    </div>
  );
}