import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, RotateCcw, Lightbulb } from 'lucide-react';

type LegKind = 'over' | 'under' | 'homewin' | 'draw' | 'awaywin' | 'homeNoLose' | 'awayNoLose' | 'btts' | 'homeScores' | 'awayScores' | 'homeOver' | 'homeUnder' | 'awayOver' | 'awayUnder' | 'player' | 'playerprop' | 'cornerTotal' | 'cornerTeam' | 'cornerSide';

interface Leg {
  id: number;
  kind: LegKind;
  line?: string;
  side?: string;
  cSide?: string;
  cDir?: string;
  c1x2?: string;
  anytime?: string;
  anytimeNo?: string;
  ppO0?: string;
  ppO1?: string;
  ppO2?: string;
  ppO3?: string;
  ppO4?: string;
  ppSide?: string;
  ppBeta?: string;
  cBeta?: string;
  ppLine?: string;
}

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
}

const LEG_OPTIONS: { value: LegKind; label: string }[] = [
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
  { value: 'homewin', label: 'Casa vence' },
  { value: 'draw', label: 'Empate' },
  { value: 'awaywin', label: 'Fora vence' },
  { value: 'homeNoLose', label: 'Casa não perde (1X)' },
  { value: 'awayNoLose', label: 'Fora não perde (X2)' },
  { value: 'btts', label: 'Ambas marcam' },
  { value: 'homeScores', label: 'Casa marca' },
  { value: 'awayScores', label: 'Fora marca' },
  { value: 'homeOver', label: 'Casa Over X gols' },
  { value: 'homeUnder', label: 'Casa Under X gols' },
  { value: 'awayOver', label: 'Fora Over X gols' },
  { value: 'awayUnder', label: 'Fora Under X gols' },
  { value: 'player', label: 'Jogador marca' },
  { value: 'playerprop', label: 'Prop jogador (chutes/SOT/faltas)' },
  { value: 'cornerTotal', label: 'Escanteios totais (O/U)' },
  { value: 'cornerTeam', label: 'Escanteios por time (O/U)' },
  { value: 'cornerSide', label: 'Escanteios 1X2' },
];

function parseLegs(saved: string): Leg[] {
  if (!saved) return [];
  return saved.split(';').map(s => {
    const p = s.split('|');
    return {
      id: Math.random(),
      kind: (p[0] as LegKind) || 'over',
      line: p[1],
      side: p[2],
      cSide: p[3],
      cDir: p[4],
      c1x2: p[5],
      anytime: p[6],
      anytimeNo: p[7],
      ppO0: p[8], ppO1: p[9], ppO2: p[10], ppO3: p[11], ppO4: p[12],
      ppSide: p[13], ppBeta: p[14], cBeta: p[15], ppLine: p[16],
    };
  });
}

function serializeLegs(legs: Leg[]): string {
  return legs.map(l => [
    l.kind, l.line, l.side, l.cSide, l.cDir, l.c1x2,
    l.anytime, l.anytimeNo, l.ppO0, l.ppO1, l.ppO2, l.ppO3, l.ppO4,
    l.ppSide, l.ppBeta, l.cBeta, l.ppLine,
  ].join('|')).join(';');
}

export function BetBuilderTab({ values, onChange, onLoadExample, onReset }: Props) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [cornerOpen, setCornerOpen] = useState(false);

  useEffect(() => {
    setLegs(parseLegs(values['poi-legs'] || ''));
  }, [values['poi-legs']]);

  const addLeg = (kind: LegKind = 'over') => {
    if (legs.length < 8) {
      const next = [...legs, {
        id: Date.now(), kind,
        line: kind === 'over' || kind === 'under' ? '2,5' : kind.includes('corner') ? '9,5' : undefined,
      }];
      setLegs(next);
      onChange('poi-legs', serializeLegs(next));
    }
  };
  const removeLeg = (id: number) => {
    const next = legs.filter(l => l.id !== id);
    setLegs(next);
    onChange('poi-legs', serializeLegs(next));
  };
  const updateLeg = (id: number, updates: Partial<Leg>) => {
    const next = legs.map(l => l.id === id ? { ...l, ...updates } : l);
    setLegs(next);
    onChange('poi-legs', serializeLegs(next));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel border-warn/30" style={{ background: 'rgba(245, 158, 11, 0.04)' }}>
        <p className="text-xs text-text-secondary leading-relaxed">
          Use para bet builders do <b>mesmo jogo</b>, quando a correlação entre pernas importa. O modelo Poisson/Dixon-Coles calibra a distribuição de placar a partir das odds simples.
        </p>
      </div>

      <div className="panel">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Exemplos rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onLoadExample('poi-builder')} className="btn-ghost text-xs">Over + Casa vence</button>
          <button type="button" onClick={() => onLoadExample('poi-playerprop')} className="btn-ghost text-xs">Prop jogador</button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
        </div>
      </div>

      <div className="panel panel-focus space-y-5">
        <div className="section-title">Odds simples do jogo</div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-text-muted mb-1.5 block">Casa (1)</label><input type="text" value={values['poi-h'] || ''} onChange={e => onChange('poi-h', e.target.value)} className="input-dark" placeholder="1,80" /></div>
          <div><label className="text-xs text-text-muted mb-1.5 block">Empate (X)</label><input type="text" value={values['poi-d'] || ''} onChange={e => onChange('poi-d', e.target.value)} className="input-dark" placeholder="3,60" /></div>
          <div><label className="text-xs text-text-muted mb-1.5 block">Fora (2)</label><input type="text" value={values['poi-a'] || ''} onChange={e => onChange('poi-a', e.target.value)} className="input-dark" placeholder="4,50" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-text-muted mb-1.5 block">Linha O/U gols</label><input type="text" value={values['poi-ouline'] || ''} onChange={e => onChange('poi-ouline', e.target.value)} className="input-dark" placeholder="2,5" /></div>
          <div><label className="text-xs text-text-muted mb-1.5 block">Odd Over</label><input type="text" value={values['poi-over'] || ''} onChange={e => onChange('poi-over', e.target.value)} className="input-dark" placeholder="1,95" /></div>
          <div><label className="text-xs text-text-muted mb-1.5 block">Odd Under</label><input type="text" value={values['poi-under'] || ''} onChange={e => onChange('poi-under', e.target.value)} className="input-dark" placeholder="1,95" /></div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Correção Dixon-Coles ρ</label>
          <input type="text" value={values['poi-rho'] || ''} onChange={e => onChange('poi-rho', e.target.value)} className="input-dark" placeholder="-0,05" />
        </div>

        <div className="pt-3 border-t border-border">
          <button type="button" onClick={() => setCornerOpen(!cornerOpen)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            <ChevronDown size={16} className={`transition-transform ${cornerOpen ? 'rotate-180' : ''}`} />
            Calibração de escanteios
            <span className="text-xs text-text-muted font-normal">— preencha só se houver perna de escanteio</span>
          </button>
          {cornerOpen && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-text-muted mb-1.5 block">Linha O/U corners</label><input type="text" value={values['poi-c-line'] || ''} onChange={e => onChange('poi-c-line', e.target.value)} className="input-dark" placeholder="9,5" /></div>
                <div><label className="text-xs text-text-muted mb-1.5 block">Odd Over corners</label><input type="text" value={values['poi-c-over'] || ''} onChange={e => onChange('poi-c-over', e.target.value)} className="input-dark" placeholder="1,90" /></div>
                <div><label className="text-xs text-text-muted mb-1.5 block">Odd Under corners</label><input type="text" value={values['poi-c-under'] || ''} onChange={e => onChange('poi-c-under', e.target.value)} className="input-dark" placeholder="1,90" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-text-muted mb-1.5 block">Corner 1X2 — Casa (1) <span className="text-text-muted/70">opcional</span></label><input type="text" value={values['poi-c-1'] || ''} onChange={e => onChange('poi-c-1', e.target.value)} className="input-dark" placeholder="opt" /></div>
                <div><label className="text-xs text-text-muted mb-1.5 block">Empate corners (X)</label><input type="text" value={values['poi-c-x'] || ''} onChange={e => onChange('poi-c-x', e.target.value)} className="input-dark" placeholder="opt" /></div>
                <div><label className="text-xs text-text-muted mb-1.5 block">Visitante (2)</label><input type="text" value={values['poi-c-2'] || ''} onChange={e => onChange('poi-c-2', e.target.value)} className="input-dark" placeholder="opt" /></div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Sem o 1X2 de escanteios, o total é dividido entre os times pela proporção de domínio do jogo (split de gols). Com o 1X2, o split de escanteios é calibrado diretamente. Escanteios costumam ser levemente <b>sobredispersos</b> vs. Poisson — a cauda alta pode ser subestimada (ressalva análoga à de SOT/props).
              </p>
            </div>
          )}
        </div>

        <div className="divider" />

        <div className="section-title">Pernas da combinada</div>
        <div className="space-y-3">
          {legs.map(leg => {
            const isP = leg.kind === 'player';
            const isOU = ['over', 'under', 'homeOver', 'homeUnder', 'awayOver', 'awayUnder'].includes(leg.kind);
            const isPP = leg.kind === 'playerprop';
            const isCT = leg.kind === 'cornerTotal';
            const isCTeam = leg.kind === 'cornerTeam';
            const isCSide = leg.kind === 'cornerSide';
            const isCorner = isCT || isCTeam || isCSide;

            return (
              <div key={leg.id} className="panel p-3 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={leg.kind} onChange={e => {
                    const k = e.target.value as LegKind;
                    const defaults: Partial<Leg> = { kind: k };
                    if (k === 'over' || k === 'under') defaults.line = '2,5';
                    if (['homeOver', 'homeUnder', 'awayOver', 'awayUnder'].includes(k)) defaults.line = '1,5';
                    if (k === 'cornerTotal') defaults.line = '9,5';
                    if (k === 'cornerTeam') defaults.line = '5,5';
                    updateLeg(leg.id, defaults);
                  }} className="input-dark h-9 text-xs">
                    {LEG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  {(isOU || isCT || isCTeam) && (
                    <input type="text" value={leg.line || ''} onChange={e => updateLeg(leg.id, { line: e.target.value })} placeholder="linha" className="input-dark w-20 h-9 text-xs" />
                  )}

                  {(isP || isCTeam) && (
                    <select value={leg.side || 'home'} onChange={e => updateLeg(leg.id, { side: e.target.value })} className="input-dark h-9 text-xs">
                      <option value="home">mandante</option>
                      <option value="away">visitante</option>
                    </select>
                  )}

                  {isCT && (
                    <select value={leg.cSide || 'over'} onChange={e => updateLeg(leg.id, { cSide: e.target.value })} className="input-dark h-9 text-xs">
                      <option value="over">Over</option>
                      <option value="under">Under</option>
                    </select>
                  )}

                  {isCTeam && (
                    <select value={leg.cDir || 'over'} onChange={e => updateLeg(leg.id, { cDir: e.target.value })} className="input-dark h-9 text-xs">
                      <option value="over">Over</option>
                      <option value="under">Under</option>
                    </select>
                  )}

                  {isCSide && (
                    <select value={leg.c1x2 || 'home'} onChange={e => updateLeg(leg.id, { c1x2: e.target.value })} className="input-dark h-9 text-xs">
                      <option value="home">Casa</option>
                      <option value="draw">Empate</option>
                      <option value="away">Visitante</option>
                    </select>
                  )}

                  {isP && (
                    <>
                      <input type="text" value={leg.anytime || ''} onChange={e => updateLeg(leg.id, { anytime: e.target.value })} placeholder="odd Sim" className="input-dark w-24 h-9 text-xs" />
                      <input type="text" value={leg.anytimeNo || ''} onChange={e => updateLeg(leg.id, { anytimeNo: e.target.value })} placeholder="odd Não" className="input-dark w-24 h-9 text-xs" />
                    </>
                  )}

                  <button type="button" onClick={() => removeLeg(leg.id)} className="ml-auto text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {isPP && (
                  <div className="mt-2 pl-3 border-l-2 border-border space-y-2">
                    <div className="grid grid-cols-5 gap-2">
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 0.5 *</label><input type="text" value={leg.ppO0 || ''} onChange={e => updateLeg(leg.id, { ppO0: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 1.5</label><input type="text" value={leg.ppO1 || ''} onChange={e => updateLeg(leg.id, { ppO1: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 2.5</label><input type="text" value={leg.ppO2 || ''} onChange={e => updateLeg(leg.id, { ppO2: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 3.5</label><input type="text" value={leg.ppO3 || ''} onChange={e => updateLeg(leg.id, { ppO3: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 4.5</label><input type="text" value={leg.ppO4 || ''} onChange={e => updateLeg(leg.id, { ppO4: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={leg.ppSide || 'home'} onChange={e => updateLeg(leg.id, { ppSide: e.target.value })} className="input-dark input-compact w-auto text-xs">
                        <option value="home">Mandante</option>
                        <option value="away">Visitante</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-text-muted">
                        Linha
                        <select value={leg.ppLine || '0,5'} onChange={e => updateLeg(leg.id, { ppLine: e.target.value })} className="input-dark input-compact w-auto text-xs">
                          <option value="0,5">Over 0,5</option>
                          <option value="1,5">Over 1,5</option>
                          <option value="2,5">Over 2,5</option>
                          <option value="3,5">Over 3,5</option>
                          <option value="4,5">Over 4,5</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-text-muted">
                        β acoplamento <input type="text" value={leg.ppBeta || '0,54'} onChange={e => updateLeg(leg.id, { ppBeta: e.target.value })} className="input-dark input-compact w-16 text-xs" />
                      </label>
                    </div>
                    <p className="text-[10px] text-text-muted leading-snug">A escada de odds calibra a intensidade (μ). A <b>linha</b> define qual evento entra na probabilidade conjunta: Over k,5 ⇒ P(SOT ≥ k+1). Cauda alta (3,5/4,5) tende a ser subestimada pela Poisson.</p>
                  </div>
                )}

                {isCorner && (
                  <div className="mt-2 pl-3 border-l-2 border-border">
                    <label className="flex items-center gap-1.5 text-xs text-text-muted">
                      β corner↔resultado <input type="text" value={leg.cBeta || '0,15'} onChange={e => updateLeg(leg.id, { cBeta: e.target.value })} className="input-dark input-compact w-16 text-xs" />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => addLeg('over')} className="btn-ghost text-xs flex items-center gap-1.5">
          <Plus size={14} /> Perna
        </button>

        <div className="divider" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Sua odd final</label>
            <input type="text" value={values['poi-your'] || ''} onChange={e => onChange('poi-your', e.target.value)} className="input-dark input-highlight" placeholder="3,15" />
          </div>
        </div>
      </div>
    </div>
  );
}
