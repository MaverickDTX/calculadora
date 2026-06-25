import { useMemo } from 'react';
import type { Config, BetResult, Sensitivity, SensitivityInfo, EvPoint, ReturnState } from '../types';
import {
  numDec, readPctInput, confFactor, boostOdd, binaryBet, evReturns, kellyReturns,
  normalizeReturns, devigN, devigScales, defaultScaleForLegs,
  divergenceFactor, tick,
  scoreMatrix, fitLambdas, solveTheta,
  splitAsianLine, settleTotal, settleHandicap, diffDistribution,
  probTotalOver, fitLambdaTotal, cornerLambdaEff, poisTotalProb, cornerSideProb,
  fitCornerLambdas, fitMuFromLadder,
} from '../lib/math';

function calcSensitivity(B: {
  sens: Sensitivity | null;
  refEval: number;
  yourEff: number;
  base?: { ev: number; kfull: number } | null;
  cfg: Config;
}): SensitivityInfo {
  const s = B.sens;
  if (!s || !s.refEval) return { factor: 1, html: '', status: 'none' };
  const t = tick(s.refEval);

  const evalAt = (nr: number) => {
    let p: number | null = null;
    if (s.type === 'nres' && s.refs) {
      const refs = [...s.refs];
      refs[0] = nr;
      p = devigN(refs, s.method || 'auto').p;
    } else if (s.type === 'propPair' && s.no) {
      p = devigN([nr, s.no], s.method || 'auto').p;
    } else if (s.type === 'proxy' && s.margin !== undefined) {
      p = (1 / nr) / (1 + s.margin);
    } else if (s.type === 'combo') {
      p = 1 / nr;
    } else if (s.type === 'aub' && s.refs && s.discount !== undefined) {
      const refs = [...s.refs];
      refs[0] = nr;
      p = (1 - refs.reduce((a, o) => a * (1 - 1 / o), 1)) * (1 - s.discount);
    }
    if (!(p && p > 0 && p < 1)) return null;
    const b = binaryBet(p, B.yourEff);
    return { nr, p, ev: b.ev, k: b.kfull };
  };

  const adverse = evalAt(s.refEval + t);
  const favorable = evalAt(Math.max(1.01, s.refEval - t));

  let factor = 1, status: 'ok' | 'mid' | 'bad' = 'ok', verdict = '';

  if (adverse) {
    if (adverse.ev <= 0) { factor = 0.35; status = 'bad'; verdict = 'Um tick adverso elimina o valor; stake reduzido fortemente.'; }
    else if (adverse.ev < B.cfg.edgemin) { factor = 0.65; status = 'mid'; verdict = 'Um tick adverso derruba o EV abaixo do mínimo; stake reduzido.'; }
    else { verdict = 'O valor sobrevive a um tick adverso.'; }
  }

  const line = (x: typeof adverse) => !x ? '—' : (`Ref. ${x.nr.toFixed(3).replace('.', ',')} → EV ${x.ev >= 0 ? '+' : ''}${(x.ev * 100).toFixed(2).replace('.', ',')}% · Kelly cheio ${x.k > 0 ? (x.k * 100).toFixed(2).replace('.', ',') + '%' : '—'}`);

  const html = `<h3>Sensibilidade da referência (±1 tick = ${t.toFixed(2).replace('.', ',')})</h3>
<div class="row">${line(adverse)}</div>
<div class="row">${line(favorable)}</div>
<div class="verdict ${status === 'bad' ? 'bad' : status === 'mid' ? 'mid' : 'ok'}">${verdict}</div>`;

  return { factor, html, status };
}

function makeBetBase(args: {
  label: string;
  decomp: string;
  p: number | null;
  fair: number | null;
  your: number;
  M?: number | null;
  fb?: boolean;
  confClass: 'high' | 'mid' | 'low';
  confTxt: string;
  sens?: Sensitivity | null;
  saveable?: boolean;
  returns?: ReturnState[] | ((odd: number) => ReturnState[]);
  marginLabel?: string | null;
  warnings?: string[];
  evBand?: [number, number] | null;
  evPoints?: EvPoint[] | null;
  cfg: Config;
}): BetResult {
  const cfg = args.cfg;
  const yourEff = boostOdd(args.your, cfg.boostType, cfg.boostVal);

  let base: { returns: ReturnState[]; ev: number; kfull: number; b: number };
  const pVal = args.p;
  let fairVal = args.fair;

  if (args.returns) {
    const retInput = typeof args.returns === 'function' ? (args.returns as (odd: number) => ReturnState[])(yourEff) : args.returns;
    const scaled = normalizeReturns(retInput.map(r => ({ p: r.p, net: typeof r.net === 'function' ? (r.net as (odd: number) => number)(yourEff) : r.net, label: r.label })));
    const ev = evReturns(scaled);
    const kfull = kellyReturns(scaled);
    base = { returns: scaled, ev, kfull, b: Math.max(...scaled.map(r => r.net)) };
  } else {
    if (pVal && pVal > 0) {
      base = binaryBet(pVal, yourEff);
      fairVal = fairVal ?? (1 / pVal);
    } else {
      base = { returns: [], ev: -1, kfull: 0, b: 0 };
    }
  }

  const sensInfo = args.sens ? calcSensitivity({
    sens: args.sens,
    refEval: args.sens.refEval,
    yourEff,
    base: base.ev > 0 ? { ev: base.ev, kfull: base.kfull } : null,
    cfg,
  }) : { factor: 1, html: '', status: 'none' as const };

  const cf = confFactor(args.confClass, cfg.confAdj);
  const divInfo = divergenceFactor(args.evPoints || null, cfg.confAdj);
  const df = divInfo.factor;

  let kadj = base.kfull * cfg.frac * cf * sensInfo.factor * df;

  if (args.confClass === 'high' && sensInfo.factor >= 1 && df >= 1 && kadj > 0 && kadj < Math.min(cfg.floor, base.kfull)) {
    kadj = Math.min(cfg.floor, base.kfull);
  }
  kadj = Math.min(kadj, cfg.cap, base.kfull);
  if (base.ev < cfg.edgemin) kadj = 0;

  return {
    label: args.label,
    decomp: args.decomp,
    p: pVal,
    fair: fairVal,
    your: args.your,
    yourEff,
    boosted: yourEff !== args.your,
    M: args.M ?? null,
    fb: args.fb ?? false,
    confClass: args.confClass,
    confTxt: args.confTxt,
    sens: args.sens || null,
    sensInfo,
    divInfo: { factor: divInfo.factor, cls: divInfo.cls },
    saveable: args.saveable ?? false,
    returns: base.returns,
    ev: base.ev,
    kfull: base.kfull,
    kadj,
    b: base.b,
    cfg,
    marginLabel: args.marginLabel || null,
    warnings: args.warnings || [],
    evBand: args.evBand || null,
    evPoints: args.evPoints || null,
  };
}

export function useCalculator(inputs: Record<string, string>, cfg: Config, activeTab: string): { result: BetResult | { err: string } | null; recompute: () => void } {
  const result = useMemo(() => {
    const get = (id: string) => inputs[id] ?? '';

    switch (activeTab) {
      case 'nres': return calcNres(get, cfg);
      case 'props': return calcProps(get, cfg);
      case 'proxy': return calcProxy(get, cfg);
      case 'aub': return calcAub(get, cfg);
      case 'combo': return calcCombo(get, cfg);
      case 'poi': return calcPoi(get, cfg);
      case 'asia': return calcAsia(get, cfg);
      default: return null;
    }
  }, [inputs, cfg, activeTab]);

  return { result, recompute: () => {} };
}

function calcNres(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const ev = numDec(get('nres-eval'));
  const your = numDec(get('nres-your'));
  const othersRaw = get('nres-others');
  const others = othersRaw ? othersRaw.split(',').map(s => numDec(s.trim())).filter(o => o > 1) : [];

  if (!(ev > 1 && your > 1)) return { err: 'Preencha o resultado 1 e a sua odd (>1).' };
  if (others.length < 1) return { err: 'Adicione ao menos uma odd dos demais resultados.' };

  const refs = [ev, ...others];
  const dv = devigN(refs, cfg.method);

  return makeBetBase({
    label: 'N resultados',
    decomp: `${get('nres-name') || 'Mercado'} · ${refs.length} vias · lado avaliado ${ev.toFixed(3).replace('.', ',')}`,
    p: dv.p,
    fair: 1 / dv.p,
    your,
    M: dv.M,
    fb: dv.fb,
    confClass: 'high',
    confTxt: `Alta confiança — de-vig real de mercado completo com ${refs.length} vias.`,
    sens: { type: 'nres', refEval: ev, refs, method: cfg.method },
    saveable: true,
    cfg,
  });
}

function calcProps(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const yes = numDec(get('prop-ref-yes'));
  const no = numDec(get('prop-ref-no'));
  const your = numDec(get('prop-your'));
  const evalNo = get('prop-side-no') === 'true';
  const evalOdd = evalNo ? no : yes;
  const otherOdd = evalNo ? yes : no;
  const marginOn = get('prop-margin-on') === 'true';

  if (!(evalOdd > 1 && your > 1)) return { err: 'Preencha a referência e a sua odd (>1).' };
  if (!(otherOdd > 1) && !marginOn) return { err: 'Preencha a referência do lado contrário ou marque "Usar margem presumida".' };

  let p: number, confClass: 'high' | 'mid' | 'low', txt: string, sens: Sensitivity | undefined;
  let dec: string;

  if (otherOdd > 1) {
    const pair = evalNo ? [no, yes] : [yes, no];
    const dv = devigN(pair, cfg.method);
    p = dv.p;
    confClass = 'high';
    txt = 'Alta confiança — Sim/Não ou Over/Under com de-vig real.';
    sens = { type: 'propPair', refEval: evalOdd, no: otherOdd, method: cfg.method };
    dec = `par sharp ${evalOdd.toFixed(3).replace('.', ',')} / ${otherOdd.toFixed(3).replace('.', ',')}`;
  } else {
    const mg = readPctInput(get('prop-margin') || '5,0');
    p = (1 / evalOdd) / (1 + mg);
    confClass = 'mid';
    txt = 'Confiança média — só um lado, com margem presumida por família.';
    sens = { type: 'proxy', refEval: evalOdd, margin: mg };
    dec = `só lado ${evalOdd.toFixed(3).replace('.', ',')} · margem presumida`;
  }

  const typeName = get('prop-type') === 'simnao' ? 'Sim/Não' : get('prop-type') === 'ou' ? 'Over/Under' : 'Prop';
  const sideTag = evalNo ? ' (Não/Under)' : '';

  return makeBetBase({
    label: 'Props Sim/Não',
    decomp: `${typeName}${sideTag} · ${dec}`,
    p,
    fair: 1 / p,
    your,
    confClass,
    confTxt: txt,
    sens,
    saveable: true,
    cfg,
  });
}

function calcProxy(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const mode = get('proxy-mode');
  if (mode === 'single') {
    const ref = numDec(get('proxy-ref'));
    const your = numDec(get('proxy-your'));
    const mg = readPctInput(get('proxy-margin') || '5,0');
    if (!(ref > 1 && your > 1)) return { err: 'Preencha referência e sua odd (>1).' };
    const p = (1 / ref) / (1 + mg);
    return makeBetBase({
      label: 'Proxy',
      decomp: `referência ${ref.toFixed(3).replace('.', ',')} · margem presumida`,
      p,
      fair: 1 / p,
      your,
      confClass: 'mid',
      confTxt: 'Confiança média — referência única com margem presumida por família.',
      sens: { type: 'proxy', refEval: ref, margin: mg },
      saveable: true,
      cfg,
    });
  }

  const your = numDec(get('proxy-cons-your'));
  const mg = readPctInput(get('proxy-cons-margin') || '5,0');
  if (!(your > 1)) return { err: 'Preencha a sua odd (>1).' };

  const oddsRaw = get('proxy-cons-odds');
  const odds = oddsRaw ? oddsRaw.split(',').map(s => numDec(s.trim())).filter(o => o > 1) : [];
  if (odds.length < 1) return { err: 'Adicione ao menos uma casa não-alvo.' };

  const pi = odds.reduce((a, c) => a + 1 / c, 0) / odds.length;
  const p = pi / (1 + mg);

  return makeBetBase({
    label: 'Consenso',
    decomp: `consenso de ${odds.length} casa(s) · margem presumida`,
    p,
    fair: 1 / p,
    your,
    confClass: 'low',
    confTxt: 'Baixa confiança — consenso/proxy, sensível a seleção de casas.',
    saveable: true,
    cfg,
  });
}

function calcAub(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const oddsRaw = get('aub-odds');
  const refs = oddsRaw ? oddsRaw.split(',').map(s => numDec(s.trim())).filter(o => o > 1) : [];
  const your = numDec(get('aub-your'));
  let disc = numDec(get('aub-discount'));
  if (!Number.isFinite(disc) || disc < 0) disc = 0;
  disc = Math.min(disc, 50) / 100;

  if (refs.length < 2) return { err: 'Preencha ao menos duas seleções.' };
  if (!(your > 1)) return { err: 'Preencha a sua odd (>1).' };

  const p0 = 1 - refs.reduce((a, o) => a * (1 - 1 / o), 1);
  const p = p0 * (1 - disc);

  return makeBetBase({
    label: 'A ou B',
    decomp: `${refs.length} seleções · p independente ${(p0 * 100).toFixed(1).replace('.', ',')}% · desconto ${(disc * 100).toFixed(1).replace('.', ',')}%`,
    p,
    fair: 1 / p,
    your,
    confClass: 'mid',
    confTxt: 'Confiança média — aproximação independente com desconto de correlação/incerteza.',
    sens: { type: 'aub', refEval: refs[0], refs, discount: disc },
    saveable: true,
    cfg,
  });
}

function calcCombo(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const your = numDec(get('combo-your'));
  if (!(your > 1)) return { err: 'Preencha a sua odd (>1).' };

  const legsRaw = get('combo-legs');
  if (!legsRaw) return { err: 'Adicione ao menos uma perna com as odds de tela.' };

  const legs = legsRaw.split(';').map(legStr => {
    const parts = legStr.split('|');
    return {
      nWays: parseInt(parts[0]),
      sideIdx: parseInt(parts[1]),
      odds: parts[2].split(',').map(s => numDec(s)),
    };
  });

  if (legs.some(l => l.odds.some(o => !(o > 1)))) return { err: 'Preencha todas as odds de todas as pernas (>1).' };

  const legData = legs.map(l => {
    const scales = devigScales(l.odds);
    const defScale = defaultScaleForLegs(l.nWays);
    return {
      ...l,
      pDef: scales[defScale][l.sideIdx],
      pProp: scales.prop[l.sideIdx],
      pProbit: scales.probit[l.sideIdx],
      pLog: scales.log[l.sideIdx],
      pShin: scales.shin[l.sideIdx],
    };
  });

  const jointProp = legData.reduce((a, l) => a * l.pProp, 1);
  const jointProbit = legData.reduce((a, l) => a * l.pProbit, 1);
  const jointLog = legData.reduce((a, l) => a * l.pLog, 1);
  const jointShin = legData.reduce((a, l) => a * l.pShin, 1);
  const jointDef = legData.reduce((a, l) => a * l.pDef, 1);

  const yourEff = boostOdd(your, cfg.boostType, cfg.boostVal);
  const evOf = (j: number) => j * yourEff - 1;
  const evProp = evOf(jointProp), evProbit = evOf(jointProbit), evLog = evOf(jointLog), evShin = evOf(jointShin), evDef = evOf(jointDef);

  const evBand: [number, number] = [Math.min(evProp, evProbit, evLog, evShin), Math.max(evProp, evProbit, evLog, evShin)];
  const evPoints: EvPoint[] = [
    { label: 'prop', ev: evProp },
    { label: 'probit', ev: evProbit },
    { label: 'log', ev: evLog },
    { label: 'Shin', ev: evShin },
  ];

  let verdict: string, confClass: 'high' | 'mid' | 'low', confTxt: string;
  const scaleLabels = `prop ${(evProp * 100).toFixed(2).replace('.', ',')}% · probit ${(evProbit * 100).toFixed(2).replace('.', ',')}% · log ${(evLog * 100).toFixed(2).replace('.', ',')}% · Shin ${(evShin * 100).toFixed(2).replace('.', ',')}%`;

  if (evBand[1] < 0) {
    verdict = 'EV NEGATIVO'; confClass = 'low';
    confTxt = `Faixa de EV inteiramente negativa (${scaleLabels}). Sem valor em qualquer escala.`;
  } else if (evBand[0] >= cfg.edgemin) {
    verdict = 'VALUE CLARO'; confClass = 'high';
    confTxt = `Faixa de EV inteiramente positiva (${scaleLabels}). Sinal consistente nas quatro escalas.`;
  } else {
    verdict = 'FRONTEIRA'; confClass = 'mid';
    confTxt = `EV ≈ ${evDef >= 0 ? '+' : ''}${(evDef * 100).toFixed(2).replace('.', ',')}% mas faixa cruza ou é estreita (${scaleLabels}). Sinal depende da escala de de-vig.`;
  }

  const decomp = `${legData.length} perna(s) · conjunta prop ${(1 / jointProp).toFixed(3).replace('.', ',')} · probit ${(1 / jointProbit).toFixed(3).replace('.', ',')} · log ${(1 / jointLog).toFixed(3).replace('.', ',')} · Shin ${(1 / jointShin).toFixed(3).replace('.', ',')}`;

  return makeBetBase({
    label: `Combinada · ${verdict}`,
    decomp,
    p: jointDef,
    fair: 1 / jointDef,
    your,
    confClass,
    confTxt,
    saveable: false,
    evBand,
    evPoints,
    cfg,
  });
}

function calcPoi(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const h = numDec(get('poi-h'));
  const d = numDec(get('poi-d'));
  const a = numDec(get('poi-a'));
  const line = numDec(get('poi-ouline'));
  const over = numDec(get('poi-over'));
  const under = numDec(get('poi-under'));
  const your = numDec(get('poi-your'));
  let rho = numDec(get('poi-rho'));

  if (!(h > 1 && d > 1 && a > 1)) return { err: 'Preencha as três odds 1X2 (>1).' };
  if (!(over > 1 && under > 1 && line > 0)) return { err: 'Preencha linha e odds Over/Under (>1).' };
  if (!(your > 1)) return { err: 'Preencha sua odd (>1).' };
  if (!Number.isFinite(rho)) rho = -0.05;

  const warnings: string[] = [];
  if (rho < -0.15 || rho > 0.15) warnings.push('ρ fora da faixa conservativa [-0,15; 0,15].');

  const dv1 = devigN([h, d, a], cfg.method);
  const pH_t = dv1.probs[0], pD_t = dv1.probs[1], pA_t = dv1.probs[2];
  const over_t = devigN([over, under], cfg.method).p;

  const fit = fitLambdas(pH_t, pD_t, pA_t, line, over_t, rho);
  const P = scoreMatrix(fit.lh, fit.la, rho, 12);

  if (fit.e > 0.004) warnings.push('Erro residual alto no ajuste; trate o preço como estimativa frágil.');

  const legsRaw = get('poi-legs');
  const legs: Array<{
    kind: string; line?: number; side?: string; theta?: number;
    muProp?: number; beta?: number; lambdaTeam?: number;
    lcH?: number; lcA?: number; lgH?: number; lgA?: number;
    dir?: string; label: string;
  }> = [];
  let hasPlayer = false, hasCorner = false, legErr: string | null = null;

  const anyCorner = legsRaw ? legsRaw.includes('corner') : false;
  let cfit: ReturnType<typeof fitCornerLambdas> = null;
  if (anyCorner) {
    cfit = fitCornerLambdas(cfg, fit.lh, fit.la, get);
    if (!cfit) return { err: 'Há perna de escanteio: preencha a calibração de escanteios (linha + Over/Under corners >1).' };
  }

  if (legsRaw) {
    const legStrs = legsRaw.split(';');
    for (const legStr of legStrs) {
      const parts = legStr.split('|');
      const kind = parts[0];
      if (kind === 'player') {
        const side = parts[1] as 'home' | 'away';
        const od = numDec(parts[2]);
        const odn = numDec(parts[3]);
        if (!(od > 1)) { legErr = 'Preencha a odd Sim do jogador (>1).'; break; }
        const target = odn > 1 ? devigN([od, odn], cfg.method).p : 1 / od;
        const theta = solveTheta(P, target, side);
        legs.push({ kind: 'player', side, theta, label: `${side === 'home' ? 'Mandante' : 'Visitante'} jogador marca` });
        hasPlayer = true;
      } else if (kind === 'playerprop') {
        const ppSide = parts[13] as 'home' | 'away';
        const ppVals = [parts[8], parts[9], parts[10], parts[11], parts[12]].map(v => numDec(v));
        const ppMu = fitMuFromLadder(ppVals);
        if (!ppMu) { legErr = 'Preencha ao menos Over 0.5 para o prop do jogador.'; break; }
        let ppBeta = numDec(parts[14]);
        if (!Number.isFinite(ppBeta) || ppBeta < 0) ppBeta = 0.20;
        const ppLambda = ppSide === 'home' ? fit.lh : fit.la;
        let ppLine = numDec(parts[16]);
        if (!Number.isFinite(ppLine) || ppLine < 0) ppLine = 0.5;
        legs.push({ kind: 'playerprop', side: ppSide, muProp: ppMu, beta: ppBeta, lambdaTeam: ppLambda, line: ppLine, label: `${ppSide === 'home' ? 'Mandante' : 'Visitante'} prop jogador O${ppLine.toFixed(1).replace('.', ',')}` });
        hasPlayer = true;
      } else if (kind === 'cornerTotal' || kind === 'cornerTeam' || kind === 'cornerSide') {
        const cBeta = numDec(parts[1]) || 0.15;
        const common = { lcH: cfit!.lcH, lcA: cfit!.lcA, lgH: fit.lh, lgA: fit.la, beta: cBeta };
        if (kind === 'cornerTotal') {
          const cSide = parts[2] as 'over' | 'under';
          const cL = numDec(parts[3]);
          legs.push({ ...common, kind: 'cornerTotal', side: cSide, line: cL, label: `Escanteios totais ${cSide === 'over' ? 'Over' : 'Under'} ${cL?.toFixed(1).replace('.', ',')}` });
        } else if (kind === 'cornerTeam') {
          const tSide = parts[2] as 'home' | 'away';
          const tDir = parts[3] as 'over' | 'under';
          const cL = numDec(parts[4]);
          legs.push({ ...common, kind: 'cornerTeam', side: tSide, dir: tDir, line: cL, label: `${tSide === 'home' ? 'Mandante' : 'Visitante'} escanteios ${tDir === 'over' ? 'Over' : 'Under'} ${cL?.toFixed(1).replace('.', ',')}` });
        } else {
          const sDir = parts[2] as 'home' | 'draw' | 'away';
          legs.push({ ...common, kind: 'cornerSide', dir: sDir, label: `Escanteios 1X2 — ${sDir === 'home' ? 'Casa' : sDir === 'draw' ? 'Empate' : 'Visitante'}` });
        }
        hasCorner = true;
      } else {
        const lgLine = numDec(parts[1]);
        const hasLine = ['over', 'under', 'homeOver', 'homeUnder', 'awayOver', 'awayUnder'].includes(kind);
        legs.push({ kind, line: lgLine, label: `${kind}${hasLine ? ' ' + lgLine?.toFixed(2).replace('.', ',') : ''}` });
      }
    }
  }

  if (legErr) return { err: legErr };
  if (legs.length < 1) return { err: 'Adicione ao menos uma perna.' };

  function legAt(leg: typeof legs[0], i: number, j: number): number {
    switch (leg.kind) {
      case 'over': return (i + j > (leg.line || 0)) ? 1 : 0;
      case 'under': return (i + j < (leg.line || 0)) ? 1 : 0;
      case 'homewin': return (i > j) ? 1 : 0;
      case 'draw': return (i === j) ? 1 : 0;
      case 'awaywin': return (i < j) ? 1 : 0;
      case 'homeNoLose': return (i >= j) ? 1 : 0;
      case 'awayNoLose': return (i <= j) ? 1 : 0;
      case 'btts': return (i > 0 && j > 0) ? 1 : 0;
      case 'homeScores': return (i > 0) ? 1 : 0;
      case 'awayScores': return (j > 0) ? 1 : 0;
      case 'homeOver': return (i > (leg.line || 0)) ? 1 : 0;
      case 'homeUnder': return (i < (leg.line || 0)) ? 1 : 0;
      case 'awayOver': return (j > (leg.line || 0)) ? 1 : 0;
      case 'awayUnder': return (j < (leg.line || 0)) ? 1 : 0;
      case 'player': {
        const n = leg.side === 'home' ? i : j;
        return 1 - Math.pow(1 - (leg.theta || 0), n);
      }
      case 'playerprop': {
        const tg = leg.side === 'home' ? i : j;
        const mEff = (leg.muProp || 0) * (1 + (leg.beta || 0) * (tg - (leg.lambdaTeam || 0)) / (leg.lambdaTeam || 1));
        return poisTotalProb(Math.max(0.05, mEff), 'over', leg.line ?? 0.5);
      }
      case 'cornerTotal': {
        const lhE = cornerLambdaEff(leg.lcH || 0, i, leg.lgH || 0, leg.beta || 0);
        const laE = cornerLambdaEff(leg.lcA || 0, j, leg.lgA || 0, leg.beta || 0);
        return poisTotalProb(lhE + laE, leg.side as 'over' | 'under', leg.line || 0);
      }
      case 'cornerTeam': {
        const tgC = leg.side === 'home' ? i : j;
        const baseC = leg.side === 'home' ? leg.lcH : leg.lcA;
        const lamGC = leg.side === 'home' ? leg.lgH : leg.lgA;
        const lcE = cornerLambdaEff(baseC || 0, tgC, lamGC || 0, leg.beta || 0);
        return poisTotalProb(lcE, leg.dir as 'over' | 'under', leg.line || 0);
      }
      case 'cornerSide': {
        const lhS = cornerLambdaEff(leg.lcH || 0, i, leg.lgH || 0, leg.beta || 0);
        const laS = cornerLambdaEff(leg.lcA || 0, j, leg.lgA || 0, leg.beta || 0);
        return cornerSideProb(lhS, laS, leg.dir as 'home' | 'draw' | 'away');
      }
      default: return 1;
    }
  }

  function jointProb(Pm: number[][], legsArr: typeof legs): number {
    let t = 0;
    for (let i = 0; i < Pm.length; i++)
      for (let j = 0; j < Pm.length; j++) {
        let f = Pm[i][j];
        for (const lg of legsArr) f *= legAt(lg, i, j);
        t += f;
      }
    return t;
  }

  // Marginal de cada perna de prop: expõe o μ efetivo como probabilidade real
  // (integra a escada μ e o acoplamento β sobre a distribuição de placar) e
  // deixa visível na hora um μ calibrado errado.
  for (const lg of legs) {
    if (lg.kind !== 'playerprop') continue;
    let m = 0;
    for (let i = 0; i < P.length; i++)
      for (let j = 0; j < P.length; j++)
        m += P[i][j] * legAt(lg, i, j);
    const k = Math.round((lg.line ?? 0.5) + 0.5);
    lg.label += ` (μ ${(lg.muProp ?? 0).toFixed(2).replace('.', ',')}, P≥${k} ${(m * 100).toFixed(1).replace('.', ',')}%)`;
  }

  const p = jointProb(P, legs);
  if (!(p > 0 && p < 1)) return { err: 'Probabilidade conjunta inválida.' };

  const naive = legs.reduce((acc, lg) => {
    let s = 0;
    for (let i = 0; i < P.length; i++)
      for (let j = 0; j < P.length; j++)
        s += P[i][j] * legAt(lg, i, j);
    return acc * s;
  }, 1);

  const hasPP = legs.some(l => l.kind === 'playerprop');
  const hasCornerBeta = legs.some(l => l.kind === 'cornerTotal' || l.kind === 'cornerTeam' || l.kind === 'cornerSide');
  let evBandPoi: [number, number] | null = null;
  let evPointsPoi: EvPoint[] | null = null;

  if (hasPP || hasCornerBeta) {
    const betas = [0, 0.1, 0.2, 0.3, 0.4];
    const yourEff = boostOdd(your, cfg.boostType, cfg.boostVal);
    const couples = (l: typeof legs[0]) => l.kind === 'playerprop' || l.kind === 'cornerTotal' || l.kind === 'cornerTeam' || l.kind === 'cornerSide';
    const evsBeta = betas.map(b => {
      const lb = legs.map(l => couples(l) ? { ...l, beta: b } : l);
      return jointProb(P, lb) * yourEff - 1;
    });
    evBandPoi = [Math.min(...evsBeta), Math.max(...evsBeta)];
    evPointsPoi = betas.map((b, i) => ({ label: 'β' + b.toFixed(1).replace('.', ','), ev: evsBeta[i] }));
  }

  const conf = hasPlayer || hasCorner || warnings.length ? 'mid' : 'high';
  let txt: string;
  if (hasPP && hasCorner) txt = 'Inclui prop de jogador e escanteios com acoplamento β — faixa de EV sobre β∈[0;0,4] exibida. ';
  else if (hasCorner) txt = 'Inclui escanteios acoplados ao domínio do jogo (β) — correlação corner↔resultado não calibrada empiricamente; faixa de EV sobre β∈[0;0,4] exibida. ';
  else if (hasPP) txt = 'Inclui prop de jogador com acoplamento β — faixa de EV sobre β∈[0;0,4] exibida. ';
  else if (hasPlayer) txt = 'Confiança média — inclui perna de jogador por thinning. ';
  else txt = 'Alta confiança relativa — só pernas de placar no modelo. ';
  if (hasCorner) warnings.push('Escanteios via Poisson: tendem a ser levemente sobredispersos, então a cauda alta (Over linhas altas) pode ser subestimada. Trate como aproximação estruturada.');
  txt += `Produto ingênuo ${(naive * 100).toFixed(1).replace('.', ',')}%; modelo ${(p * 100).toFixed(1).replace('.', ',')}%.`;

  return makeBetBase({
    label: 'Bet Builder',
    decomp: `${legs.length} perna(s): ${legs.map(l => l.label).join(' + ')}`,
    p,
    fair: 1 / p,
    your,
    confClass: conf,
    confTxt: txt,
    warnings,
    saveable: true,
    evBand: evBandPoi,
    evPoints: evPointsPoi,
    cfg,
  });
}

function calcAsia(get: (id: string) => string, cfg: Config): BetResult | { err: string } {
  const mode = get('asia-mode');
  const your = numDec(get('asia-your'));
  if (!(your > 1)) return { err: 'Preencha a sua odd (>1).' };

  let retFactory: (odd: number) => ReturnState[];
  let desc = '';
  let pWinApprox: number | null = null;
  const warnings: string[] = [];
  const label = mode === 'handicap' ? 'Handicap asiático · Poisson/Dixon-Coles' : mode === 'total' ? 'Total asiático · Poisson' : 'Asiático / push';

  if (mode === 'manual') {
    const pwin = numDec(get('asia-pwin')) / 100;
    const phwin = numDec(get('asia-phwin')) / 100;
    const ppush = numDec(get('asia-ppush')) / 100;
    const phloss = numDec(get('asia-phloss')) / 100;
    const ploss = numDec(get('asia-ploss')) / 100;

    if (![pwin, phwin, ppush, phloss, ploss].every(v => Number.isFinite(v) && v >= 0)) {
      return { err: 'Preencha probabilidades válidas nos estados.' };
    }
    const sum = pwin + phwin + ppush + phloss + ploss;
    if (Math.abs(sum - 1) > 0.01) return { err: `Os estados manuais devem somar aproximadamente 100% (agora: ${(sum * 100).toFixed(1).replace('.', ',')}).` };

    retFactory = (odd: number) => [
      { p: pwin / sum, net: odd - 1, label: 'ganha cheio' },
      { p: phwin / sum, net: (odd - 1) / 2, label: 'ganha meio' },
      { p: ppush / sum, net: 0, label: 'push' },
      { p: phloss / sum, net: -0.5, label: 'perde meio' },
      { p: ploss / sum, net: -1, label: 'perde cheio' },
    ];
    pWinApprox = pwin + 0.5 * phwin;
    desc = `estados manuais · soma ${(sum * 100).toFixed(1).replace('.', ',')}%`;
  } else if (mode === 'handicap') {
    const h = numDec(get('asiah-h'));
    const d = numDec(get('asiah-d'));
    const a = numDec(get('asiah-a'));
    const ouline = numDec(get('asiah-ouline'));
    const over = numDec(get('asiah-over'));
    const under = numDec(get('asiah-under'));
    const line = numDec(get('asiah-line'));
    const side = get('asiah-side') as 'home' | 'away';
    let rho = numDec(get('asiah-rho'));

    if (!(h > 1 && d > 1 && a > 1)) return { err: 'Preencha as três odds 1X2 (>1).' };
    if (!(over > 1 && under > 1 && ouline > 0)) return { err: 'Preencha linha e odds Over/Under calibradoras (>1).' };
    if (!Number.isFinite(rho)) rho = -0.05;
    if (rho < -0.15 || rho > 0.15) warnings.push('ρ fora da faixa conservadora [-0,15; 0,15].');

    const dv1 = devigN([h, d, a], cfg.method);
    const over_t = devigN([over, under], cfg.method).p;
    const fit = fitLambdas(dv1.probs[0], dv1.probs[1], dv1.probs[2], ouline, over_t, rho);
    const P = scoreMatrix(fit.lh, fit.la, rho, 12);

    if (fit.e > 0.004) warnings.push('Erro residual alto no ajuste; trate o preço como estimativa frágil.');

    retFactory = (odd: number) => {
      const dist = diffDistribution(P);
      const parts = splitAsianLine(Math.abs(line)).map(v => line < 0 ? -v : v);
      const map = new Map<number, number>();
      for (const [diff, p] of dist.entries()) {
        let net = (settleHandicap(diff, parts[0], side, odd) + settleHandicap(diff, parts[1], side, odd)) / 2;
        net = Math.round(net * 1000000) / 1000000;
        map.set(net, (map.get(net) || 0) + p);
      }
      return [...map.entries()].map(([net, p]) => ({ p, net, label: String(net) }));
    };

    const dist = diffDistribution(P);
    const parts = splitAsianLine(Math.abs(line)).map(v => line < 0 ? -v : v);
    let pw = 0;
    for (const [diff, p] of dist.entries()) {
      const net = (settleHandicap(diff, parts[0], side, 2) + settleHandicap(diff, parts[1], side, 2)) / 2;
      if (net > 1e-9) pw += p;
    }
    pWinApprox = pw;
    desc = `${side === 'home' ? 'Casa ' : 'Fora '}${line > 0 ? '+' : ''}${line.toFixed(2).replace('.', ',')} · λ casa ${fit.lh.toFixed(2).replace('.', ',')} / λ fora ${fit.la.toFixed(2).replace('.', ',')} (Dixon-Coles ρ ${rho.toFixed(2).replace('.', ',')})`;
  } else {
    const cal = numDec(get('asia-cal-line'));
    const ov = numDec(get('asia-over-ref'));
    const un = numDec(get('asia-under-ref'));
    const line = numDec(get('asia-line'));
    const side = get('asia-side') as 'over' | 'under';

    if (!(cal > 0 && ov > 1 && un > 1 && line >= 0)) return { err: 'Preencha linha calibradora, Over/Under de referência e linha alvo.' };

    const pOver = devigN([ov, un], cfg.method).p;
    const lam = fitLambdaTotal(cal, pOver);

    retFactory = (odd: number) => {
      const parts = splitAsianLine(line);
      const map = new Map<number, number>();
      let rem = 1;
      for (let g = 0; g <= 24; g++) {
        const pg = Math.exp(-lam) * Math.pow(lam, g) / (g <= 1 ? 1 : g);
        rem -= pg;
        let net = (settleTotal(g, parts[0], side, odd) + settleTotal(g, parts[1], side, odd)) / 2;
        net = Math.round(net * 1000000) / 1000000;
        map.set(net, (map.get(net) || 0) + pg);
      }
      const tailG = 25;
      const tailNet = (settleTotal(tailG, parts[0], side, odd) + settleTotal(tailG, parts[1], side, odd)) / 2;
      map.set(tailNet, (map.get(tailNet) || 0) + Math.max(0, rem));
      return [...map.entries()].map(([net, p]) => ({ p, net, label: String(net) }));
    };

    pWinApprox = side === 'over' ? probTotalOver(line, lam) : (1 - probTotalOver(line, lam));
    desc = `${side === 'over' ? 'Over ' : 'Under '}${line.toFixed(2).replace('.', ',')} · λ gols ${lam.toFixed(3).replace('.', ',')} calibrado em O/U ${cal.toFixed(2).replace('.', ',')} (${(pOver * 100).toFixed(1).replace('.', ',')}% over)`;
  }

  return makeBetBase({
    label,
    decomp: desc,
    p: pWinApprox,
    fair: null,
    your,
    confClass: 'mid',
    confTxt: 'Confiança média — cálculo correto por estados de retorno, mas depende da distribuição informada/modelada.',
    returns: retFactory,
    saveable: false,
    warnings,
    cfg,
  });
}
