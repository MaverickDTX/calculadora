// ─── Monte Carlo utilities for SGP (tennis, basketball) ───
// Shared RNG + joint probability computation.

import type { Outcome, Leg, SportModel } from './types';

// Mulberry32 — fast seeded PRNG (deterministic across runs)
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box-Muller
export function gauss(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Bivariate normal sampler (correlated)
export function bivariateNormal(
  muA: number, muB: number, sigmaA: number, sigmaB: number, rho: number, rng: () => number
): [number, number] {
  const z1 = gauss(rng);
  const z2 = gauss(rng);
  const a = muA + sigmaA * z1;
  const b = muB + sigmaB * (rho * z1 + Math.sqrt(1 - rho * rho) * z2);
  return [Math.max(0, a), Math.max(0, b)];
}

// Joint probability via Monte Carlo:
// fraction of outcomes where ALL legs hit (legAt == 1 for each leg)
export function jointProbMC(
  outcomes: Outcome[], legs: Leg[], model: SportModel
): number {
  if (outcomes.length === 0) return 0;
  let hits = 0;
  for (const o of outcomes) {
    let allHit = true;
    for (const leg of legs) {
      if (model.legAt(o, leg) < 1) { allHit = false; break; }
    }
    if (allHit) hits++;
  }
  return hits / outcomes.length;
}

// Naive (independent) product of marginal leg probabilities via MC:
// for each leg, compute P(leg hits) separately, then multiply
export function naiveProbMC(
  outcomes: Outcome[], legs: Leg[], model: SportModel
): number {
  if (outcomes.length === 0) return 0;
  let product = 1;
  for (const leg of legs) {
    let hits = 0;
    for (const o of outcomes) {
      if (model.legAt(o, leg) >= 1) hits++;
    }
    product *= hits / outcomes.length;
  }
  return product;
}

// Default seed for reproducibility (deterministic results across runs)
export const DEFAULT_SEED = 424242;
export const DEFAULT_N_SIM = 20000;
