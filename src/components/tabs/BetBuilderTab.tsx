import { useState, useRef, memo } from 'react';
import { Plus, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { HelpTip } from '../HelpTip';
import { Select } from '../Select';

type SportId = 'football' | 'tennis' | 'basketball';

type LegKind =
  | 'over' | 'under' | 'homewin' | 'draw' | 'awaywin' | 'homeNoLose' | 'awayNoLose'
  | 'btts' | 'bttsNo' | 'homeScores' | 'awayScores'
  | 'homeOver' | 'homeUnder' | 'awayOver' | 'awayUnder'
  | 'player' | 'playerprop' | 'cornerTotal' | 'cornerTeam' | 'cornerSide'
  // Tennis
  | 'matchWinner' | 'totalGamesOver' | 'totalGamesUnder' | 'totalSetsOver' | 'totalSetsUnder'
  | 'setScore' | 'firstSetWinner' | 'firstSetGamesOver' | 'firstSetGamesUnder' | 'tiebreakInMatch'
  // Basketball
  | 'moneyline' | 'spreadCover' | 'totalOver' | 'totalUnder' | 'teamTotalOver' | 'teamTotalUnder' | 'marginRange';

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
  // Tennis-specific
  setScoreA?: string;
  setScoreB?: string;
  // Basketball-specific
  marginMin?: string;
  marginMax?: string;
}

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
}

// ─── Football leg options ───
const FOOTBALL_LEG_OPTIONS: { value: LegKind; label: string }[] = [
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
  { value: 'homewin', label: 'Casa vence' },
  { value: 'draw', label: 'Empate' },
  { value: 'awaywin', label: 'Fora vence' },
  { value: 'homeNoLose', label: 'Casa não perde (1X)' },
  { value: 'awayNoLose', label: 'Fora não perde (X2)' },
  { value: 'btts', label: 'Ambas marcam' },
  { value: 'bttsNo', label: 'Ambas marcam: Não' },
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

// ─── Tennis leg options ───
const TENNIS_LEG_OPTIONS: { value: LegKind; label: string }[] = [
  { value: 'matchWinner', label: 'Vencedor da partida' },
  { value: 'totalGamesOver', label: 'Over jogos totais' },
  { value: 'totalGamesUnder', label: 'Under jogos totais' },
  { value: 'totalSetsOver', label: 'Over sets totais' },
  { value: 'totalSetsUnder', label: 'Under sets totais' },
  { value: 'setScore', label: 'Placar de sets exato' },
  { value: 'firstSetWinner', label: 'Vencedor do 1º set' },
  { value: 'firstSetGamesOver', label: 'Over games 1º set' },
  { value: 'firstSetGamesUnder', label: 'Under games 1º set' },
  { value: 'tiebreakInMatch', label: 'Tiebreak na partida' },
];

const BASKETBALL_LEG_OPTIONS: { value: LegKind; label: string }[] = [
  { value: 'moneyline', label: 'Vencedor (moneyline)' },
  { value: 'spreadCover', label: 'Cobre o spread' },
  { value: 'totalOver', label: 'Over pontos totais' },
  { value: 'totalUnder', label: 'Under pontos totais' },
  { value: 'teamTotalOver', label: 'Over pontos do time' },
  { value: 'teamTotalUnder', label: 'Under pontos do time' },
  { value: 'marginRange', label: 'Margem de vitória (faixa)' },
];

const SPORT_OPTIONS: { value: SportId; label: string }[] = [
  { value: 'football', label: 'Futebol' },
  { value: 'tennis', label: 'Tênis' },
  { value: 'basketball', label: 'Basquete' },
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
      setScoreA: p[17], setScoreB: p[18],
      marginMin: p[19], marginMax: p[20],
    };
  });
}

function serializeLegs(legs: Leg[]): string {
  return legs.map(l => [
    l.kind, l.line, l.side, l.cSide, l.cDir, l.c1x2,
    l.anytime, l.anytimeNo, l.ppO0, l.ppO1, l.ppO2, l.ppO3, l.ppO4,
    l.ppSide, l.ppBeta, l.cBeta, l.ppLine,
    l.setScoreA, l.setScoreB,
    l.marginMin, l.marginMax,
  ].join('|')).join(';');
}

export const BetBuilderTab = memo(function BetBuilderTab({ values, onChange, onLoadExample, onReset, onCalculate, isLoading }: Props) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [cornerOpen, setCornerOpen] = useState(false);
  const [tennisExtra, setTennisExtra] = useState(false);
  const [basketExtra, setBasketExtra] = useState(false);
  const prevLegsRef = useRef(values['poi-legs']);

  const sport = (values['poi-sport'] as SportId) || 'football';
  const legOptions = sport === 'tennis' ? TENNIS_LEG_OPTIONS : sport === 'basketball' ? BASKETBALL_LEG_OPTIONS : FOOTBALL_LEG_OPTIONS;

  if (values['poi-legs'] !== prevLegsRef.current) {
    prevLegsRef.current = values['poi-legs'];
    const incoming = values['poi-legs'] || '';
    setLegs(prev => incoming === serializeLegs(prev) ? prev : parseLegs(incoming));
  }

  const addLeg = (kind: LegKind = 'over') => {
    if (legs.length < 8) {
      const defaults: Partial<Leg> = { kind };
      if (sport === 'football') {
        if (kind === 'over' || kind === 'under') defaults.line = '2.5';
        if (kind.includes('corner')) defaults.line = '9.5';
      }
      if (sport === 'tennis') {
        if (kind === 'totalGamesOver' || kind === 'totalGamesUnder') defaults.line = '22.5';
        if (kind === 'totalSetsOver' || kind === 'totalSetsUnder') defaults.line = '2.5';
        if (kind === 'firstSetGamesOver' || kind === 'firstSetGamesUnder') defaults.line = '8.5';
        // Gravar o default que o select exibe — sem isso o estado fica com
        // side=undefined enquanto a UI mostra "Jogador A" selecionado.
        if (kind === 'matchWinner' || kind === 'firstSetWinner') defaults.side = 'A';
        if (kind === 'setScore') {
          defaults.setScoreA = '2';
          defaults.setScoreB = '0';
        }
      }
      if (sport === 'basketball') {
        if (kind === 'totalOver' || kind === 'totalUnder') defaults.line = '224.5';
        if (kind === 'spreadCover') defaults.line = '-5.5';
        if (kind === 'teamTotalOver' || kind === 'teamTotalUnder') defaults.line = '112.5';
        if (kind === 'moneyline' || kind === 'spreadCover' || kind === 'teamTotalOver' || kind === 'teamTotalUnder' || kind === 'marginRange') defaults.side = 'A';
        if (kind === 'marginRange') {
          defaults.marginMin = '1';
          defaults.marginMax = '10';
        }
      }
      const next = [...legs, { id: Date.now(), ...defaults } as Leg];
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
    const u: Partial<Leg> = { ...updates };
    const rec = u as Record<string, string | undefined>;
    for (const f of ['line', 'anytime', 'anytimeNo', 'ppO0', 'ppO1', 'ppO2', 'ppO3', 'ppO4', 'ppBeta', 'marginMin', 'marginMax']) {
      const v = rec[f]; if (typeof v === 'string') rec[f] = v.replace(/,/g, '.');
    }
    const next = legs.map(l => l.id === id ? { ...l, ...u } : l);
    setLegs(next);
    onChange('poi-legs', serializeLegs(next));
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Examples row — above everything */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exemplos:</span>
        {sport === 'football' && (
          <>
            <button type="button" onClick={() => onLoadExample('poi-builder')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Over + Casa vence</button>
            <button type="button" onClick={() => onLoadExample('poi-playerprop')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Prop jogador</button>
          </>
        )}
        {sport === 'tennis' && (
          <>
            <button type="button" onClick={() => onLoadExample('poi-tennis')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Djokovic @1.33 + Over 22.5</button>
            <button type="button" onClick={() => onLoadExample('poi-tennis-prop')} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">Vencedor + Over + 1º set</button>
          </>
        )}
        <button type="button" onClick={onReset} className="border border-border rounded px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors ml-auto flex items-center gap-1">Limpar</button>
      </div>

      {/* Sport selector */}
      <div className="panel">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Esporte</span>
        </div>
        <Select
          value={sport}
          onChange={v => {
            const s = v as SportId;
            onChange('poi-sport', s);
            onChange('poi-legs', '');
          }}
          options={SPORT_OPTIONS}
        />
      </div>

      {/* ─── Football inputs ─── */}
      {sport === 'football' && (
        <>
          <div className="panel panel-focus space-y-3">
            <div className="section-title">Odds simples do jogo</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[11px] text-text-muted mb-1.5 block">CASA (1)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-h'] || ''} onChange={e => onChange('poi-h', e.target.value)} className="input-dark" placeholder="1.80" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">EMPATE (X)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-d'] || ''} onChange={e => onChange('poi-d', e.target.value)} className="input-dark" placeholder="3.60" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">FORA (2)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-a'] || ''} onChange={e => onChange('poi-a', e.target.value)} className="input-dark" placeholder="4.50" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[11px] text-text-muted mb-1.5 block">LINHA O/U GOLS</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-ouline'] || ''} onChange={e => onChange('poi-ouline', e.target.value)} className="input-dark" placeholder="2.5" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD OVER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-over'] || ''} onChange={e => onChange('poi-over', e.target.value)} className="input-dark" placeholder="1.95" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD UNDER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-under'] || ''} onChange={e => onChange('poi-under', e.target.value)} className="input-dark" placeholder="1.95" /></div>
            </div>

            <div>
              <label className="text-[11px] text-text-muted mb-1.5 block">CORREÇÃO DIXON-COLES ρ<HelpTip text="Correção de dependência entre poucos gols (Dixon-Coles). Valores típicos entre -0.15 e 0; ~-0.05 é comum. 0 = Poisson pura." /></label>
              <input type="text" inputMode="text" autoComplete="off" value={values['poi-rho'] || ''} onChange={e => onChange('poi-rho', e.target.value)} className="input-dark" placeholder="-0.05" />
            </div>

            <div className="pt-3 border-t border-border">
              <button type="button" onClick={() => setCornerOpen(!cornerOpen)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${cornerOpen ? 'rotate-180' : ''}`} />
                Calibração de escanteios
                <span className="text-xs text-text-muted font-normal">— preencha só se houver perna de escanteio</span>
              </button>
              {cornerOpen && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">LINHA O/U CORNERS</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-line'] || ''} onChange={e => onChange('poi-c-line', e.target.value)} className="input-dark" placeholder="9.5" /></div>
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD OVER CORNERS</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-over'] || ''} onChange={e => onChange('poi-c-over', e.target.value)} className="input-dark" placeholder="1.90" /></div>
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD UNDER CORNERS</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-under'] || ''} onChange={e => onChange('poi-c-under', e.target.value)} className="input-dark" placeholder="1.90" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">CORNER 1X2 — CASA (1) <span className="text-text-muted/70">OPCIONAL</span></label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-1'] || ''} onChange={e => onChange('poi-c-1', e.target.value)} className="input-dark" placeholder="opt" /></div>
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">EMPATE CORNERS (X)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-x'] || ''} onChange={e => onChange('poi-c-x', e.target.value)} className="input-dark" placeholder="opt" /></div>
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">VISITANTE (2)</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-c-2'] || ''} onChange={e => onChange('poi-c-2', e.target.value)} className="input-dark" placeholder="opt" /></div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Sem o 1X2 de escanteios, o total é dividido entre os times pela proporção de domínio do jogo (split de gols). Com o 1X2, o split de escanteios é calibrado diretamente. Escanteios costumam ser levemente <b>sobredispersos</b> vs. Poisson — a cauda alta pode ser subestimada (ressalva análoga à de SOT/props).
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Tennis inputs ─── */}
      {sport === 'tennis' && (
        <>
          <div className="panel panel-focus space-y-3">
            <div className="section-title">Odds simples do jogo</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-text-muted mb-1.5 block">JOGADOR A — ML</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-mlA'] || ''} onChange={e => onChange('poi-mlA', e.target.value)} className="input-dark" placeholder="1.80" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">JOGADOR B — ML</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-mlB'] || ''} onChange={e => onChange('poi-mlB', e.target.value)} className="input-dark" placeholder="2.10" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[11px] text-text-muted mb-1.5 block">LINHA O/U JOGOS</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-gamesLine'] || ''} onChange={e => onChange('poi-gamesLine', e.target.value)} className="input-dark" placeholder="22.5" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD OVER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-gamesOver'] || ''} onChange={e => onChange('poi-gamesOver', e.target.value)} className="input-dark" placeholder="1.90" /></div>
              <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD UNDER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-gamesUnder'] || ''} onChange={e => onChange('poi-gamesUnder', e.target.value)} className="input-dark" placeholder="1.90" /></div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-muted">Formato</label>
              <Select
                value={values['poi-bestOf'] || '3'}
                onChange={v => onChange('poi-bestOf', v)}
                options={[
                  { value: '3', label: 'Melhor de 3 sets' },
                  { value: '5', label: 'Melhor de 5 sets' },
                ]}
              />
            </div>

            <div className="pt-3 border-t border-border">
              <button type="button" onClick={() => setTennisExtra(!tennisExtra)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${tennisExtra ? 'rotate-180' : ''}`} />
                Calibração extra (1º set)
                <span className="text-xs text-text-muted font-normal">— opcional, melhora o fit</span>
              </button>
              {tennisExtra && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">A VENCE 1º SET</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-firstSetA'] || ''} onChange={e => onChange('poi-firstSetA', e.target.value)} className="input-dark" placeholder="opt" /></div>
                    <div><label className="text-[11px] text-text-muted mb-1.5 block">B VENCE 1º SET</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-firstSetB'] || ''} onChange={e => onChange('poi-firstSetB', e.target.value)} className="input-dark" placeholder="opt" /></div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Quando preenchidas, as odds do 1º set fornecem um ponto extra de calibração para o modelo Markov, melhorando a estimativa de `pA_serve` e `pB_serve`.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Basketball inputs ─── */}
      {sport === 'basketball' && (
        <div className="panel panel-focus space-y-3">
          <div className="section-title">Odds simples do jogo</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[11px] text-text-muted mb-1.5 block">LINHA TOTAL</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-totalLine'] || ''} onChange={e => onChange('poi-totalLine', e.target.value)} className="input-dark" placeholder="224.5" /></div>
            <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD OVER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-totalOver'] || ''} onChange={e => onChange('poi-totalOver', e.target.value)} className="input-dark" placeholder="1.91" /></div>
            <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD UNDER</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-totalUnder'] || ''} onChange={e => onChange('poi-totalUnder', e.target.value)} className="input-dark" placeholder="1.91" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[11px] text-text-muted mb-1.5 block">SPREAD A</label><input type="text" inputMode="text" autoComplete="off" value={values['poi-spread'] || ''} onChange={e => onChange('poi-spread', e.target.value)} className="input-dark" placeholder="-5.5" /></div>
            <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD SPREAD A</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-spreadA'] || ''} onChange={e => onChange('poi-spreadA', e.target.value)} className="input-dark" placeholder="1.91" /></div>
            <div><label className="text-[11px] text-text-muted mb-1.5 block">ODD SPREAD B</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-spreadB'] || ''} onChange={e => onChange('poi-spreadB', e.target.value)} className="input-dark" placeholder="1.91" /></div>
          </div>
          <div className="pt-3 border-t border-border">
            <button type="button" onClick={() => setBasketExtra(!basketExtra)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${basketExtra ? 'rotate-180' : ''}`} />
              Calibração avançada
              <span className="text-xs text-text-muted font-normal">— totals por time, dispersão e correlação</span>
            </button>
            {basketExtra && (
              <div className="mt-3 space-y-3 animate-fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">TOTAL TIME A</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalA'] || ''} onChange={e => onChange('poi-teamTotalA', e.target.value)} className="input-dark" placeholder="112.5" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">OVER A</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalAOver'] || ''} onChange={e => onChange('poi-teamTotalAOver', e.target.value)} className="input-dark" placeholder="opt" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">UNDER A</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalAUnder'] || ''} onChange={e => onChange('poi-teamTotalAUnder', e.target.value)} className="input-dark" placeholder="opt" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">TOTAL TIME B</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalB'] || ''} onChange={e => onChange('poi-teamTotalB', e.target.value)} className="input-dark" placeholder="111.5" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">OVER B</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalBOver'] || ''} onChange={e => onChange('poi-teamTotalBOver', e.target.value)} className="input-dark" placeholder="opt" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">UNDER B</label><input type="text" inputMode="decimal" autoComplete="off" value={values['poi-teamTotalBUnder'] || ''} onChange={e => onChange('poi-teamTotalBUnder', e.target.value)} className="input-dark" placeholder="opt" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">σ A</label><input type="text" inputMode="text" autoComplete="off" value={values['poi-sigmaA'] || ''} onChange={e => onChange('poi-sigmaA', e.target.value)} className="input-dark" placeholder="12" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">σ B</label><input type="text" inputMode="text" autoComplete="off" value={values['poi-sigmaB'] || ''} onChange={e => onChange('poi-sigmaB', e.target.value)} className="input-dark" placeholder="12" /></div>
                  <div><label className="text-[11px] text-text-muted mb-1.5 block">ρ</label><input type="text" inputMode="text" autoComplete="off" value={values['poi-rhoBB'] || ''} onChange={e => onChange('poi-rhoBB', e.target.value)} className="input-dark" placeholder="0.25" /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Legs (shared, but options depend on sport) ─── */}
      <div className="panel panel-focus space-y-3">
        <div className="section-title">SELEÇÃO</div>
        <div className="space-y-3">
          {legs.map(leg => {
            const isP = leg.kind === 'player';
            const isOU = ['over', 'under', 'homeOver', 'homeUnder', 'awayOver', 'awayUnder'].includes(leg.kind);
            const isPP = leg.kind === 'playerprop';
            const isCT = leg.kind === 'cornerTotal';
            const isCTeam = leg.kind === 'cornerTeam';
            const isCSide = leg.kind === 'cornerSide';
            const isCorner = isCT || isCTeam || isCSide;

            // Tennis leg flags
            const isTennisOU = ['totalGamesOver', 'totalGamesUnder', 'totalSetsOver', 'totalSetsUnder', 'firstSetGamesOver', 'firstSetGamesUnder'].includes(leg.kind);
            const isTennisSide = ['matchWinner', 'firstSetWinner'].includes(leg.kind);
            const isTennisSetScore = leg.kind === 'setScore';
            const isBasketballLine = ['spreadCover', 'totalOver', 'totalUnder', 'teamTotalOver', 'teamTotalUnder'].includes(leg.kind);
            const isBasketballSide = ['moneyline', 'spreadCover', 'teamTotalOver', 'teamTotalUnder', 'marginRange'].includes(leg.kind);
            const isBasketballRange = leg.kind === 'marginRange';

            return (
              <div key={leg.id} className="panel p-3 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={leg.kind}
                    onChange={v => {
                      const k = v as LegKind;
                      const defaults: Partial<Leg> = { kind: k };
                      if (sport === 'football') {
                        if (k === 'over' || k === 'under') defaults.line = '2.5';
                        if (['homeOver', 'homeUnder', 'awayOver', 'awayUnder'].includes(k)) defaults.line = '1.5';
                        if (k === 'cornerTotal') defaults.line = '9.5';
                        if (k === 'cornerTeam') defaults.line = '5.5';
                      }
                      if (sport === 'tennis') {
                        if (k === 'totalGamesOver' || k === 'totalGamesUnder') defaults.line = '22.5';
                        if (k === 'totalSetsOver' || k === 'totalSetsUnder') defaults.line = '2.5';
                        if (k === 'firstSetGamesOver' || k === 'firstSetGamesUnder') defaults.line = '8.5';
                        // Gravar o default exibido pelo select (ver addLeg).
                        if (k === 'matchWinner' || k === 'firstSetWinner') defaults.side = 'A';
                        if (k === 'setScore') {
                          defaults.setScoreA = '2';
                          defaults.setScoreB = '0';
                        }
                      }
                      if (sport === 'basketball') {
                        if (k === 'totalOver' || k === 'totalUnder') defaults.line = '224.5';
                        if (k === 'spreadCover') defaults.line = '-5.5';
                        if (k === 'teamTotalOver' || k === 'teamTotalUnder') defaults.line = '112.5';
                        if (k === 'moneyline' || k === 'spreadCover' || k === 'teamTotalOver' || k === 'teamTotalUnder' || k === 'marginRange') defaults.side = 'A';
                        if (k === 'marginRange') {
                          defaults.marginMin = '1';
                          defaults.marginMax = '10';
                        }
                      }
                      updateLeg(leg.id, defaults);
                    }}
                    options={legOptions}
                  />

                  {(isOU || isCT || isCTeam) && (
                    <input type="text" inputMode="decimal" autoComplete="off" value={leg.line || ''} onChange={e => updateLeg(leg.id, { line: e.target.value })} placeholder="linha" className="input-dark w-20" />
                  )}

                  {(isTennisOU) && (
                    <input type="text" inputMode="decimal" autoComplete="off" value={leg.line || ''} onChange={e => updateLeg(leg.id, { line: e.target.value })} placeholder="linha" className="input-dark w-20" />
                  )}

                  {isBasketballLine && (
                    <input type="text" inputMode={leg.kind === 'spreadCover' ? 'text' : 'decimal'} autoComplete="off" value={leg.line || ''} onChange={e => updateLeg(leg.id, { line: e.target.value })} placeholder="linha" className="input-dark w-20" />
                  )}

                  {(isP || isCTeam) && (
                    <Select
                      value={leg.side || 'home'}
                      onChange={v => updateLeg(leg.id, { side: v })}
                      options={[
                        { value: 'home', label: 'Mandante' },
                        { value: 'away', label: 'Visitante' },
                      ]}
                    />
                  )}

                  {isTennisSide && (
                    <Select
                      value={leg.side || 'A'}
                      onChange={v => updateLeg(leg.id, { side: v })}
                      options={[
                        { value: 'A', label: 'Jogador A' },
                        { value: 'B', label: 'Jogador B' },
                      ]}
                    />
                  )}

                  {isBasketballSide && (
                    <Select
                      value={leg.side || 'A'}
                      onChange={v => updateLeg(leg.id, { side: v })}
                      options={[
                        { value: 'A', label: 'Time A' },
                        { value: 'B', label: 'Time B' },
                      ]}
                    />
                  )}

                  {isBasketballRange && (
                    <>
                      <input type="text" inputMode="numeric" autoComplete="off" value={leg.marginMin || ''} onChange={e => updateLeg(leg.id, { marginMin: e.target.value })} placeholder="mín." className="input-dark w-16" />
                      <span className="text-xs text-text-muted">a</span>
                      <input type="text" inputMode="numeric" autoComplete="off" value={leg.marginMax || ''} onChange={e => updateLeg(leg.id, { marginMax: e.target.value })} placeholder="máx." className="input-dark w-16" />
                    </>
                  )}

                  {isTennisSetScore && (
                    <>
                      <input type="text" inputMode="numeric" autoComplete="off" value={leg.setScoreA || ''} onChange={e => updateLeg(leg.id, { setScoreA: e.target.value })} placeholder="sets A" className="input-dark w-16" />
                      <span className="text-xs text-text-muted">×</span>
                      <input type="text" inputMode="numeric" autoComplete="off" value={leg.setScoreB || ''} onChange={e => updateLeg(leg.id, { setScoreB: e.target.value })} placeholder="sets B" className="input-dark w-16" />
                    </>
                  )}

                  {isCT && (
                    <Select
                      value={leg.cSide || 'over'}
                      onChange={v => updateLeg(leg.id, { cSide: v })}
                      options={[
                        { value: 'over', label: 'Over' },
                        { value: 'under', label: 'Under' },
                      ]}
                    />
                  )}

                  {isCTeam && (
                    <Select
                      value={leg.cDir || 'over'}
                      onChange={v => updateLeg(leg.id, { cDir: v })}
                      options={[
                        { value: 'over', label: 'Over' },
                        { value: 'under', label: 'Under' },
                      ]}
                    />
                  )}

                  {isCSide && (
                    <Select
                      value={leg.c1x2 || 'home'}
                      onChange={v => updateLeg(leg.id, { c1x2: v })}
                      options={[
                        { value: 'home', label: 'Casa' },
                        { value: 'draw', label: 'Empate' },
                        { value: 'away', label: 'Visitante' },
                      ]}
                    />
                  )}

                  {isP && (
                    <>
                      <input type="text" inputMode="decimal" autoComplete="off" value={leg.anytime || ''} onChange={e => updateLeg(leg.id, { anytime: e.target.value })} placeholder="odd Sim" className="input-dark w-24" />
                      <input type="text" inputMode="decimal" autoComplete="off" value={leg.anytimeNo || ''} onChange={e => updateLeg(leg.id, { anytimeNo: e.target.value })} placeholder="odd Não" className="input-dark w-24" />
                    </>
                  )}

                  <button type="button" aria-label="Remover perna" onClick={() => removeLeg(leg.id)} className="icon-btn ml-auto text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition-colors">
                  <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>

                {isPP && (
                  <div className="mt-2 pl-3 border-l-2 border-border space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 0.5 *</label><input type="text" inputMode="decimal" autoComplete="off" value={leg.ppO0 || ''} onChange={e => updateLeg(leg.id, { ppO0: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 1.5</label><input type="text" inputMode="decimal" autoComplete="off" value={leg.ppO1 || ''} onChange={e => updateLeg(leg.id, { ppO1: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 2.5</label><input type="text" inputMode="decimal" autoComplete="off" value={leg.ppO2 || ''} onChange={e => updateLeg(leg.id, { ppO2: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 3.5</label><input type="text" inputMode="decimal" autoComplete="off" value={leg.ppO3 || ''} onChange={e => updateLeg(leg.id, { ppO3: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                      <div><label className="text-[10px] text-text-muted mb-1 block">Over 4.5</label><input type="text" inputMode="decimal" autoComplete="off" value={leg.ppO4 || ''} onChange={e => updateLeg(leg.id, { ppO4: e.target.value })} placeholder="opt" className="input-dark input-compact w-full text-xs" /></div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={leg.ppSide || 'home'}
                        onChange={v => updateLeg(leg.id, { ppSide: v })}
                        options={[
                        { value: 'home', label: 'Mandante' },
                        { value: 'away', label: 'Visitante' },
                        ]}
                      />
                      <label className="flex items-center gap-1.5 text-xs text-text-muted">
                        Linha
                        <Select
                          value={leg.ppLine || '0,5'}
                          onChange={v => updateLeg(leg.id, { ppLine: v })}
                          options={[
                            { value: '0,5', label: 'Over 0,5' },
                            { value: '1,5', label: 'Over 1,5' },
                            { value: '2,5', label: 'Over 2,5' },
                            { value: '3,5', label: 'Over 3,5' },
                            { value: '4,5', label: 'Over 4,5' },
                          ]}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="inline-flex items-center">β acoplamento<HelpTip text="Intensidade do acoplamento entre a prop do jogador e o resultado do jogo. 0 = independente; ~0.54 é o default calibrado." /></span> <input type="text" inputMode="decimal" autoComplete="off" value={leg.ppBeta || '0.54'} onChange={e => updateLeg(leg.id, { ppBeta: e.target.value })} className="input-dark input-compact w-16 text-xs" />
                      </label>
                    </div>
                    <p className="text-[10px] text-text-muted leading-snug">A escada de odds calibra a intensidade (μ). A <b>linha</b> define qual evento entra na probabilidade conjunta: Over k,5 ⇒ P(SOT ≥ k+1). Cauda alta (3,5/4,5) tende a ser subestimada pela Poisson.</p>
                  </div>
                )}

                {isCorner && (
                  <div className="mt-2 pl-3 border-l-2 border-border">
                    <label className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="inline-flex items-center">β corner↔resultado<HelpTip text="Intensidade do acoplamento entre escanteios e resultado do jogo. 0 = independente; ~0.15 é o default." /></span> <input type="text" inputMode="decimal" autoComplete="off" value={leg.cBeta || '0.15'} onChange={e => updateLeg(leg.id, { cBeta: e.target.value })} className="input-dark input-compact w-16 text-xs" />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => addLeg(sport === 'tennis' ? 'matchWinner' : sport === 'basketball' ? 'moneyline' : 'over')} className="btn-ghost text-xs flex items-center gap-1.5">
          <Plus size={14} aria-hidden="true" /> Adicionar seleção
        </button>

        <div className="divider" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-text-muted mb-1.5 block">Sua odd do bet builder</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={values['poi-your'] || ''} onChange={e => onChange('poi-your', e.target.value)} className="input-dark input-highlight" placeholder="3.15" />
          </div>
        </div>
      </div>

      <button type="button" onClick={onCalculate} disabled={isLoading} className="btn-primary w-full py-3 text-base">
        {isLoading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Calculando...</> : 'Calcular'}
      </button>

      <div className="px-4 py-3 rounded-lg border border-border/50 bg-surface text-[11px] text-text-muted leading-relaxed">
        {sport === 'tennis' ? (
          <>Use para bet builders de <b>tênis</b>. O modelo Markov por ponto (ponto→game→set→partida) calibra a distribuição conjunta a partir das odds simples via Monte Carlo.</>
        ) : sport === 'basketball' ? (
          <>Use para bet builders de <b>basquete</b>. O modelo Normal Bivariada calibra as médias dos times a partir do total e spread, preservando a correlação de ritmo entre as pontuações.</>
        ) : (
          <>Use para bet builders do <b>mesmo jogo</b>, quando a correlação entre pernas importa. O modelo Poisson/Dixon-Coles calibra a distribuição de placar a partir das odds simples.</>
        )}
      </div>
    </div>
  );
});
