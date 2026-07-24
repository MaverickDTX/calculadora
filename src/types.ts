export interface Config {
  bank: number;
  unit: number;
  floor: number;
  cap: number;
  edgemin: number;
  frac: number;
  method: DevigMethod;
  boostType: BoostType;
  boostVal: number;
  confAdj: 'on' | 'off';
}

export type DevigMethod = 'equal' | 'prop' | 'probit' | 'log' | 'shin' | 'auto';
export type BoostType = 'none' | 'profit' | 'mult';

export type ConfClass = 'high' | 'mid' | 'low';

/**
 * Resultado do cálculo — CONTRATO CONGELADO.
 *
 * Esta interface é a API pública entre o motor de cálculo (calc.ts)
 * e a camada de UI (ResultsPanel, tabs). NENHUM campo pode ser
 * renomeado, removido ou ter seu tipo alterado sem justificativa
 * documentada no changelog e validação cruzada dos snapshots de
 * engine (verify-engine.ts) e dos scripts verify-basketball.ts e
 * verify-tennis-dp.ts.
 *
 * Para adicionar um campo: (1) adicione aqui como opcional,
 * (2) popule em makeBetBase em calc.ts, (3) renderize no
 * ResultsPanel. Não remova campos existentes.
 *
 * @readonly
 * @freeze
 */
export interface BetResult {
  label: string;
  decomp: string;
  p: number | null;
  fair: number | null;
  your: number;
  yourEff: number;
  boosted: boolean;
  M: number | null;
  fb: boolean;
  confClass: ConfClass;
  confTxt: string;
  sens: Sensitivity | null;
  sensInfo: SensitivityInfo;
  divInfo: DivergenceInfo;
  saveable: boolean;
  returns: ReturnState[];
  ev: number;
  kfull: number;
  kadj: number;
  b: number;
  cfg: Config;
  marginLabel: string | null;
  warnings: string[];
  evBand: [number, number] | null;
  evPoints: EvPoint[] | null;
  referenceOdds?: number[] | null;
  fairProbabilities?: number[] | null;
  selectedOutcomeIndex?: number | null;
  outcomeLabels?: string[];
}

export interface ReturnState {
  p: number;
  net: number;
  label?: string;
}

export interface Sensitivity {
  type: 'nres' | 'propPair' | 'proxy' | 'combo' | 'aub';
  refEval: number;
  refs?: number[];
  no?: number;
  method?: DevigMethod;
  margin?: number;
  discount?: number;
}

export interface SensitivityInfo {
  factor: number;
  html: string;
  status: 'ok' | 'mid' | 'bad' | 'none';
}

export interface DivergenceInfo {
  factor: number;
  cls: { key: UncertaintyClass; label: string; color: string; soft: string; desc: string } | null;
}

export interface EvPoint {
  label: string;
  ev: number;
}

export type UncertaintyClass = 'high' | 'mid' | 'low';

export interface StakeFlow {
  cf: number;
  sf: number;
  df: number;
  raw: number;
  afterFloor: number;
  beforeCap: number;
  afterCap: number;
  floorApplied: boolean;
  capApplied: boolean;
}

export interface GridStake {
  units: number;
  rawUnits: number;
  reais: number;
  pct: number;
}


export type TabId = 'nres' | 'props' | 'proxy' | 'aub' | 'combo' | 'poi' | 'asia';

export interface MarginPreset {
  pct: number;
  label: string;
  empirical: boolean;
}
