import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Lightbulb } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
}

function parseRows(oddsStr: string): { id: number; value: string }[] {
  const odds = oddsStr ? oddsStr.split(',').map(s => s.trim()) : [];
  const rows: { id: number; value: string }[] = [];
  for (let i = 0; i < Math.max(odds.length, 2); i++) {
    rows.push({ id: i + 1, value: odds[i] || '' });
  }
  return rows;
}

export function AubTab({ values, onChange, onLoadExample, onReset }: Props) {
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
    value = value.replace(/,/g, '.'); // força ponto (padrão das casas); evita colisão com o separador ','
    const next = rows.map(r => r.id === id ? { ...r, value } : r);
    setRows(next);
    onChange('aub-odds', next.map(r => r.value).filter(Boolean).join(','));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('aub-basic')} className="btn-ghost text-xs">Duas seleções</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} aria-hidden="true" /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">A ou B — aproximação independente</div>
        <p className="text-xs text-text-muted leading-relaxed">
          Calcula a probabilidade de pelo menos uma seleção ocorrer. Para jogadores do mesmo jogo, reduza o stake por correlação.
        </p>

        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-6 shrink-0">{String.fromCharCode(65 + idx)}</span>
              <input type="text" inputMode="decimal" autoComplete="off" value={row.value} onChange={e => updateRow(row.id, e.target.value)} className="input-dark flex-1" placeholder={`odd seleção ${String.fromCharCode(65 + idx)}`} />
              {rows.length > 1 && (
                <button type="button" aria-label="Remover seleção" onClick={() => removeRow(row.id)} className="icon-btn text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Trash2 size={14} aria-hidden="true" /></button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="btn-ghost text-xs flex items-center gap-1.5"><Plus size={14} aria-hidden="true" /> Seleção</button>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Desconto correlação (%)</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['aub-discount'] || ''} onChange={e => onChange('aub-discount', e.target.value)} className="input-dark" placeholder="8" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['aub-your'] || ''} onChange={e => onChange('aub-your', e.target.value)} className="input-dark input-highlight" placeholder="1,85" />
          </div>
        </div>
      </div>
    </div>
  );
}
