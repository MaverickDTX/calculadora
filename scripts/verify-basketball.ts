// ─── Verify basketball model (calibration + sampling invariants) ───
// Run: npx tsx scripts/verify-basketball.ts

import { calibrateBasketball, sampleBasketball, basketballModel } from '../src/lib/sgp/basketball';
import { normCdf } from '../src/lib/math';
import type { SportInputs } from '../src/lib/sgp/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}

function approx(a: number, b: number, tolerance: number) {
  return Math.abs(a - b) < tolerance;
}

const muA = 115;
const muB = 109.5;
const sigmaA = 12;
const sigmaB = 12;
const rhoBB = 0.25;
const totalLine = 224.5;
const spread = -5.5;
const sigmaT = Math.sqrt(sigmaA ** 2 + sigmaB ** 2 + 2 * rhoBB * sigmaA * sigmaB);
const sigmaD = Math.sqrt(sigmaA ** 2 + sigmaB ** 2 - 2 * rhoBB * sigmaA * sigmaB);
const pOver = 1 - normCdf((totalLine - (muA + muB)) / sigmaT);
const pCoverA = 1 - normCdf((-spread - (muA - muB)) / sigmaD);

const inputs: SportInputs = {
  sport: 'basketball',
  totalLine,
  totalOver: 1 / pOver,
  totalUnder: 1 / (1 - pOver),
  spread,
  spreadA: 1 / pCoverA,
  spreadB: 1 / (1 - pCoverA),
  sigmaA,
  sigmaB,
  rhoBB,
};

console.log('1. Calibration round-trip...');
const calibrated = calibrateBasketball(inputs, 'prop');
assert(!('err' in calibrated), 'Calibration failed');
if ('err' in calibrated) process.exit(1);
assert(approx(calibrated.muA!, muA, 1e-6), `muA=${calibrated.muA}, expected ${muA}`);
assert(approx(calibrated.muB!, muB, 1e-6), `muB=${calibrated.muB}, expected ${muB}`);
console.log('   OK');

console.log('2. Complement invariants...');
const pUnder = normCdf((totalLine - (muA + muB)) / sigmaT);
const pCoverB = normCdf((-spread - (muA - muB)) / sigmaD);
assert(approx(pOver + pUnder, 1, 1e-12), 'P(Over) + P(Under) must equal 1');
assert(approx(pCoverA + pCoverB, 1, 1e-12), 'P(A covers) + P(B covers) must equal 1');
console.log('   OK');

console.log('3. Monte Carlo vs analytic total...');
const outcomes = sampleBasketball(calibrated, 200000);
const pOverMc = basketballModel.jointProb(outcomes, [{ kind: 'totalOver', line: totalLine }]);
assert(approx(pOverMc, pOver, 0.01), `MC=${pOverMc}, analytic=${pOver}`);
console.log(`   MC=${pOverMc.toFixed(4)} analytic=${pOver.toFixed(4)} OK`);

console.log('4. No tied final scores...');
assert(outcomes.every(outcome => outcome.pointsA !== outcome.pointsB), 'Possession tiebreak left a tied final score');
console.log('   OK');

console.log('\nAll checks passed.');
