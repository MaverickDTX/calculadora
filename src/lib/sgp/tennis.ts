// ─── Tennis SGP model (Markov chain by point) ───
//
// Hierarchy: point → game → set → match
// Parameters: pA_serve, pB_serve (prob. of winning a point on serve)
// Calibration (exact): fit pA_serve, pB_serve via DP over the Markov chain
//   (game → set → match) — no Monte Carlo needed in calibrateTennis.
// SGP (final sample): simulate N matches via MC, evaluate legs per simulation.

import { devigN } from '../math';
import type { DevigMethod } from '../../types';
import type { SportModel, SportInputs, ModelParams, Outcome, Leg, LegKindDef } from './types';
import { makeRng, jointProbMC, naiveProbMC, DEFAULT_SEED } from './monte-carlo';

// ─── Tennis leg kinds ───
export const TENNIS_LEGS: LegKindDef[] = [
  { kind: 'matchWinner', label: 'Vencedor da partida', needsSide: true, sport: 'tennis' },
  { kind: 'totalGamesOver', label: 'Over games totais', needsLine: true, sport: 'tennis' },
  { kind: 'totalGamesUnder', label: 'Under games totais', needsLine: true, sport: 'tennis' },
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

// ─── Exact DP: probability of winning a tiebreak (point-by-point Markov) ───
// Standard tiebreak: first to 7 points, win by 2.
// Serve rotation (A serves first): A serves point 1; after that, serve
// switches every 2 points: B serves {2,3}, A serves {4,5}, B serves {6,7}, ...
// Returns P(A wins the tiebreak) given point-on-serve probabilities.
export function probWinTiebreakDP(pA_serve: number, pB_serve: number): number {
  const pA_when_A_serves = pA_serve;       // P(A wins point) when A is serving
  const pA_when_B_serves = 1 - pB_serve;   // P(A wins point) when B is serving (= B is broken)

  // dp[a][b] = P(reaching tiebreak score a-b from 0-0)
  const MAX = 20; // cap; tail beyond 20-20 has probability < 1e-15 for realistic p
  const dp: number[][] = Array.from({ length: MAX + 1 }, () => new Array(MAX + 1).fill(0));
  dp[0][0] = 1;

  let pAWin = 0;
  // Process states in order of total points played so far (a+b) so we never
  // read a value we already overwrote.
  for (let tot = 0; tot <= 2 * MAX - 1; tot++) {
    for (let a = Math.max(0, tot - MAX); a <= Math.min(MAX, tot); a++) {
      const b = tot - a;
      const cur = dp[a][b];
      if (cur === 0) continue;
      // If this state is terminal (someone already won), skip — it should not
      // propagate further (and its probability was already captured when the
      // winning point was placed).
      if ((a >= 7 || b >= 7) && Math.abs(a - b) >= 2) continue;

      const ptNum = tot + 1; // 1-indexed number of the point about to be played
      const aServes = aServesNext(ptNum);
      const pAPoint = aServes ? pA_when_A_serves : pA_when_B_serves;

      // A wins the next point
      const na = a + 1, nb = b;
      if (na >= 7 && na - nb >= 2) {
        pAWin += cur * pAPoint;
      } else if (na <= MAX) {
        dp[na][nb] += cur * pAPoint;
      }
      // B wins the next point
      const mb = b + 1;
      if (mb >= 7 && mb - a >= 2) {
        // B wins the tiebreak — no contribution to pAWin
      } else if (mb <= MAX) {
        dp[a][mb] += cur * (1 - pAPoint);
      }
    }
  }
  return pAWin;
}

// Serve rotation in a tiebreak (A serves first):
//   pt 1          → A
//   pt 2, 3       → B
//   pt 4, 5       → A
//   pt 6, 7       → B
//   pt 8, 9       → A
//   ...
// After the opening A serve (pt 1), the remaining points (pt 2,3,4,...) come in
// pairs that alternate server: block 0 = pt 2-3 (B), block 1 = pt 4-5 (A),
// block 2 = pt 6-7 (B), etc. So A serves the odd-indexed blocks (1, 3, 5, ...).
function aServesNext(ptNum: number): boolean {
  if (ptNum === 1) return true;
  const r = ptNum - 2;          // 0,1,2,3,...
  const block = Math.floor(r / 2); // 0,0,1,1,2,2,...
  return (block % 2 === 1);       // odd blocks → A serves
}

// ─── Exact DP: joint distribution of a single set (winner × gameCount) ───
// A serves games 1,3,5,7,9,11,13 (odd game numbers); B serves 2,4,6,8,10,12.
// First to 6 games with 2-game lead; tiebreak at 6-6 (decided by probWinTiebreakDP).
interface SetDistJoint {
  pAwinSet: number;
  pBwinSet: number;
  // byCountAWin[n] = P(A wins the set with exactly n total games), n in [6..13].
  // byCountBWin[n] = P(B wins the set with exactly n total games).
  // n=13 always means the set was decided by tiebreak (7-6).
  byCountAWin: number[]; // length 14 (only indices 6..13 are nonzero)
  byCountBWin: number[]; // length 14
  pTiebreak: number;
}

export function probWinSetDPJoint(
  pA_game: number, pB_game: number, pA_serve: number, pB_serve: number
): SetDistJoint {
  // dp[gA][gB] = P(reaching game score (gA, gB)). gA, gB ∈ [0..7]; 7 represents
  // "got to 7 games" (used for 7-5 and 7-6 finishes after going past 5-5).
  const dp: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
  dp[0][0] = 1;

  const byCountAWin = new Array(14).fill(0);
  const byCountBWin = new Array(14).fill(0);
  let pTiebreak = 0;

  // Iterate in order of total games played (gA + gB) so writes to (gA+1, gB)
  // and (gA, gB+1) — which have a higher total — are never read in the same pass.
  for (let tot = 0; tot <= 13; tot++) {
    for (let gA = Math.max(0, tot - 7); gA <= Math.min(7, tot); gA++) {
      const gB = tot - gA;
      const cur = dp[gA][gB];
      if (cur === 0) continue;

      // Terminal: A wins the set (6-0..6-4, or 7-5, or 7-6)
      if ((gA === 6 && gB <= 4) || (gA === 7 && (gB === 5 || gB === 6))) {
        const tg = gA + gB;
        if (gB === 6) { byCountAWin[13] += cur; pTiebreak += cur; }
        else byCountAWin[tg] += cur;
        continue;
      }
      // Terminal: B wins the set (mirror)
      if ((gB === 6 && gA <= 4) || (gB === 7 && (gA === 5 || gA === 6))) {
        const tg = gA + gB;
        if (gA === 6) { byCountBWin[13] += cur; pTiebreak += cur; }
        else byCountBWin[tg] += cur;
        continue;
      }
      // 6-6 → tiebreak (decided point-by-point)
      if (gA === 6 && gB === 6) {
        const pAtb = probWinTiebreakDP(pA_serve, pB_serve);
        byCountAWin[13] += cur * pAtb;
        byCountBWin[13] += cur * (1 - pAtb);
        pTiebreak += cur;
        continue;
      }

      // Play another game. A serves odd-numbered games, B serves even.
      const gameNum = tot + 1;
      const aServes = (gameNum % 2 === 1);
      const pServer = aServes ? pA_game : pB_game;
      if (aServes) {
        if (gA + 1 <= 7) dp[gA + 1][gB] += cur * pServer;       // A holds
        if (gB + 1 <= 7) dp[gA][gB + 1] += cur * (1 - pServer); // A broken
      } else {
        if (gB + 1 <= 7) dp[gA][gB + 1] += cur * pServer;       // B holds
        if (gA + 1 <= 7) dp[gA + 1][gB] += cur * (1 - pServer); // B broken
      }
    }
  }

  const pAwinSet = byCountAWin.reduce((s, v) => s + v, 0);
  const pBwinSet = byCountBWin.reduce((s, v) => s + v, 0);
  return { pAwinSet, pBwinSet, byCountAWin, byCountBWin, pTiebreak };
}

// ─── Exact DP: distribution of a full match ───
// Tracks state (setsA, setsB, totalGamesAccum, hadTB, firstSetWinner):
//   - hadTB ∈ {0, 1}: whether any set so far went to tiebreak (OR across sets)
//   - firstSetWinner ∈ {0=A, 1=B, 2=unset}: determined at the first set only
// Returns the match-level probabilities used by calibrateTennis's objective.
interface MatchDist {
  pA_win_match: number;
  pB_win_match: number;
  totalGamesProb: number[]; // index = total games in the match (P(match totals N games))
  pFirstSetA: number;       // P(A wins the first set)
  pTiebreakInMatch: number; // P(at least one set goes to tiebreak)
}

export function probMatchDP(pA_serve: number, pB_serve: number, bestOf: 3 | 5): MatchDist {
  const pA_game = probWinGame(pA_serve);
  const pB_game = probWinGame(pB_serve);
  const sd = probWinSetDPJoint(pA_game, pB_game, pA_serve, pB_serve);

  const setsToWin = bestOf === 3 ? 2 : 3;
  const maxSets = 2 * setsToWin - 1; // 3 (best-of-3) or 5 (best-of-5)
  const TGP = 13 * maxSets + 1;      // 40 or 66; index = total games accumulated

  // Slice indexing: hadTB(2) × firstSetWinner(3). fsw: 0 = A won first set, 1 = B
  // won first set, 2 = unset (only at the start). NSL = 6 slices total.
  const NSL = 6;
  const slice = (had: number, fsw: number) => had * 3 + fsw;

  // dp[sA][sB][sl][tg] = P(state (sA, sB) with slice sl and accumulated tg games)
  const dp: number[][][][] = Array.from({ length: setsToWin + 1 }, () =>
    Array.from({ length: setsToWin + 1 }, () =>
      Array.from({ length: NSL }, () => new Array(TGP).fill(0))
    )
  );
  dp[0][0][slice(0, 2)][0] = 1;

  let pA_win_match = 0, pB_win_match = 0, pFirstSetA = 0, pTiebreakInMatch = 0;
  const totalGamesProb = new Array(TGP).fill(0);

  // Process states by stage (sA + sB) to ensure all predecessors are computed.
  for (let stage = 0; stage <= maxSets; stage++) {
    for (let sA = Math.max(0, stage - setsToWin); sA <= Math.min(setsToWin, stage); sA++) {
      const sB = stage - sA;
      if (sB < 0 || sB > setsToWin) continue;

      for (let sl = 0; sl < NSL; sl++) {
        const arr = dp[sA][sB][sl];
        let mass = 0;
        for (let tg = 0; tg < TGP; tg++) mass += arr[tg];
        if (mass === 0) continue;

        if (sA === setsToWin || sB === setsToWin) {
          const had = Math.floor(sl / 3);
          const fsw = sl % 3;
          if (sA === setsToWin) pA_win_match += mass; else pB_win_match += mass;
          if (had === 1) pTiebreakInMatch += mass;
          if (sA + sB > 0 && fsw === 0) pFirstSetA += mass;
          for (let tg = 0; tg < TGP; tg++) totalGamesProb[tg] += arr[tg];
          continue;
        }

        const isFirstSet = (stage === 0);
        for (let tg = 0; tg < TGP; tg++) {
          const cur = arr[tg];
          if (cur === 0) continue;
          // For each set outcome (A wins with N games, or B wins with N games),
          // transition to the next state.
          for (let n = 6; n <= 13; n++) {
            const pA = sd.byCountAWin[n];
            if (pA > 0 && sA + 1 <= setsToWin && tg + n < TGP) {
              const newHad = (sl >= 3 ? 1 : 0) | (n === 13 ? 1 : 0);
              const newFsw = isFirstSet ? 0 : (sl % 3);
              dp[sA + 1][sB][slice(newHad, newFsw)][tg + n] += cur * pA;
            }
            const pB = sd.byCountBWin[n];
            if (pB > 0 && sB + 1 <= setsToWin && tg + n < TGP) {
              const newHad = (sl >= 3 ? 1 : 0) | (n === 13 ? 1 : 0);
              const newFsw = isFirstSet ? 1 : (sl % 3);
              dp[sA][sB + 1][slice(newHad, newFsw)][tg + n] += cur * pB;
            }
          }
        }
      }
    }
  }

  return { pA_win_match, pB_win_match, totalGamesProb, pFirstSetA, pTiebreakInMatch };
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

// Simulate a single set given per-game and per-point probabilities.
// pA_game/pB_game drive regular service games; pA_serve/pB_serve drive the
// tiebreak (point-by-point, with real serve rotation). A serves first.
function simulateSet(
  pA_game: number, pB_game: number,
  pA_serve: number, pB_serve: number,
  rng: () => number
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
    // Tiebreak at 6-6 — point-by-point with real serve rotation (mirrors probWinTiebreakDP)
    if (gamesA === 6 && gamesB === 6) {
      tiebreak = true;
      let ptsA = 0, ptsB = 0;
      let ptNum = 1; // 1-indexed point of the tiebreak
      while (true) {
        if (ptsA >= 7 && ptsA - ptsB >= 2) {
          return { pAwin: 1, pBwin: 0, pTiebreak: true, totalGames: 13, winner: 'A' };
        }
        if (ptsB >= 7 && ptsB - ptsA >= 2) {
          return { pAwin: 0, pBwin: 1, pTiebreak: true, totalGames: 13, winner: 'B' };
        }
        // Serve rotation: pt 1 → A; then pairs alternating: {2,3}→B, {4,5}→A, {6,7}→B, ...
        const aServes = aServesNext(ptNum);
        const pAPoint = aServes ? pA_serve : (1 - pB_serve);
        if (rng() < pAPoint) ptsA++; else ptsB++;
        ptNum++;
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
export function simulateMatch(
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
    const setRes = simulateSet(pA_game, pB_game, pA_serve, pB_serve, rng);
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

// ─── Calibration: fit pA_serve, pB_serve to de-vigged ML + O/U games ───
//
// The calibration problem: given target probabilities for (P(A wins match),
// P(total games > line), [P(A wins first set)]), find (pA_serve, pB_serve)
// whose exact Markov-DP predictions reproduce those targets as closely as
// possible. The objective is now exact and deterministic (no MC noise), so the
// grid search sees a smooth error surface.
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

  // Objective: exact squared error vs targets for a given (pA_serve, pB_serve).
  const line = gamesLine!;
  const objective = (pA: number, pB: number): number => {
    const m = probMatchDP(pA, pB, bo);
    let pOver = 0;
    for (let n = Math.floor(line) + 1; n < m.totalGamesProb.length; n++) pOver += m.totalGamesProb[n];
    let err = Math.pow(m.pA_win_match - pA_target, 2) + Math.pow(pOver - pOver_target, 2);
    if (pFirstSetA_target !== null) {
      err += Math.pow(m.pFirstSetA - pFirstSetA_target, 2);
    }
    return err;
  };

  // Coarse grid (11 × 11 = 121 candidates) over [0.52, 0.82]².
  let best: { err: number; pA: number; pB: number } | null = null;
  for (let pa = 0.52; pa <= 0.82 + 1e-9; pa += 0.03) {
    for (let pb = 0.52; pb <= 0.82 + 1e-9; pb += 0.03) {
      const err = objective(pa, pb);
      if (!best || err < best.err) best = { err, pA: pa, pB: pb };
    }
  }

  // Fine-tune around best (13 × 13 = 169 candidates, step 0.005).
  let b = best;
  if (!b) return { err: 'Calibração falhou — nenhum candidato válido.' };
  const { pA: bpA, pB: bpB } = b;
  for (let pa = bpA - 0.03; pa <= bpA + 0.03 + 1e-9; pa += 0.005) {
    for (let pb = bpB - 0.03; pb <= bpB + 0.03 + 1e-9; pb += 0.005) {
      if (pa <= 0.5 || pb <= 0.5) continue;
      const err = objective(pa, pb);
      if (err < b.err) b = { err, pA: pa, pB: pb };
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
