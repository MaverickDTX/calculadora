import type { DevigMethod } from '../../types';

// ─── Sport identifier ───
export type SportId = 'football' | 'tennis' | 'basketball';

// ─── Generic outcome of a single simulation / grid cell ───
// Each sport populates the fields it needs; legs read from this.
export interface Outcome {
  // Football
  scoreA?: number;
  scoreB?: number;
  // Tennis
  winner?: 'A' | 'B';
  totalGames?: number;
  totalSets?: number;
  setScores?: number[];      // e.g. [6,4,3,6,7,5] → games per set alternating A,B
  setScoreA?: number;        // sets won by A (e.g. 2)
  setScoreB?: number;       // sets won by B (e.g. 1)
  firstSetWinner?: 'A' | 'B';
  hadTiebreak?: boolean;
  // Basketball
  pointsA?: number;
  pointsB?: number;
  // Props (shared)
  propValue?: number;
}

// ─── Leg definition (UI metadata + evaluation) ───
export interface LegKindDef {
  kind: string;
  label: string;
  needsLine?: boolean;
  needsSide?: boolean;       // A / B selector
  needsRange?: boolean;       // margin ranges in basketball
  sport: SportId;
}

// ─── Leg instance (user-added) ───
export interface Leg {
  kind: string;
  line?: number;
  side?: 'A' | 'B';
  dir?: 'over' | 'under';
  // Tennis-specific
  setScoreA?: number;
  setScoreB?: number;
  // Basketball-specific
  marginMin?: number;
  marginMax?: number;
  // Shared metadata
  label?: string;
  // Football-specific (player/corner props — kept generic for future)
  [key: string]: unknown;
}

// ─── Sport-specific inputs (raw odds from the user) ───
export interface SportInputs {
  sport: SportId;
  // Football (existing)
  h?: number; d?: number; a?: number;       // 1X2
  ouLine?: number; over?: number; under?: number;
  rho?: number;                              // Dixon-Coles
  // Tennis
  mlA?: number; mlB?: number;               // match winner A / B
  gamesLine?: number; gamesOver?: number; gamesUnder?: number;
  bestOf?: 3 | 5;                            // best of 3 or 5 sets
  firstSetA?: number; firstSetB?: number;    // optional first-set odds
  // Basketball
  totalLine?: number; totalOver?: number; totalUnder?: number;
  teamTotalA?: number; teamTotalAOver?: number; teamTotalAUnder?: number;
  teamTotalB?: number; teamTotalBOver?: number; teamTotalBUnder?: number;
  spread?: number; spreadA?: number; spreadB?: number;
  sigmaA?: number; sigmaB?: number;          // defaults if user overrides
  rhoBB?: number;                            // correlation between team scores
  // Your odd (the SGP price you're getting)
  your?: number;
}

// ─── Calibration result (sport-specific params) ───
export interface ModelParams {
  sport: SportId;
  // Football
  lh?: number; la?: number;                  // Poisson lambdas
  rho?: number;
  P?: number[][];                             // score grid (football)
  // Tennis
  pA_serve?: number; pB_serve?: number;      // point-on-serve probabilities
  bestOf?: 3 | 5;
  // Basketball
  muA?: number; muB?: number;                 // mean points
  sigmaA?: number; sigmaB?: number;
  rhoBB?: number;                            // bivariate normal correlation
  // Shared
  fitError?: number;
}

// ─── Sport model interface (strategy pattern) ───
export interface SportModel {
  sport: SportId;
  legKinds: LegKindDef[];

  // Calibrate model params from de-vigged odds
  calibrate(inputs: SportInputs, method: DevigMethod): ModelParams | { err: string };

  // Generate outcome distribution:
  //   - Football: returns the score grid P[i][j] as Outcome[] (analytical)
  //   - Tennis/Basketball: returns N simulated outcomes (Monte Carlo)
  sample(params: ModelParams, n: number): Outcome[];

  // Evaluate a leg at a given outcome (1 = hit, 0 = miss, [0,1] for props)
  legAt(outcome: Outcome, leg: Leg): number;

  // Compute the joint probability of all legs hitting
  jointProb(outcomes: Outcome[], legs: Leg[]): number;

  // Compute the naive (independent) product of marginal leg probabilities
  naiveProb(params: ModelParams, legs: Leg[]): number;
}

// ─── De-vigged probabilities for calibration ───
export interface DevigResult {
  p: number;
  probs: number[];
  M: number | null;
  fb: boolean;
}
