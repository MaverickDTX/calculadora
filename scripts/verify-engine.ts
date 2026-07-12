/**
 * Engine regression snapshots — CONTRATO.
 *
 * Estes 11 fixtures definem o comportamento esperado da engine de cálculo.
 * Se qualquer snapshot mudar no futuro:
 *   - NÃO atualize o valor automaticamente.
 *   - Abra um PR com justificativa explícita ("mudança metodológica intencional").
 *   - Atualize tanto o snapshot quanto o changelog.
 *
 * Rodar a cada commit do redesign: npx tsx scripts/verify-engine.ts
 */

import { calcNres, calcProps, calcProxy, calcAub, calcCombo, calcPoi, calcAsia } from '../src/lib/calc';
import type { Config, BetResult } from '../src/types';

const BASE_CFG: Config = {
  bank: 10000,
  unit: 100,
  floor: 0.02,
  cap: 0.05,
  edgemin: 0.02,
  frac: 0.25,
  method: 'auto',
  boostType: 'none',
  boostVal: 0,
  confAdj: 'on',
};

function approx(a: number, b: number, tol: number): boolean {
  if (!Number.isFinite(a) && !Number.isFinite(b)) return true;
  return Math.abs(a - b) < tol;
}

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error('  FAIL:', msg); process.exitCode = 1; }
}

function check(label: string, got: BetResult | { err: string }, expected: Partial<BetResult> & { err?: string }) {
  if ('err' in got) {
    assert(expected.err === got.err, `${label}: err mismatch. Got "${got.err}", expected "${expected.err}"`);
    if (expected.err) { console.log(`  OK (err: ${got.err})`); return; }
  }
  if (expected.err) { assert(false, `${label}: expected err but got result`); return; }
  const e = expected as Partial<BetResult>;
  const checks: { key: string; a: number | string | null | undefined; b: number | string | null | undefined; tol: number }[] = [];
  if (e.p !== undefined) checks.push({ key: 'p', a: got.p, b: e.p, tol: 1e-9 });
  if (e.ev !== undefined) checks.push({ key: 'ev', a: got.ev, b: e.ev, tol: 1e-9 });
  if (e.kfull !== undefined) checks.push({ key: 'kfull', a: got.kfull, b: e.kfull, tol: 1e-9 });
  if (e.kadj !== undefined) checks.push({ key: 'kadj', a: got.kadj, b: e.kadj, tol: 1e-9 });
  if (e.fair !== undefined) checks.push({ key: 'fair', a: got.fair, b: e.fair, tol: 1e-8 });
  if (e.confClass !== undefined) checks.push({ key: 'confClass', a: got.confClass, b: e.confClass, tol: 0 });
  if (e.M !== undefined) checks.push({ key: 'M', a: got.M, b: e.M, tol: 1e-9 });
  const fails = checks.filter(c => {
    if (c.tol === 0) return c.a !== c.b;
    if (c.a === null && c.b === null) return false;
    if (c.a === null || c.b === null) return true;
    return !approx(c.a as number, c.b as number, c.tol);
  });
  if (fails.length > 0) {
    console.error(`  FAIL: ${label}`);
    for (const f of fails) console.error(`    ${f.key}: got ${f.a}, expected ${f.b}`);
    process.exitCode = 1;
  } else { console.log(`  OK`); }
}

function get(inputs: Record<string, string>): (id: string) => string {
  return (id: string) => inputs[id] ?? '';
}

// ─── Fixtures ───

console.log('1. NRes 3-way (2.10 / 3.40 / 3.80, your=2.00)...');
{
  const inputs = { 'nres-eval': '2.10', 'nres-your': '2.00', 'nres-others': '3.40,3.80' };
  const result = calcNres(get(inputs), BASE_CFG);
  check('NRes 3-way', result, {
    p: 0.4650203295751494, ev: -0.06995934084970123, kfull: 0, kadj: 0,
    fair: 2.150443618053467, confClass: 'high',
  });
}

console.log('2. NRes 2-way (1.85 / 1.95, your=1.80)...');
{
  const inputs = { 'nres-eval': '1.85', 'nres-your': '1.80', 'nres-others': '1.95' };
  const result = calcNres(get(inputs), BASE_CFG);
  check('NRes 2-way', result, {
    p: 0.5138911737741703, ev: -0.07499588720649353, kfull: 0, kadj: 0,
    fair: 1.9459372937964692, confClass: 'high',
  });
}

console.log('3. Props pair (1.80 / 2.00, your=1.90)...');
{
  const inputs = { 'prop-ref-yes': '1.80', 'prop-ref-no': '2.00', 'prop-your': '1.90', 'prop-type': 'simnao' };
  const result = calcProps(get(inputs), BASE_CFG);
  check('Props pair', result, {
    p: 0.5278455935530304, ev: 0.002906627750757673, kfull: 0.0032295863897307485, kadj: 0,
    fair: 1.894493412872517, confClass: 'high',
  });
}

console.log('4. Props margin (1.80, your=1.90, margem=5%)...');
{
  const inputs = { 'prop-ref-yes': '1.80', 'prop-your': '1.90', 'prop-margin': '5,0', 'prop-type': 'simnao', 'prop-margin-on': 'true' };
  const result = calcProps(get(inputs), BASE_CFG);
  check('Props margin', result, {
    p: 0.5291005291005291, ev: 0.005291005291005169, kfull: 0.005878894767783472, kadj: 0,
    fair: 1.89, confClass: 'mid',
  });
}

console.log('5. Proxy single (ref=2.00, your=2.20, margem=5%)...');
{
  const inputs = { 'proxy-mode': 'single', 'proxy-ref': '2.00', 'proxy-your': '2.20', 'proxy-margin': '5,0' };
  const result = calcProxy(get(inputs), BASE_CFG);
  check('Proxy single', result, {
    p: 0.47619047619047616, ev: 0.04761904761904767, kfull: 0.03968253968253967, kadj: 0.005952380952380958,
    fair: 2.1, confClass: 'mid',
  });
}

console.log('6. Consenso (3 casas, your=1.80, margem=5%)...');
{
  const inputs = { 'proxy-mode': 'consenso', 'proxy-cons-odds': '1.85,1.90,1.95', 'proxy-cons-margin': '5,0', 'proxy-cons-your': '1.80' };
  const result = calcProxy(get(inputs), BASE_CFG);
  check('Consenso', result, {
    p: 0.5014847120110277, ev: -0.09732751838015008, kfull: 0, kadj: 0,
    fair: 1.994078734703302, confClass: 'low',
  });
}

console.log('7. Aub 3 seleções (3.00/4.00/5.00, your=6.00, desc=15%)...');
{
  const inputs = { 'aub-odds': '3.00,4.00,5.00', 'aub-your': '6.00', 'aub-discount': '15' };
  const result = calcAub(get(inputs), BASE_CFG);
  check('Aub', result, {
    p: 0.51, ev: 2.06, kfull: 0.412, kadj: 0.05,
    fair: 1.9607843137254901, confClass: 'mid',
  });
}

console.log('8. Combo 2 legs (binário+ternário, your=5.00)...');
{
  const inputs = { 'combo-your': '5.00', 'combo-legs': '2|0|1.53,2.37;3|0|1.41,3.20,8.00' };
  const result = calcCombo(get(inputs), BASE_CFG);
  check('Combo', result, {
    p: 0.4096969637090083, ev: 1.0484848185450417, kfull: 0.26212120463626043, kadj: 0.05,
    fair: 2.4408284380410024, confClass: 'high',
  });
}

console.log('9. Poi football (1X2 1.80/3.50/4.00, O/U 2.5 1.90/1.90, your=2.00, leg=homewin)...');
{
  const inputs = { 'poi-h': '1.80', 'poi-d': '3.50', 'poi-a': '4.00', 'poi-ouline': '2.5', 'poi-over': '1.90', 'poi-under': '1.90', 'poi-your': '2.00', 'poi-legs': 'homewin' };
  const result = calcPoi(get(inputs), BASE_CFG);
  check('Poi football', result, {
    p: 0.5273646754471503, ev: 0.05472935089430053, kfull: 0.05472935089430053, kadj: 0.02,
    fair: 1.8962210526370662, confClass: 'high',
  });
}

console.log('10. Asia manual (50/20/10/10/10, your=2.00)...');
{
  const inputs = { 'asia-mode': 'manual', 'asia-your': '2.00', 'asia-pwin': '50', 'asia-phwin': '20', 'asia-ppush': '10', 'asia-phloss': '10', 'asia-ploss': '10' };
  const result = calcAsia(get(inputs), BASE_CFG);
  check('Asia manual', result, {
    p: 0.6, ev: 0.45, kfull: 0.6666666666666667, kadj: 0.05,
    fair: null, confClass: 'mid',
  });
}

console.log('11. Asia total (cal=2.5, O/U 1.85/1.95, line=2.5, over, your=2.00)...');
{
  const inputs = { 'asia-mode': 'total', 'asia-your': '2.00', 'asia-cal-line': '2.5', 'asia-over-ref': '1.85', 'asia-under-ref': '1.95', 'asia-line': '2.5', 'asia-side': 'over' };
  const result = calcAsia(get(inputs), BASE_CFG);
  check('Asia total', result, {
    p: 0.5138911737741702, ev: 0.02778234754834019, kfull: 0.027782347548340136, kadj: 0.02,
    fair: null, confClass: 'high',
  });
}

if (!process.exitCode) {
  console.log('\nAll 11 snapshots match.');
}
