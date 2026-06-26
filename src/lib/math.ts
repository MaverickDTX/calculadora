import type { BoostType, UncertaintyClass } from '../types';

export function numDec(v: string | number | undefined): number {
  const s = String(v ?? '').trim();
  if (!s) return NaN;
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return parseFloat(s);
}

// Odds de uma perna da Combinada são separadas por ',' e o decimal é PONTO ("1.53",
// padrão das casas) — a entrada normaliza vírgula→ponto, então não há colisão. Este
// helper padroniza em ponto e recupera o formato LEGADO (vírgula decimal + vírgula
// delimitadora, ex.: "1,53,2,37") regrupando os tokens por nWays.
export function splitComboOdds(seg: string, nWays: number): string[] {
  if (!seg) return [];
  const toks = seg.split(',');
  if (nWays > 1 && toks.length === nWays * 2) {
    const out: string[] = [];
    for (let i = 0; i < toks.length; i += 2) out.push(`${toks[i]}.${toks[i + 1]}`);
    return out;
  }
  return toks.map(o => o.replace(/,/g, '.'));
}

export function numMoney(v: string | number | undefined): number {
  const s = String(v ?? '').trim();
  if (!s) return NaN;
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, ''));
  return parseFloat(s);
}

export function fpct(x: number, d = 2): string {
  if (!Number.isFinite(x)) return '—';
  return (x * 100).toFixed(d).replace('.', ',') + '%';
}

export function fbrl(x: number): string {
  if (!Number.isFinite(x)) return '—';
  return 'R$ ' + x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fnum(x: number, d = 3): string {
  if (!Number.isFinite(x)) return '—';
  return x.toFixed(d).replace('.', ',');
}

export function confRank(c: string): number {
  return c === 'high' ? 3 : c === 'mid' ? 2 : 1;
}

export function minConf(a: string, b: string): string {
  return confRank(a) <= confRank(b) ? a : b;
}

export function confFactor(c: string, confAdj: string): number {
  if (confAdj === 'off') return 1;
  return c === 'high' ? 1 : c === 'mid' ? 0.6 : 0.35;
}

export function gridStake(frac: number, bank: number, unit: number): { units: number; rawUnits: number; reais: number; pct: number } {
  const reaisRaw = frac * bank;
  const rawUnits = reaisRaw / unit;
  const units = Math.round(rawUnits / 0.25) * 0.25;
  return { units, rawUnits, reais: units * unit, pct: bank > 0 ? (units * unit) / bank : 0 };
}

export function tick(o: number): number {
  if (o < 2) return 0.01;
  if (o < 3) return 0.02;
  if (o < 4) return 0.05;
  if (o < 6) return 0.10;
  if (o < 10) return 0.25;
  if (o < 15) return 0.50;
  return 1;
}

export function readPctInput(v: string): number {
  let x = numDec(v);
  if (!Number.isFinite(x) || x < 0) x = 0;
  return x / 100;
}

export function pctInput(x: number): string {
  return Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '';
}

// ERF / Normal distribution helpers
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function normPpf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= 1 - pl) {
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

export function bisect(f: (x: number) => number, lo: number, hi: number, iter = 100): number {
  let flo = f(lo);
  for (let i = 0; i < iter; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-12) return mid;
    if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}

// De-vig methods
export function devigProp(odds: number[]): number[] {
  const q = odds.map(o => 1 / o);
  const S = q.reduce((a, b) => a + b, 0);
  return q.map(x => x / S);
}

export function devigProbit(odds: number[]): number[] {
  const z = odds.map(o => normPpf(1 / o));
  const s = bisect(s => z.reduce((a, zi) => a + normCdf(zi - s), 0) - 1, -6, 6);
  return z.map(zi => normCdf(zi - s));
}

export function devigLog(odds: number[]): number[] {
  const q = odds.map(o => 1 / o);
  const n = bisect(n => q.reduce((a, qi) => a + Math.pow(qi, n), 0) - 1, 0.01, 12);
  return q.map(qi => Math.pow(qi, n));
}

export function devigShin(odds: number[]): number[] {
  const b = odds.map(o => 1 / o);
  const B = b.reduce((a, x) => a + x, 0);
  if (B <= 1) return b.map(x => x / B);
  const pOf = (z: number) => b.map(bi => (Math.sqrt(z * z + 4 * (1 - z) * bi * bi / B) - z) / (2 * (1 - z)));
  const sumP = (z: number) => pOf(z).reduce((a, x) => a + x, 0);
  let lo = 0, hi = 0.9999, flo = sumP(lo) - 1;
  const fhi = sumP(hi) - 1;
  if (flo * fhi > 0) return b.map(x => x / B);
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2, fm = sumP(m) - 1;
    if (Math.abs(fm) < 1e-12) return pOf(m);
    if ((flo < 0) === (fm < 0)) { lo = m; flo = fm; } else hi = m;
  }
  return pOf((lo + hi) / 2);
}

export function devigScales(odds: number[]) {
  return {
    prop: devigProp(odds),
    probit: devigProbit(odds),
    log: devigLog(odds),
    shin: devigShin(odds),
  };
}

export function defaultScaleForLegs(nWays: number): 'probit' | 'log' {
  return nWays >= 3 ? 'log' : 'probit';
}

export function recommendMethod(odds: number[]): { method: 'prop' | 'probit' | 'log' | 'shin'; why: string } {
  const n = odds.length;
  const b = odds.map(o => 1 / o);
  const B = b.reduce((a, x) => a + x, 0);
  const M = B - 1;
  const pn = b.map(x => x / B);
  const favP = Math.max(...pn);
  const longP = Math.min(...pn);
  let method: 'prop' | 'probit' | 'log' | 'shin', why: string;
  if (M > 0.07 && favP >= 0.65) {
    method = 'shin'; why = `margem alta (${(M * 100).toFixed(1)}%) e favorito forte (${(favP * 100).toFixed(0)}%): cenário típico de proteção contra insiders → Shin.`;
  } else if (n >= 3 && favP < 0.55) {
    method = 'log'; why = `campo equilibrado de ${n} vias sem favorito dominante: a escala log/power calibra melhor a cauda de azarões.`;
  } else if (longP < 0.12) {
    method = 'shin'; why = `presença de azarão extremo (${(longP * 100).toFixed(1)}%): Shin corrige o viés favorito-azarão de forma mais agressiva.`;
  } else {
    method = 'probit'; why = 'binário/moderado sem cauda extrema: a escala probit (normal-quantil) tende a calibrar bem favoritos moderados.';
  }
  return { method, why };
}

export function devigN(refs: number[], method: string): { p: number; probs: number[]; M: number | null; fb: boolean; usedMethod?: string; autoWhy?: string | null; autoRec?: string | null } {
  const q = refs.map(o => 1 / o);
  const S = q.reduce((a, b) => a + b, 0);
  const M = S - 1;
  const n = refs.length;
  if (n === 1) return { p: q[0], probs: q, M: null, fb: false };

  let usedMethod = method;
  let autoWhy: string | null = null;
  let autoRec: string | null = null;

  if (method === 'auto') {
    const r = recommendMethod(refs);
    autoRec = r.method;
    autoWhy = r.why;
    usedMethod = r.method;
  }

  if (usedMethod === 'prop') {
    return { p: q[0] / S, probs: q.map(x => x / S), M, fb: false, usedMethod, autoWhy, autoRec };
  }
  if (usedMethod === 'probit') {
    try {
      const probs = devigProbit(refs);
      return { p: probs[0], probs, M, fb: false, usedMethod, autoWhy, autoRec };
    } catch {
      return { p: q[0] / S, probs: q.map(x => x / S), M, fb: true, usedMethod, autoWhy, autoRec };
    }
  }
  if (usedMethod === 'log') {
    try {
      const probs = devigLog(refs);
      return { p: probs[0], probs, M, fb: false, usedMethod, autoWhy, autoRec };
    } catch {
      return { p: q[0] / S, probs: q.map(x => x / S), M, fb: true, usedMethod, autoWhy, autoRec };
    }
  }
  if (usedMethod === 'shin') {
    try {
      const probs = devigShin(refs);
      if (probs.some(x => !(x > 0))) throw 0;
      return { p: probs[0], probs, M, fb: false, usedMethod, autoWhy, autoRec };
    } catch {
      return { p: q[0] / S, probs: q.map(x => x / S), M, fb: true, usedMethod, autoWhy, autoRec };
    }
  }

  const adjusted = q.map(x => x - M / n);
  if (adjusted.some(x => x <= 0)) {
    return { p: q[0] / S, probs: q.map(x => x / S), M, fb: true, usedMethod, autoWhy, autoRec };
  }
  return { p: adjusted[0], probs: adjusted, M, fb: false, usedMethod, autoWhy, autoRec };
}

export function boostOdd(o: number, t: BoostType, v: number): number {
  if (t === 'profit') return 1 + (1 + v / 100) * (o - 1);
  if (t === 'mult') return o * (1 + v / 100);
  return o;
}

export function binaryBet(p: number, odd: number): { returns: { p: number; net: number }[]; ev: number; kfull: number; b: number } {
  const b = odd - 1;
  const ev = p * odd - 1;
  const kfull = ev > 0 ? ev / b : 0;
  return { returns: [{ p, net: b }, { p: 1 - p, net: -1 }], ev, kfull, b };
}

export function evReturns(ret: { p: number; net: number }[]): number {
  return ret.reduce((a, r) => a + r.p * r.net, 0);
}

export function growthRet(s: number, ret: { p: number; net: number }[]): number {
  if (s < 0) return -Infinity;
  let g = 0;
  for (const r of ret) {
    const z = 1 + s * r.net;
    if (z <= 0) return -Infinity;
    g += r.p * Math.log(z);
  }
  return g;
}

export function kellyReturns(ret: { p: number; net: number }[]): number {
  const ev = evReturns(ret);
  if (ev <= 0) return 0;
  const minNet = Math.min(...ret.map(r => r.net));
  const maxS = minNet < 0 ? Math.min(0.999 / (-minNet), 0.999) : 0.999;
  function deriv(s: number) {
    return ret.reduce((a, r) => a + r.p * r.net / (1 + s * r.net), 0);
  }
  if (deriv(maxS) > 0) return maxS;
  let lo = 0, hi = maxS;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (deriv(m) > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

export function normalizeReturns(ret: { p: number; net: number; label?: string }[]): { p: number; net: number; label: string }[] {
  const s = ret.reduce((a, r) => a + r.p, 0);
  return ret.filter(r => r.p > 1e-12).map(r => ({ p: r.p / s, net: r.net, label: r.label || '' }));
}

export function classifyUncertainty(points: { label: string; ev: number }[], edgemin: number): { key: UncertaintyClass; label: string; color: string; soft: string; desc: string } {
  const evs = points.map(p => p.ev);
  const lo = Math.min(...evs), hi = Math.max(...evs);
  if (hi < 0) return { key: 'low', label: 'Sem valor', color: 'var(--red)', soft: 'var(--red-soft)', desc: 'Todas as escalas dão EV negativo.' };
  if (lo >= (edgemin || 0)) return { key: 'high', label: 'Robusto', color: 'var(--green)', soft: 'var(--green-soft)', desc: 'Todas as escalas acima do edge mínimo — sinal consistente.' };
  return { key: 'mid', label: 'Frágil', color: 'var(--amber)', soft: 'var(--amber-soft)', desc: 'A faixa cruza o zero/edge — o sinal depende da escala de de-vig.' };
}

const DIV_FACTORS: Record<string, number> = { high: 1.0, mid: 0.6, low: 1.0 };

export function divergenceFactor(evPoints: { label: string; ev: number }[] | null, confAdj: string): { factor: number; cls: { key: UncertaintyClass; label: string; color: string; soft: string; desc: string } | null } {
  if (!evPoints || evPoints.length < 2) return { factor: 1, cls: null };
  if (confAdj === 'off') return { factor: 1, cls: null };
  const cls = classifyUncertainty(evPoints, 0);
  return { factor: DIV_FACTORS[cls.key] ?? 1, cls };
}

// Poisson helpers
export function poisPmf(k: number, lam: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return Math.exp(-lam) * Math.pow(lam, k) / f;
}

export function dcTau(i: number, j: number, lh: number, la: number, rho: number): number {
  if (i === 0 && j === 0) return 1 - lh * la * rho;
  if (i === 0 && j === 1) return 1 + lh * rho;
  if (i === 1 && j === 0) return 1 + la * rho;
  if (i === 1 && j === 1) return 1 - rho;
  return 1;
}

export function scoreMatrix(lh: number, la: number, rho: number, kmax = 12): number[][] {
  const P: number[][] = [];
  let s = 0;
  for (let i = 0; i <= kmax; i++) {
    P[i] = [];
    for (let j = 0; j <= kmax; j++) {
      const v = poisPmf(i, lh) * poisPmf(j, la) * dcTau(i, j, lh, la, rho);
      P[i][j] = Math.max(0, v);
      s += P[i][j];
    }
  }
  for (let i = 0; i <= kmax; i++)
    for (let j = 0; j <= kmax; j++)
      P[i][j] /= s;
  return P;
}

export function matMarkets(P: number[][]): { pH: number; pD: number; pA: number } {
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++) {
      const p = P[i][j];
      if (i > j) pH += p;
      else if (i === j) pD += p;
      else pA += p;
    }
  return { pH, pD, pA };
}

export function matOver(P: number[][], line: number): number {
  let o = 0;
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++)
      if (i + j > line) o += P[i][j];
  return o;
}

export function fitLambdas(pH_t: number, pD_t: number, pA_t: number, line: number, over_t: number, rho: number): { e: number; lh: number; la: number } {
  let best: { e: number; lh: number; la: number } | null = null;
  for (let lh = 0.2; lh <= 3.6; lh += 0.05) {
    for (let la = 0.2; la <= 3.6; la += 0.05) {
      const P = scoreMatrix(lh, la, rho, 10);
      const m = matMarkets(P);
      const o = matOver(P, line);
      const e = (m.pH - pH_t) ** 2 + (m.pD - pD_t) ** 2 + (m.pA - pA_t) ** 2 + (o - over_t) ** 2;
      if (!best || e < best.e) best = { e, lh, la };
    }
  }
  const b = best!;
  for (let lh = b.lh - 0.06; lh <= b.lh + 0.06; lh += 0.015) {
    for (let la = b.la - 0.06; la <= b.la + 0.06; la += 0.015) {
      if (lh <= 0 || la <= 0) continue;
      const P = scoreMatrix(lh, la, rho, 12);
      const m = matMarkets(P);
      const o = matOver(P, line);
      const e = (m.pH - pH_t) ** 2 + (m.pD - pD_t) ** 2 + (m.pA - pA_t) ** 2 + (o - over_t) ** 2;
      if (e < best!.e) best = { e, lh, la };
    }
  }
  return best!;
}

export function playerProb(P: number[][], theta: number, side: 'home' | 'away'): number {
  let t = 0;
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++) {
      const n = side === 'home' ? i : j;
      t += P[i][j] * (1 - Math.pow(1 - theta, n));
    }
  return t;
}

export function solveTheta(P: number[][], target: number, side: 'home' | 'away'): number {
  let lo = 1e-6, hi = 0.999;
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (playerProb(P, m, side) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function splitAsianLine(L: number): [number, number] {
  const int = Math.floor(L);
  const frac = +(L - int).toFixed(2);
  if (Math.abs(frac - 0.25) < 0.001) return [int, int + 0.5];
  if (Math.abs(frac - 0.75) < 0.001) return [int + 0.5, int + 1];
  return [L, L];
}

export function settleTotal(g: number, line: number, side: 'over' | 'under', odd: number): number {
  if (side === 'over') {
    if (g > line) return odd - 1;
    if (Math.abs(g - line) < 1e-9) return 0;
    return -1;
  } else {
    if (g < line) return odd - 1;
    if (Math.abs(g - line) < 1e-9) return 0;
    return -1;
  }
}

export function settleHandicap(diff: number, line: number, side: 'home' | 'away', odd: number): number {
  const d = side === 'home' ? diff : -diff;
  const adj = d + line;
  if (adj > 1e-9) return odd - 1;
  if (Math.abs(adj) < 1e-9) return 0;
  return -1;
}

export function diffDistribution(P: number[][]): Map<number, number> {
  const map = new Map<number, number>();
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < P.length; j++) {
      const d = i - j, p = P[i][j];
      map.set(d, (map.get(d) || 0) + p);
    }
  return map;
}

export function probTotalOver(line: number, lam: number): number {
  let s = 0, seen = 0;
  for (let g = 0; g <= 24; g++) {
    const pg = poisPmf(g, lam);
    seen += pg;
    if (g > line) s += pg;
  }
  if (line < 25) s += Math.max(0, 1 - seen);
  return Math.min(1, s);
}

export function fitLambdaTotal(line: number, pOver: number): number {
  let lo = 0.05, hi = 7;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (probTotalOver(line, m) < pOver) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function poissonSample(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export function cornerOverProb(line: number, lam: number): number {
  const KMAX = 60;
  let s = 0, seen = 0;
  for (let k = 0; k <= KMAX; k++) {
    const pk = poisPmf(k, lam);
    seen += pk;
    if (k > line) s += pk;
  }
  s += Math.max(0, 1 - seen);
  return Math.min(1, s);
}

export function fitCornerTotal(line: number, pOver: number): number {
  let lo = 0.5, hi = 30;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (cornerOverProb(line, m) < pOver) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function cornerLambdaEff(base: number, gTeam: number, lamTeam: number, beta: number): number {
  if (!(lamTeam > 0)) return Math.max(0.05, base);
  const f = 1 + beta * (gTeam - lamTeam) / lamTeam;
  return Math.max(0.05, base * f);
}

export function poisTotalProb(lam: number, kind: 'over' | 'under', line: number): number {
  const KMAX = 60;
  let cum = 0, seen = 0;
  for (let k = 0; k <= KMAX; k++) {
    const pk = poisPmf(k, lam);
    seen += pk;
    if (kind === 'over') { if (k > line) cum += pk; }
    else { if (k < line) cum += pk; }
  }
  if (kind === 'over') cum += Math.max(0, 1 - seen);
  return Math.min(1, Math.max(0, cum));
}

export function cornerSideProb(lh: number, la: number, side: 'home' | 'draw' | 'away'): number {
  const KMAX = 40;
  let pHome = 0, pDraw = 0;
  const pa: number[] = [];
  for (let b = 0; b <= KMAX; b++) pa[b] = poisPmf(b, la);
  for (let a = 0; a <= KMAX; a++) {
    const pha = poisPmf(a, lh);
    for (let b2 = 0; b2 <= KMAX; b2++) {
      const pp = pha * pa[b2];
      if (a > b2) pHome += pp;
      else if (a === b2) pDraw += pp;
    }
  }
  const pAway = Math.max(0, 1 - pHome - pDraw);
  if (side === 'home') return pHome;
  if (side === 'draw') return pDraw;
  if (side === 'away') return pAway;
  return 0;
}

export function fitCornerSplitFrom1x2(lamTot: number, pHome: number, pAway: number): number {
  let best: { e: number; fH: number } | null = null;
  for (let fH = 0.20; fH <= 0.80; fH += 0.005) {
    const lh = lamTot * fH, la = lamTot * (1 - fH);
    const ph = cornerSideProb(lh, la, 'home'), pa = cornerSideProb(lh, la, 'away');
    const e = (ph - pHome) * (ph - pHome) + (pa - pAway) * (pa - pAway);
    if (!best || e < best.e) best = { e, fH };
  }
  return best!.fH;
}

export function fitMuFromLadder(vals: (number | undefined)[]): number | null {
  const pGe: number[] = [];
  for (let i = 0; i < vals.length; i++) {
    if (vals[i]! > 1) pGe.push(1 / vals[i]!);
    else break;
  }
  if (pGe.length === 0) return null;
  if (pGe.length === 1) {
    const p1 = Math.min(pGe[0], 0.9999);
    return -Math.log(1 - p1);
  }
  const disc: number[] = [1 - pGe[0]];
  for (let k = 0; k < pGe.length - 1; k++) disc.push(pGe[k] - pGe[k + 1]);
  disc.push(pGe[pGe.length - 1]);
  const S = disc.reduce((a, b) => a + b, 0);
  if (S <= 0) return null;
  const nd = disc.map(p => p / S);
  let mu = 0;
  for (let k = 0; k < nd.length - 1; k++) mu += k * nd[k];
  mu += (nd.length - 0.5) * nd[nd.length - 1];
  return mu;
}

export function fitCornerLambdas(cfg: { method: string }, lgH: number, lgA: number, getVal: (id: string) => string | undefined): { lcH: number; lcA: number; lamTot: number; line: number; pOver: number; splitSrc: string } | null {
  const line = numDec(getVal('poi-c-line') ?? '');
  const over = numDec(getVal('poi-c-over') ?? '');
  const under = numDec(getVal('poi-c-under') ?? '');
  if (!(over > 1 && under > 1 && line > 0)) return null;
  const pOver = devigN([over, under], cfg.method).p;
  const lamTot = fitCornerTotal(line, pOver);
  if (!(lamTot > 0)) return null;
  const c1 = numDec(getVal('poi-c-1') ?? '');
  const cx = numDec(getVal('poi-c-x') ?? '');
  const c2 = numDec(getVal('poi-c-2') ?? '');
  let fH: number, splitSrc: string;
  if (c1 > 1 && cx > 1 && c2 > 1) {
    const dv = devigN([c1, cx, c2], cfg.method).probs;
    fH = fitCornerSplitFrom1x2(lamTot, dv[0], dv[2]);
    splitSrc = '1X2 de escanteios';
  } else {
    const tot = lgH + lgA;
    fH = tot > 0 ? lgH / tot : 0.5;
    splitSrc = 'domínio de gols';
  }
  return { lcH: lamTot * fH, lcA: lamTot * (1 - fH), lamTot, line, pOver, splitSrc };
}
