import { Plus, Minus, RotateCcw, Lightbulb } from 'lucide-react';
import { Select } from '../Select';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
}

export function NResultsTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
  const raw = values['nres-others'] || '';
  const others = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [''];

  const updateOthers = (newOthers: string[]) => {
    newOthers = newOthers.map(s => s.replace(/,/g, '.'));
    onChange('nres-others', newOthers.filter(s => s.trim()).join(','));
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
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.key} type="button" onClick={() => onLoadExample(p.key)} className="btn-ghost text-xs">{p.label}</button>
          ))}
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} aria-hidden="true" /> Reset</button>
        </div>
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

        <div className="section-title">Odds de referência</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Resultado avaliado</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['nres-eval'] || ''} onChange={e => onChange('nres-eval', e.target.value)} className="input-dark" placeholder="2.50" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['nres-your'] || ''} onChange={e => onChange('nres-your', e.target.value)} className="input-dark input-highlight" placeholder="2.65" />
          </div>
        </div>

        <div className="section-title">Demais resultados</div>
        <div className="space-y-2">
          {others.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" inputMode="decimal" autoComplete="off" value={v} onChange={e => changeOther(i, e.target.value)} className="input-dark flex-1" placeholder={`Odd do resultado ${i + 2}`} />
              {others.length > 1 && (
                <button type="button" aria-label="Remover resultado" onClick={() => removeOther(i)} className="icon-btn text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Minus size={16} aria-hidden="true" /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOther} className="btn-ghost text-xs flex items-center gap-1.5 mt-1"><Plus size={14} aria-hidden="true" /> Adicionar resultado</button>
        </div>
      </div>

      <button type="button" onClick={onCalculate} className="btn-primary w-full mt-4 py-3 text-base">
        Calcular
      </button>
    </div>
  );
}
