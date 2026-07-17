import { Plus, Minus } from 'lucide-react';
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

export function NResultsTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
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
    { key: 'nres-1x2', label: '1X2', desc: 'Casa 2,50 · Empate 3,30 · Fora 2,80' },
    { key: 'nres-ou', label: 'Over/Under', desc: 'Over 1,95 · Under 1,95' },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        {presets.map(p => (
          <button key={p.key} type="button" onClick={() => onLoadExample(p.key)} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">{p.label}</button>
        ))}
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      <div className="panel panel-focus">
        <div className="section-title">Mercado</div>
        <div className="mb-4">
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

        <div className="section-title flex items-center gap-1">Odds da casa (mercado completo)<HelpTip text="Todas as vias são usadas juntas para remover a margem do mercado." /></div>
        <div className="space-y-2 rounded-xl border border-border bg-surface/40 p-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-3 rounded-lg border border-border p-2.5">
            <label className="text-xs text-text-muted flex items-center gap-1">{outcomeLabel(0)}<HelpTip text="Odd de referência para a seleção que você quer apostar" /></label>
            <NumberInput value={values['nres-eval'] || ''} onChange={v => onChange('nres-eval', v)} placeholder="2.50" min={1.01} />
          </div>
          {others.map((v, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_10rem_auto] items-center gap-3 rounded-lg border border-border p-2.5">
              <span className="text-xs text-text-muted">{outcomeLabel(i + 1)}</span>
              <NumberInput value={v} onChange={v => changeOther(i, v)} placeholder="Odd" min={1.01} />
              {others.length > 1 && (
                <button type="button" aria-label="Remover resultado" onClick={() => removeOther(i)} className="icon-btn text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Minus size={16} aria-hidden="true" /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOther} className="btn-ghost text-xs flex items-center gap-1.5"><Plus size={14} aria-hidden="true" /> Adicionar resultado</button>
        </div>

        <div className="mt-4">
          <label className="text-xs text-accent mb-1.5 block">Odd da sua aposta</label>
          <NumberInput value={values['nres-your'] || ''} onChange={v => onChange('nres-your', v)} className="input-highlight" placeholder="2.65" min={1.01} />
          <p className="mt-1.5 text-[11px] text-text-muted">Casa onde você vai apostar</p>
        </div>
      </div>

      <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4 py-3 text-base">
        Calcular
      </button>
    </div>
  );
}
