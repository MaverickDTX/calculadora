import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Lightbulb } from 'lucide-react';
import { MARGIN_PRESETS } from '../../lib/presets';

interface ConsRow { id: number; odd: string; excl: boolean }

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
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

export function ProxyTab({ values, onChange, onLoadExample, onReset }: Props) {
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
    const next = consRows.map(r => r.id === id ? { ...r, [field]: value } : r);
    setConsRows(next);
    onChange('proxy-cons-odds', next.map(r => r.odd).join(','));
    onChange('proxy-cons-excl', next.map(r => String(r.excl)).join(','));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('proxy-single')} className="btn-ghost text-xs">Referência única</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Modo</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tipo</label>
            <select value={mode} onChange={e => onChange('proxy-mode', e.target.value)} className="input-dark">
              <option value="single">Uma referência + margem</option>
              <option value="consensus">Consenso de casas</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Família da margem</label>
            <select value={family} onChange={e => { onChange('proxy-family', e.target.value); applyPreset(e.target.value); }} className="input-dark">
              <option value="ou_gols_ft">O/U gols FT — 5,0%</option>
              <option value="1x2_ft">1X2 FT — 6,0%</option>
              <option value="asian_handicap_ft">Asian handicap FT — 5,0%</option>
              <option value="btts_ft">BTTS FT — 5,0%</option>
              <option value="dnb_ft">DNB FT — 5,0%</option>
              <option value="handicap_europeu_ft">Handicap europeu FT — 6,0%</option>
              <option value="corners_ou_ft">Corners O/U FT — 6,0%</option>
              <option value="bookings_ou_ft">Cartões O/U FT — 6,5%</option>
              <option value="prop_gols">Prop gols jogador — 5,0%</option>
              <option value="prop_chutes">Prop chutes jogador — 8,0%</option>
              <option value="prop_chutes_gol">Prop chutes no gol — 8,0%</option>
              <option value="prop_cartao">Prop cartão jogador — 8,0%</option>
              <option value="prop_tackles">Prop desarmes jogador — 8,0%</option>
              <option value="prop_faltas">Prop faltas jogador — 7,0%</option>
              <option value="prop_saves">Prop defesas goleiro — 7,0%</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div className="section-title">Referência</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Odd de referência</label>
                <input type="text" value={values['proxy-ref'] || ''} onChange={e => onChange('proxy-ref', e.target.value)} className="input-dark" placeholder="1,70" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Margem presumida (%)</label>
                <input type="text" value={values['proxy-margin'] || ''} onChange={e => onChange('proxy-margin', e.target.value)} className="input-dark" placeholder="5,0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
              <input type="text" value={values['proxy-your'] || ''} onChange={e => onChange('proxy-your', e.target.value)} className="input-dark input-highlight" placeholder="2,20" />
            </div>
          </>
        ) : (
          <>
            <div className="section-title">Consenso de casas</div>
            <div className="space-y-2">
              {consRows.map(row => (
                <div key={row.id} className="flex items-center gap-2">
                  <input type="text" value={row.odd} onChange={e => updateCons(row.id, 'odd', e.target.value)} className="input-dark flex-1" placeholder="Odd" />
                  <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer shrink-0">
                    <input type="checkbox" checked={row.excl} onChange={e => updateCons(row.id, 'excl', e.target.checked)} className="w-4 h-4 rounded border-border bg-surface text-accent" />
                    alvo
                  </label>
                  <button type="button" onClick={() => removeCons(row.id)} className="text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCons} className="btn-ghost text-xs flex items-center gap-1.5"><Plus size={14} /> Casa</button>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Margem presumida (%)</label>
                <input type="text" value={values['proxy-cons-margin'] || ''} onChange={e => onChange('proxy-cons-margin', e.target.value)} className="input-dark" placeholder="5,0" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Sua odd</label>
                <input type="text" value={values['proxy-cons-your'] || ''} onChange={e => onChange('proxy-cons-your', e.target.value)} className="input-dark input-highlight" placeholder="2,20" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
