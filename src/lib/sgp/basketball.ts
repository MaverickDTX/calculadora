// ─── Basketball SGP model (Bivariate Normal) ───
//
// Each team's final score is modeled as a Normal: pointsA ~ N(muA, sigmaA²),
// pointsB ~ N(muB, sigmaB²), correlated by rho (rhoBB). The joint (pointsA,
// pointsB) is a Bivariate Normal.
//
// Derived aggregate distributions (both Normal):
//   Total    T = pointsA + pointsB ~ N(muA + muB, sigmaT²),
//            sigmaT² = sigmaA² + sigmaB² + 2·rho·sigmaA·sigmaB
//   Margin   D = pointsA − pointsB ~ N(muA − muB, sigmaD²),
//            sigmaD² = sigmaA² + sigmaB² − 2·rho·sigmaA·sigmaB
//
// Calibration (analytic, exact — no MC, no grid): given de-vigged targets for
//   P(spread A covers)  →  fixes (muA − muB) via Φ⁻¹
//   P(total over line)  →  fixes (muA + muB) via Φ⁻¹
// solve the 2×2 linear system for (muA, muB). sigmaA, sigmaB, rho are inputs
// (defaults 12, 12, 0.25). Team totals, if provided, override the split by
// pinning muA and muB directly from each team's total line.
//
// SGP (final sample): draw N correlated (pointsA, pointsB), round to integers,
// break ties by "possession" (the side with the larger fractional part scores
// the decisive point — basketball has no draws). Evaluate legs per simulation.

import { normPpf, normCdf } from '../math';
import { devigN } from '../math';
import type { DevigMethod } from '../../types';
import type { SportModel, SportInputs, ModelParams, Outcome, Leg, LegKindDef } from './types';
import { makeRng, bivariateNormal, jointProbMC, naiveProbMC, DEFAULT_SEED } from './monte-carlo';

// ─── Basketball leg kinds ───
export const BASKETBALL_LEGS: LegKindDef[] = [
  { kind: 'moneyline', label: 'Vencedor (moneyline)', needsSide: true, sport: 'basketball' },
  { kind: 'spreadCover', label: 'Cobre o spread', needsSide: true, sport: 'basketball' },
  { kind: 'totalOver', label: 'Over pontos totais', needsLine: true, sport: 'basketball' },
  { kind: 'totalUnder', label: 'Under pontos totais', needsLine: true, sport: 'basketball' },
  { kind: 'teamTotalOver', label: 'Over pontos do time', needsSide: true, needsLine: true, sport: 'basketball' },
  { kind: 'teamTotalUnder', label: 'Under pontos do time', needsSide: true, needsLine: true, sport: 'basketball' },
  { kind: 'marginRange', label: 'Margem de vitória (faixa)', needsSide: true, needsRange: true, sport: 'basketball' },
];

// ─── Defaults ───
const DEFAULT_SIGMA = 12;   // per-team scoring SD (points); NBA-scale heuristic
const DEFAULT_RHO = 0.25;   // positive: pace correlates the two team scores

// ─── Calibration: fit (muA, muB) analytically from spread + total ───
//
// The margin D = pointsA − pointsB is Normal with mean (muA − muB) and SD sigmaD.
// A "spread A" line of `spread` means A is handicapped by `spread` points
// (spread < 0 when A is favorite, e.g. A −5.5). A covers when D + spread > 0,
// i.e. D > −spread. So
//   P(A covers) = P(D > −spread) = 1 − Φ((−spread − (muA−muB)) / sigmaD)
// Solving for the mean:
//   muA − muB = −spread + sigmaD · Φ⁻¹(P(A covers))
//
// The total T = pointsA + pointsB is Normal with mean (muA + muB) and SD sigmaT.
//   P(over line) = P(T > line) = 1 − Φ((line − (muA+muB)) / sigmaT)
// Solving:
//   muA + muB = line + sigmaT · Φ⁻¹(P(over))
export function calibrateBasketball(
  inputs: SportInputs, method: DevigMethod
): ModelParams | { err: string } {
  const {
    totalLine, totalOver, totalUnder,
    spread, spreadA, spreadB,
    teamTotalA, teamTotalAOver, teamTotalAUnder,
    teamTotalB, teamTotalBOver, teamTotalBUnder,
  } = inputs;

  const sigmaA = (inputs.sigmaA! > 0) ? inputs.sigmaA! : DEFAULT_SIGMA;
  const sigmaB = (inputs.sigmaB! > 0) ? inputs.sigmaB! : DEFAULT_SIGMA;
  let rho = inputs.rhoBB;
  if (!Number.isFinite(rho!)) rho = DEFAULT_RHO;
  // Clamp rho to a valid correlation that keeps sigmaD² > 0.
  rho = Math.max(-0.95, Math.min(0.95, rho!));

  const sigmaT = Math.sqrt(sigmaA * sigmaA + sigmaB * sigmaB + 2 * rho * sigmaA * sigmaB);
  const sigmaD = Math.sqrt(sigmaA * sigmaA + sigmaB * sigmaB - 2 * rho * sigmaA * sigmaB);

  if (!(totalOver! > 1 && totalUnder! > 1 && totalLine! > 0)) {
    return { err: 'Preencha linha e odds Over/Under de pontos totais (>1).' };
  }
  if (!(spreadA! > 1 && spreadB! > 1) || !Number.isFinite(spread!)) {
    return { err: 'Preencha o spread e as odds Spread A/B (>1).' };
  }

  // De-vig the total O/U → P(over)
  const pOver = devigN([totalOver!, totalUnder!], method).p;
  // De-vig the spread two-way → P(A covers)
  const pCoverA = devigN([spreadA!, spreadB!], method).probs[0];

  // Analytic inversion.
  const sum = totalLine! + sigmaT * normPpf(pOver);        // muA + muB
  const diff = -spread! + sigmaD * normPpf(pCoverA);       // muA − muB
  let muA = (sum + diff) / 2;
  let muB = (sum - diff) / 2;

  // Optional: team totals override the split. If a team total (line + O/U odds)
  // is provided, pin that team's mean exactly from its own line and re-derive
  // the other team's mean from the total sum (least-squares-degenerate here:
  // one constraint per team, exact). This keeps muA + muB ≈ sum.
  let usedTeamTotals = false;
  if (teamTotalA! > 0 && teamTotalAOver! > 1 && teamTotalAUnder! > 1) {
    const pA = devigN([teamTotalAOver!, teamTotalAUnder!], method).p;
    muA = teamTotalA! + sigmaA * normPpf(pA);
    muB = sum - muA;
    usedTeamTotals = true;
  }
  if (teamTotalB! > 0 && teamTotalBOver! > 1 && teamTotalBUnder! > 1) {
    const pB = devigN([teamTotalBOver!, teamTotalBUnder!], method).p;
    muB = teamTotalB! + sigmaB * normPpf(pB);
    if (!usedTeamTotals) muA = sum - muB;  // if only B given, derive A from sum
    usedTeamTotals = true;
  }

  if (!(muA > 0 && muB > 0)) {
    return { err: 'Calibração produziu médias não-positivas. Verifique spread/total (o favorito pode estar invertido).' };
  }

  // Fit residual: how well the calibrated means reproduce the two targets.
  // With the analytic inversion this is ~0 in the base case; it can be nonzero
  // when team totals over-determine the system.
  const pOverFit = 1 - normCdf((totalLine! - (muA + muB)) / sigmaT);
  const pCoverFit = 1 - normCdf((-spread! - (muA - muB)) / sigmaD);
  const fitError = Math.pow(pOverFit - pOver, 2) + Math.pow(pCoverFit - pCoverA, 2);

  return {
    sport: 'basketball',
    muA, muB,
    sigmaA, sigmaB,
    rhoBB: rho,
    fitError,
  };
}

// ─── Sample N games via Monte Carlo (correlated bivariate normal) ───
// Rounds each team's score to an integer. Basketball has no draws: if the two
// rounded scores tie, the "possession" tiebreak awards the decisive point to
// the side whose continuous score had the larger fractional part (i.e. the side
// that was closer to rounding up). This resolves ties without the downward bias
// that re-sampling would introduce on the total distribution.
export function sampleBasketball(params: ModelParams, n: number): Outcome[] {
  const rng = makeRng(DEFAULT_SEED);
  const muA = params.muA!;
  const muB = params.muB!;
  const sigmaA = params.sigmaA!;
  const sigmaB = params.sigmaB!;
  const rho = params.rhoBB!;

  const out: Outcome[] = [];
  for (let i = 0; i < n; i++) {
    const [a, b] = bivariateNormal(muA, muB, sigmaA, sigmaB, rho, rng);
    let pa = Math.round(a);
    let pb = Math.round(b);
    if (pa === pb) {
      // Possession tiebreak: larger fractional part wins the decisive point.
      const fa = a - Math.floor(a);
      const fb = b - Math.floor(b);
      if (fa >= fb) pa += 1; else pb += 1;
    }
    out.push({ pointsA: pa, pointsB: pb });
  }
  return out;
}

// ─── Evaluate a basketball leg at an outcome ───
export function legAtBasketball(outcome: Outcome, leg: Leg): number {
  const a = outcome.pointsA ?? 0;
  const b = outcome.pointsB ?? 0;
  switch (leg.kind) {
    case 'moneyline':
      // No draws in the sample by construction.
      return (leg.side === 'A' ? a > b : b > a) ? 1 : 0;
    case 'spreadCover': {
      // leg.line holds the spread applied to leg.side. A covers when
      // (a - b) + spreadForA > 0. If side is 'B', mirror the margin.
      const spr = leg.line ?? 0;
      const margin = leg.side === 'A' ? (a - b) : (b - a);
      return (margin + spr > 0) ? 1 : 0;
    }
    case 'totalOver':
      return (a + b) > (leg.line ?? 0) ? 1 : 0;
    case 'totalUnder':
      return (a + b) < (leg.line ?? 0) ? 1 : 0;
    case 'teamTotalOver':
      return ((leg.side === 'A' ? a : b) > (leg.line ?? 0)) ? 1 : 0;
    case 'teamTotalUnder':
      return ((leg.side === 'A' ? a : b) < (leg.line ?? 0)) ? 1 : 0;
    case 'marginRange': {
      // Victory margin for leg.side within [marginMin, marginMax] (inclusive).
      const margin = leg.side === 'A' ? (a - b) : (b - a);
      const lo = leg.marginMin ?? 0;
      const hi = leg.marginMax ?? Infinity;
      return (margin >= lo && margin <= hi) ? 1 : 0;
    }
    default:
      return 1;
  }
}

// ─── Basketball model (SportModel interface) ───
export const basketballModel: SportModel = {
  sport: 'basketball',
  legKinds: BASKETBALL_LEGS,

  calibrate: calibrateBasketball,

  sample: sampleBasketball,

  legAt: legAtBasketball,

  jointProb: (outcomes: Outcome[], legs: Leg[]): number => {
    return jointProbMC(outcomes, legs, basketballModel);
  },

  naiveProb: (outcomes: Outcome[], legs: Leg[]): number => {
    return naiveProbMC(outcomes, legs, basketballModel);
  },
};
