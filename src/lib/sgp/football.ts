// ─── Football SGP model (Poisson / Dixon-Coles) ───
// Extracted from the existing calcPoi logic — pure model functions.
// The score grid P[i][j] is the joint distribution over (goals_home, goals_away).

import {
  devigN, fitLambdas, scoreMatrix, solveTheta,
  poisTotalProb, cornerLambdaEff, cornerSideProb,
} from '../math';
import type { DevigMethod } from '../../types';
import type { SportModel, SportInputs, ModelParams, Outcome, Leg, LegKindDef } from './types';

// ─── Leg kinds (same as existing BetBuilderTab) ───
export const FOOTBALL_LEGS: LegKindDef[] = [
  { kind: 'over', label: 'Over', needsLine: true, sport: 'football' },
  { kind: 'under', label: 'Under', needsLine: true, sport: 'football' },
  { kind: 'homewin', label: 'Casa vence', sport: 'football' },
  { kind: 'draw', label: 'Empate', sport: 'football' },
  { kind: 'awaywin', label: 'Fora vence', sport: 'football' },
  { kind: 'homeNoLose', label: 'Casa não perde (1X)', sport: 'football' },
  { kind: 'awayNoLose', label: 'Fora não perde (X2)', sport: 'football' },
  { kind: 'btts', label: 'Ambas marcam', sport: 'football' },
  { kind: 'bttsNo', label: 'Ambas marcam: Não', sport: 'football' },
  { kind: 'homeScores', label: 'Casa marca', sport: 'football' },
  { kind: 'awayScores', label: 'Fora marca', sport: 'football' },
  { kind: 'homeOver', label: 'Casa Over X gols', needsLine: true, sport: 'football' },
  { kind: 'homeUnder', label: 'Casa Under X gols', needsLine: true, sport: 'football' },
  { kind: 'awayOver', label: 'Fora Over X gols', needsLine: true, sport: 'football' },
  { kind: 'awayUnder', label: 'Fora Under X gols', needsLine: true, sport: 'football' },
  { kind: 'player', label: 'Jogador marca', needsSide: true, sport: 'football' },
  { kind: 'playerprop', label: 'Prop jogador', needsSide: true, sport: 'football' },
  { kind: 'cornerTotal', label: 'Escanteios totais (O/U)', needsLine: true, sport: 'football' },
  { kind: 'cornerTeam', label: 'Escanteios por time (O/U)', needsLine: true, needsSide: true, sport: 'football' },
  { kind: 'cornerSide', label: 'Escanteios 1X2', sport: 'football' },
];

// ─── Calibration: de-vig 1X2 + O/U, fit Poisson lambdas ───
export function calibrateFootball(
  inputs: SportInputs, method: DevigMethod
): ModelParams | { err: string } {
  const { h, d, a, ouLine, over, under, rho } = inputs;
  if (!(h! > 1 && d! > 1 && a! > 1)) return { err: 'Preencha as três odds 1X2 (>1).' };
  if (!(over! > 1 && under! > 1 && ouLine! > 0)) return { err: 'Preencha linha e odds Over/Under (>1).' };
  const r = Number.isFinite(rho!) ? rho! : -0.05;

  const dv1 = devigN([h!, d!, a!], method);
  const pH_t = dv1.probs[0], pD_t = dv1.probs[1], pA_t = dv1.probs[2];
  const over_t = devigN([over!, under!], method).p;

  const fit = fitLambdas(pH_t, pD_t, pA_t, ouLine!, over_t, r);
  const P = scoreMatrix(fit.lh, fit.la, r, 12);

  return {
    sport: 'football',
    lh: fit.lh,
    la: fit.la,
    rho: r,
    P,
    fitError: fit.e,
  };
}

// ─── Evaluate a football leg at score (i, j) ───
// This mirrors the legAt function from calcPoi:512-557.
// The Leg may carry extra fields (theta, muProp, beta, lambdaTeam, lcH, lcA, lgH, lgA)
// which are set during leg parsing in calcPoi.
export function legAtFootball(leg: Leg, i: number, j: number): number {
  switch (leg.kind) {
    case 'over': return (i + j > (leg.line || 0)) ? 1 : 0;
    case 'under': return (i + j < (leg.line || 0)) ? 1 : 0;
    case 'homewin': return (i > j) ? 1 : 0;
    case 'draw': return (i === j) ? 1 : 0;
    case 'awaywin': return (i < j) ? 1 : 0;
    case 'homeNoLose': return (i >= j) ? 1 : 0;
    case 'awayNoLose': return (i <= j) ? 1 : 0;
    case 'btts': return (i > 0 && j > 0) ? 1 : 0;
    case 'bttsNo': return (i === 0 || j === 0) ? 1 : 0;
    case 'homeScores': return (i > 0) ? 1 : 0;
    case 'awayScores': return (j > 0) ? 1 : 0;
    case 'homeOver': return (i > (leg.line || 0)) ? 1 : 0;
    case 'homeUnder': return (i < (leg.line || 0)) ? 1 : 0;
    case 'awayOver': return (j > (leg.line || 0)) ? 1 : 0;
    case 'awayUnder': return (j < (leg.line || 0)) ? 1 : 0;
    case 'player': {
      const side = (leg.side as 'home' | 'away') || 'home';
      const n = side === 'home' ? i : j;
      const theta = (leg.theta as number) || 0;
      return 1 - Math.pow(1 - theta, n);
    }
    case 'playerprop': {
      const side = (leg.side as 'home' | 'away') || 'home';
      const tg = side === 'home' ? i : j;
      const muProp = (leg.muProp as number) || 0;
      const beta = (leg.beta as number) || 0;
      const lambdaTeam = (leg.lambdaTeam as number) || 1;
      const mEff = muProp * (1 + beta * (tg - lambdaTeam) / lambdaTeam);
      return poisTotalProb(Math.max(0.05, mEff), 'over', leg.line ?? 0.5);
    }
    case 'cornerTotal': {
      const lcH = (leg.lcH as number) || 0;
      const lcA = (leg.lcA as number) || 0;
      const lgH = (leg.lgH as number) || 0;
      const lgA = (leg.lgA as number) || 0;
      const beta = (leg.beta as number) || 0;
      const dir = (leg.dir as 'over' | 'under') || 'over';
      const lhE = cornerLambdaEff(lcH, i, lgH, beta);
      const laE = cornerLambdaEff(lcA, j, lgA, beta);
      return poisTotalProb(lhE + laE, dir, leg.line || 0);
    }
    case 'cornerTeam': {
      const side = (leg.side as 'home' | 'away') || 'home';
      const tgC = side === 'home' ? i : j;
      const baseC = side === 'home' ? ((leg.lcH as number) || 0) : ((leg.lcA as number) || 0);
      const lamGC = side === 'home' ? ((leg.lgH as number) || 0) : ((leg.lgA as number) || 0);
      const beta = (leg.beta as number) || 0;
      const dir = (leg.dir as 'over' | 'under') || 'over';
      const lcE = cornerLambdaEff(baseC, tgC, lamGC, beta);
      return poisTotalProb(lcE, dir, leg.line || 0);
    }
    case 'cornerSide': {
      const lcH = (leg.lcH as number) || 0;
      const lcA = (leg.lcA as number) || 0;
      const lgH = (leg.lgH as number) || 0;
      const lgA = (leg.lgA as number) || 0;
      const beta = (leg.beta as number) || 0;
      const dir = (leg.dir as 'home' | 'draw' | 'away') || 'home';
      const lhS = cornerLambdaEff(lcH, i, lgH, beta);
      const laS = cornerLambdaEff(lcA, j, lgA, beta);
      return cornerSideProb(lhS, laS, dir);
    }
    default: return 1;
  }
}

// ─── Joint probability: sum over score grid ───
export function jointProbFootball(P: number[][], legs: Leg[]): number {
  let t = 0;
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++) {
      let f = P[i][j];
      for (const lg of legs) f *= legAtFootball(lg, i, j);
      t += f;
    }
  return t;
}

// ─── Naive product of marginal leg probabilities ───
export function naiveProbFootball(P: number[][], legs: Leg[]): number {
  return legs.reduce((acc, lg) => {
    let s = 0;
    for (let i = 0; i < P.length; i++)
      for (let j = 0; j < P.length; j++)
        s += P[i][j] * legAtFootball(lg, i, j);
    return acc * s;
  }, 1);
}

// ─── Score grid as Outcome[] (for interface compatibility) ───
export function sampleFootball(params: ModelParams, _n: number): Outcome[] {
  const P = params.P!;
  const out: Outcome[] = [];
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++) {
      if (P[i][j] > 0) out.push({ scoreA: i, scoreB: j });
    }
  return out;
}

// ─── Football model (SportModel interface implementation) ───
export const footballModel: SportModel = {
  sport: 'football',
  legKinds: FOOTBALL_LEGS,

  calibrate: calibrateFootball,

  sample: sampleFootball,

  legAt: (outcome: Outcome, leg: Leg): number => {
    return legAtFootball(leg, outcome.scoreA || 0, outcome.scoreB || 0);
  },

  jointProb: (outcomes: Outcome[], legs: Leg[]): number => {
    // For football, outcomes are grid cells weighted by P[i][j]
    // But we need the grid P itself — footballModel.jointProb is a pass-through
    // that delegates to the grid-based computation.
    // This is called when the grid isn't available as ModelParams.
    // In practice, calcPoi uses jointProbFootball directly with P from params.
    return 0; // Not used — calcPoi calls jointProbFootball directly
  },

  naiveProb: (_params: ModelParams, _legs: Leg[]): number => {
    return 0; // Not used — calcPoi uses naiveProbFootball directly
  },
};
