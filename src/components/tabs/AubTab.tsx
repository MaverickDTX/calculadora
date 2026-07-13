import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { HelpTip } from '../HelpTip';
import { NumberInput } from '../NumberInput';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
}

function parseRows(oddsStr: string): { id: number; value: string }[] {
  const odds = oddsStr ? oddsStr.split(',').map(s => s.trim()) : [];
  const rows: { id: number; value: string }[] = [];
  for (let i = 0; i < Math.max(odds.length, 2); i++) {
    rows.push({ id: i + 1, value: odds[i] || '' });
  }
  return rows;
}

export function AubTab({ values, onChange, onLoadExample, onReset, onCalculate }: Props) {
  const [rows, setRows] = useState<{ id: number; value: string }[]>([]);

  useEffect(() => {
    setRows(parseRows(values['aub-odds'] || ''));
  }, [values['aub-odds']]);

  const addRow = () => {
    if (rows.length < 10) {
      const next = [...rows, { id: Date.now(), value: '' }];
      setRows(next);
      onChange('aub-odds', next.map(r => r.value).filter(Boolean).join(','));
    }
  };
  const removeRow = (id: number) => {
    const next = rows.filter(r => r.id !== id);
    setRows(next);
    onChange('aub-odds', next.map(r => r.value).filter(Boolean).join(','));
  };
  const updateRow = (id: number, value: string) => {
    value = value.replace(/,/g, '.');
    const next = rows.map(r => r.id === id ? { ...r, value } : r);
    setRows(next);
    onChange('aub-odds', next.map(r => r.value).filter(Boolean).join(','));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        <button type="button" onClick={() => onLoadExample('aub-basic')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Duas seleções</button>
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Mercado — A ou B</div>
        <p className="text-xs text-text-muted leading-relaxed">
          Calcula a probabilidade de pelo menos uma seleção ocorrer. Para jogadores do mesmo jogo, reduza o stake por correlação.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {rows.slice(0, 2).map((row, idx) => (
            <div key={row.id}>
              <label className="text-xs text-text-muted mb-1.5 block flex items-center gap-1">
                Odds do resultado {String.fromCharCode(65 + idx)}<HelpTip text={`Odd da seleção ${String.fromCharCode(65 + idx)} usada para calcular a probabilidade`} />
              </label>
              <NumberInput value={row.value} onChange={v => updateRow(row.id, v)} placeholder={`odd ${String.fromCharCode(65 + idx)}`} min={1.01} />
            </div>
          ))}
        </div>

        {rows.length > 2 && (
          <div className="space-y-2">
            {rows.slice(2).map((row, idx) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-6 shrink-0">{String.fromCharCode(67 + idx)}</span>
                <NumberInput value={row.value} onChange={v => updateRow(row.id, v)} placeholder={`odd seleção ${String.fromCharCode(67 + idx)}`} min={1.01} />
                <button type="button" aria-label="Remover seleção" onClick={() => removeRow(row.id)} className="icon-btn text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Trash2 size={14} aria-hidden="true" /></button>
              </div>
            ))}
          </div>
        )}

        {rows.length < 10 && (
          <button type="button" onClick={addRow} className="btn-ghost text-xs flex items-center gap-1.5"><Plus size={14} aria-hidden="true" /> Seleção</button>
        )}

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Desconto sobre A (%)</label>
          <NumberInput value={values['aub-discount'] || ''} onChange={v => onChange('aub-discount', v)} placeholder="8" min={0} max={100} />
        </div>
      </div>

      <div className="panel space-y-5">
        <div className="section-title">Aposta</div>
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
          <NumberInput value={values['aub-your'] || ''} onChange={v => onChange('aub-your', v)} className="input-highlight" placeholder="1.85" min={1.01} />
        </div>
        <button type="button" onClick={onCalculate} className="btn-primary w-full">Calcular</button>
      </div>
    </div>
  );
}