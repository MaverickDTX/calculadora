// ─── Tennis SGP model (Markov chain by point + Monte Carlo) ───
//
// Hierarchy: point → game → set → match
// Parameters: pA_serve, pB_serve (prob. of winning a point on serve)
// Calibration: fit pA_serve, pB_serve to de-vigged ML + O/U games odds
// SGP: simulate N matches, evaluate legs per simulation

import { devigN } from '../math';
import type { DevigMethod } from '../../types';
import type { SportModel, SportInputs, ModelParams, Outcome, Leg, LegKindDef } from './types';
import { makeRng, jointProbMC, naiveProbMC, DEFAULT_SEED, DEFAULT_N_SIM } from './monte-carlo';

// ─── Tennis leg kinds ───
export const TENNIS_LEGS: LegKindDef[] = [
  { kind: 'matchWinner', label: 'Vencedor da partida', needsSide: true, sport: 'tennis' },
  { kind: 'totalGamesOver', label: 'Over jogos totais', needsLine: true, sport: 'tennis' },
  { kind: 'totalGamesUnder', label: 'Under jogos totais', needsLine: true, sport: 'tennis' },
  { kind: 'totalSetsOver', label: 'Over sets totais', needsLine: true, sport: 'tennis' },
  { kind: 'totalSetsUnder', label: 'Under sets totais', needsLine: true, sport: 'tennis' },
  { kind: 'setScore', label: 'Placar de sets exato', sport: 'tennis' },
  { kind: 'firstSetWinner', label: 'Vencedor do 1º set', needsSide: true, sport: 'tennis' },
  { kind: 'tiebreakInMatch', label: 'Tiebreak na partida', sport: 'tennis' },
];

// ─── Markov chain: probability of winning a game (on serve) ───
// Standard tennis game: 0-0, 15-0, 30-0, 40-0, game, deuce, ad, etc.
// Server wins point with probability p.
// Returns [P(server wins game), P(games lasts N points for N=4..10+)]
// We use a state machine: (serverPoints, receiverPoints) with deuce at 3-3.
export function probWinGame(p: number): number {
  // States: 0=0-0, 1=15-0, 2=30-0, 3=40-0, 4=0-15, 5=15-15, 6=30-15,
  // 7=40-15, 8=0-30, 9=15-30, 10=30-30, 11=0-40, 12=15-40, 13=30-40,
  // 14=40-40(deuce), 15=Ad-40(server), 16=40-Ad(receiver)
  // Terminal: 17=server wins, 18=receiver wins

  // Analytical computation via recursive Markov chain
  // Pre-deuce: scores below 3-3
  // Post-deuce: need to win 2 consecutive points from deuce

  // P(win game from deuce) = p^2 / (1 - 2*p*(1-p))
  const pDeuce = (p * p) / (1 - 2 * p * (1 - p));

  // Enumerate all paths that lead to server winning before deuce
  // Server wins 4 points, receiver wins k = 0,1,2 points
  // Number of arrangements: C(3+k, k) (last point must be server's 4th)
  let total = 0;
  for (let k = 0; k <= 2; k++) {
    const pts = factorial(3 + k) / (factorial(k) * factorial(3));
    total += pts * Math.pow(p, 4) * Math.pow(1 - p, k);
  }

  // Paths that reach deuce (3-3) and then server wins
  // Server wins exactly 3 of first 6 points: C(6,3) = 20
  const reachDeuce = 20 * Math.pow(p, 3) * Math.pow(1 - p, 3);
  total += reachDeuce * pDeuce;

  return total;
}

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

function binom(n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

// ─── Markov chain: probability of winning a set ───
// Set is first to 6 games with 2-game lead, tiebreak at 6-6.
// pS = prob. server (A) wins their service game
// pR = prob. server (B) wins their service game → A wins return game = 1 - pR
// alternating serve: A serves odd games, B serves even (or vice versa)
// We assume A serves first in each set (standard).

// Distribution of set outcomes:
// Returns { pAwin, lastGame, pTiebreak, gameDist }
// gameDist[i] = P(set lasts exactly i games, i from 6 to 13)
export interface SetResult {
  pAwin: number;
  pBwin: number;
  pTiebreak: boolean;      // whether set went to tiebreak
  totalGames: number;
  winner: 'A' | 'B';
}

// Simulate a single set given per-game probabilities
// pA_game = P(A wins game on serve), pB_game = P(B wins game on serve)
// A serves first → games: A serves games 1,3,5,...; B serves 2,4,6,...
function simulateSet(
  pA_game: number, pB_game: number, rng: () => number
): SetResult {
  let gamesA = 0, gamesB = 0;
  let server: 'A' | 'B' = 'A';  // A serves first
  let tiebreak = false;

  while (true) {
    // First to 6 with 2-game lead, or tiebreak at 6-6
    if (gamesA >= 6 && gamesA - gamesB >= 2) {
      return { pAwin: 1, pBwin: 0, pTiebreak: tiebreak, totalGames: gamesA + gamesB, winner: 'A' };
    }
    if (gamesB >= 6 && gamesB - gamesA >= 2) {
      return { pAwin: 0, pBwin: 1, pTiebreak: tiebreak, totalGames: gamesA + gamesB, winner: 'B' };
    }
    // Tiebreak at 6-6
    if (gamesA === 6 && gamesB === 6) {
      tiebreak = true;
      // Tiebreak: alternate points, first to 7 with 2-point lead
      // Simplified model: pTB = (pA_serve + (1-pB_serve)) / 2 as point win prob for A
      // Since we only have game-level probs, approximate tiebreak as:
      // P(A wins TB) ≈ function of pA_game and pB_game
      // Use a weighted average: A has slight advantage serving first
      const pA_tb = 0.5 + 0.5 * (pA_game - 0.5) - 0.5 * (pB_game - 0.5);
      // Simulate tiebreak points
      let ptsA = 0, ptsB = 0;
      let tbServer: 'A' | 'B' = 'A';
      let tbPointCount = 0;
      while (true) {
        if (ptsA >= 7 && ptsA - ptsB >= 2) {
          return { pAwin: 1, pBwin: 0, pTiebreak: true, totalGames: 13, winner: 'A' };
        }
        if (ptsB >= 7 && ptsB - ptsA >= 2) {
          return { pAwin: 0, pBwin: 1, pTiebreak: true, totalGames: 13, winner: 'B' };
        }
        const pWin = tbServer === 'A' ? pA_tb : 1 - pA_tb;
        if (rng() < pWin) {
          if (tbServer === 'A') ptsA++; else ptsB++;
        } else {
          if (tbServer === 'A') ptsB++; else ptsA++;
        }
        // Alternate serve: A serves points 1,2,5,6,9,10,... (1-2, then every 4)
        tbPointCount++;
        // In real tennis, serve switches every 2 points within tiebreak
        if (tbPointCount % 2 === 0) {
          tbServer = tbServer === 'A' ? 'B' : 'A';
        }
      }
    }

    // Regular game: server tries to hold
    const pServer = server === 'A' ? pA_game : pB_game;
    if (rng() < pServer) {
      if (server === 'A') gamesA++; else gamesB++;
    } else {
      if (server === 'A') gamesB++; else gamesA++;
    }

    // Switch server
    server = server === 'A' ? 'B' : 'A';
  }
}

// ─── Simulate a full match ───
function simulateMatch(
  pA_serve: number, pB_serve: number, bestOf: 3 | 5, rng: () => number
): Outcome {
  const pA_game = probWinGame(pA_serve);
  const pB_game = probWinGame(pB_serve);
  const setsToWin = bestOf === 3 ? 2 : 3;

  let setsA = 0, setsB = 0;
  let totalGames = 0;
  let hadTiebreak = false;
  let firstSetWinner: 'A' | 'B' | null = null;
  const setWinners: ('A' | 'B')[] = [];
  const setScoresArr: number[] = [];

  while (setsA < setsToWin && setsB < setsToWin) {
    const setRes = simulateSet(pA_game, pB_game, rng);
    totalGames += setRes.totalGames;
    if (setRes.pTiebreak) hadTiebreak = true;
    if (firstSetWinner === null) firstSetWinner = setRes.winner;
    setWinners.push(setRes.winner);

    if (setRes.winner === 'A') {
      setsA++;
      setScoresArr.push(setRes.totalGames); // games in this set
    } else {
      setsB++;
      setScoresArr.push(setRes.totalGames);
    }
  }

  return {
    winner: setsA > setsB ? 'A' : 'B',
    totalGames,
    totalSets: setsA + setsB,
    setScoreA: setsA,
    setScoreB: setsB,
    firstSetWinner: firstSetWinner ?? 'A',
    hadTiebreak,
    setScores: setScoresArr,
  };
}

// ─── Calibration: fit pA_serve, pB_serve to match de-vigged ML + O/U games ───
export function calibrateTennis(
  inputs: SportInputs, method: DevigMethod
): ModelParams | { err: string } {
  const { mlA, mlB, gamesLine, gamesOver, gamesUnder, bestOf } = inputs;
  const bo = bestOf ?? 3;

  if (!(mlA! > 1 && mlB! > 1)) return { err: 'Preencha as odds ML de A e B (>1).' };
  if (!(gamesOver! > 1 && gamesUnder! > 1 && gamesLine! > 0)) return { err: 'Preencha linha e odds Over/Under jogos (>1).' };

  // De-vig the ML and O/U
  const dvML = devigN([mlA!, mlB!], method);
  const pA_target = dvML.probs[0];  // P(A wins match)
  const dvOU = devigN([gamesOver!, gamesUnder!], method);
  const pOver_target = dvOU.p;       // P(total games > line)

  // Optional: first set odds (extra calibration point)
  const fsA = inputs.firstSetA;
  const fsB = inputs.firstSetB;
  let pFirstSetA_target: number | null = null;
  if (fsA! > 1 && fsB! > 1) {
    pFirstSetA_target = devigN([fsA!, fsB!], method).probs[0];
  }

  // Grid search over (pA_serve, pB_serve) ∈ [0.50, 0.85] × [0.50, 0.85]
  // For each candidate, simulate N matches and compute error vs targets
  const N_CAL = 2000;
  const rng = makeRng(DEFAULT_SEED);

  let best: { err: number; pA: number; pB: number } | null = null;

  for (let pA = 0.52; pA <= 0.82; pA += 0.03) {
    for (let pB = 0.52; pB <= 0.82; pB += 0.03) {
      let pAWin = 0, pOver = 0, pFS = 0;
      for (let i = 0; i < N_CAL; i++) {
        const o = simulateMatch(pA, pB, bo, rng);
        if (o.winner === 'A') pAWin++;
        if ((o.totalGames ?? 0) > gamesLine!) pOver++;
        if (pFirstSetA_target !== null && o.firstSetWinner === 'A') pFS++;
      }
      const pAWinEst = pAWin / N_CAL;
      const pOverEst = pOver / N_CAL;
      const pFSEst = pFS / N_CAL;

      let err = Math.pow(pAWinEst - pA_target, 2) + Math.pow(pOverEst - pOver_target, 2);
      if (pFirstSetA_target !== null) {
        err += Math.pow(pFSEst - pFirstSetA_target, 2);
      }

      if (!best || err < best.err) best = { err, pA, pB };
    }
  }

  // Fine-tune around best
  const b = best!;
  for (let pA = b.pA - 0.03; pA <= b.pA + 0.03; pA += 0.005) {
    for (let pB = b.pB - 0.03; pB <= b.pB + 0.03; pB += 0.005) {
      if (pA <= 0.5 || pB <= 0.5) continue;
      let pAWin = 0, pOver = 0, pFS = 0;
      for (let i = 0; i < N_CAL; i++) {
        const o = simulateMatch(pA, pB, bo, rng);
        if (o.winner === 'A') pAWin++;
        if ((o.totalGames ?? 0) > gamesLine!) pOver++;
        if (pFirstSetA_target !== null && o.firstSetWinner === 'A') pFS++;
      }
      const pAWinEst = pAWin / N_CAL;
      const pOverEst = pOver / N_CAL;
      const pFSEst = pFS / N_CAL;

      let err = Math.pow(pAWinEst - pA_target, 2) + Math.pow(pOverEst - pOver_target, 2);
      if (pFirstSetA_target !== null) {
        err += Math.pow(pFSEst - pFirstSetA_target, 2);
      }

      if (err < best!.err) best = { err, pA, pB };
    }
  }

  return {
    sport: 'tennis',
    pA_serve: b.pA,
    pB_serve: b.pB,
    bestOf: bo,
    fitError: b.err,
  };
}

// ─── Sample N matches via Monte Carlo ───
export function sampleTennis(params: ModelParams, n: number): Outcome[] {
  const rng = makeRng(DEFAULT_SEED);
  const pA = params.pA_serve!;
  const pB = params.pB_serve!;
  const bo = params.bestOf ?? 3;
  const out: Outcome[] = [];
  for (let i = 0; i < n; i++) out.push(simulateMatch(pA, pB, bo, rng));
  return out;
}

// ─── Evaluate a tennis leg at an outcome ───
export function legAtTennis(outcome: Outcome, leg: Leg): number {
  switch (leg.kind) {
    case 'matchWinner':
      return (outcome.winner === leg.side) ? 1 : 0;
    case 'totalGamesOver':
      return (outcome.totalGames ?? 0) > (leg.line ?? 0) ? 1 : 0;
    case 'totalGamesUnder':
      return (outcome.totalGames ?? 0) < (leg.line ?? 0) ? 1 : 0;
    case 'totalSetsOver':
      return (outcome.totalSets ?? 0) > (leg.line ?? 0) ? 1 : 0;
    case 'totalSetsUnder':
      return (outcome.totalSets ?? 0) < (leg.line ?? 0) ? 1 : 0;
    case 'setScore':
      return (outcome.setScoreA === leg.setScoreA && outcome.setScoreB === leg.setScoreB) ? 1 : 0;
    case 'firstSetWinner':
      return (outcome.firstSetWinner === leg.side) ? 1 : 0;
    case 'tiebreakInMatch':
      return outcome.hadTiebreak ? 1 : 0;
    default:
      return 1;
  }
}

// ─── Tennis model (SportModel interface) ───
export const tennisModel: SportModel = {
  sport: 'tennis',
  legKinds: TENNIS_LEGS,

  calibrate: calibrateTennis,

  sample: sampleTennis,

  legAt: legAtTennis,

  jointProb: (outcomes: Outcome[], legs: Leg[]): number => {
    return jointProbMC(outcomes, legs, tennisModel);
  },

  naiveProb: (outcomes: Outcome[], legs: Leg[]): number => {
    return naiveProbMC(outcomes, legs, tennisModel);
  },
};
