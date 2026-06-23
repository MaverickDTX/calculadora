import type { MarginPreset } from '../types';

export const MARGIN_PRESETS: Record<string, MarginPreset> = {
  '1x2_ft': { pct: 6.0, label: '1X2 FT', empirical: true },
  'ou_gols_ft': { pct: 5.0, label: 'O/U gols FT', empirical: true },
  'asian_handicap_ft': { pct: 5.0, label: 'Asian handicap FT', empirical: true },
  'btts_ft': { pct: 5.0, label: 'BTTS FT', empirical: true },
  'dnb_ft': { pct: 5.0, label: 'DNB FT', empirical: true },
  'handicap_europeu_ft': { pct: 6.0, label: 'Handicap europeu FT', empirical: true },
  'corners_ou_ft': { pct: 6.0, label: 'Corners O/U FT', empirical: true },
  'bookings_ou_ft': { pct: 6.5, label: 'Cartões O/U FT', empirical: true },
  'prop_gols': { pct: 5.0, label: 'Prop gols jogador / anytime scorer Pinnacle', empirical: true },
  'prop_chutes': { pct: 8.0, label: 'Prop chutes jogador', empirical: true },
  'prop_chutes_gol': { pct: 8.0, label: 'Prop chutes no gol', empirical: true },
  'prop_cartao': { pct: 8.0, label: 'Prop cartão jogador', empirical: true },
  'prop_tackles': { pct: 8.0, label: 'Prop desarmes jogador', empirical: true },
  'prop_faltas': { pct: 7.0, label: 'Prop faltas jogador', empirical: false },
  'prop_saves': { pct: 7.0, label: 'Prop defesas goleiro', empirical: false },
};

export const NRES_PLACEHOLDERS: Record<string, string[]> = {
  '1X2 / Moneyline': ['Casa', 'Empate', 'Fora'],
  'Over/Under': ['Over', 'Under'],
  'Dupla chance': ['1X', '12', 'X2'],
  'Ambas marcam (BTTS)': ['Sim', 'Não'],
  'custom': ['odd resultado'],
};

export const PROP_LABELS: Record<string, [string, string]> = {
  simnao: ['Ref. Sim', 'Ref. Não'],
  ou: ['Ref. Over', 'Ref. Under'],
  custom: ['Ref. Sim / Over', 'Ref. Não / Under'],
};

export const METHOD_LABELS: Record<string, string> = {
  prop: 'Proporcional',
  probit: 'Probit',
  log: 'Log-function',
  shin: 'Shin',
  equal: 'Margem igual',
};
