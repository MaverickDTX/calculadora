import { useMemo } from 'react';
import type { BetResult, Config } from '../types';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
}

export function VizSection({ result, config }: Props) {
  const hasResult = result && !('err' in result) && result.ev > 0 && result.kadj > 0;

  if (!hasResult) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <MonteCarlo result={result as BetResult} config={config} />
    </div>
  );
}

function MonteCarlo({ result, config }: { result: BetResult; config: Config }) {
  const sims = useMemo(() => {
    const n = 300;
    const bets = 250;
    const paths: number[][] = [];
    for (let s = 0; s < n; s++) {
      let bank = 1;
      const path = [bank];
      for (let b = 0; b < bets; b++) {
        const ret = result.returns.length > 0
          ? result.returns
          : [{ p: result.p || 0.5, net: result.yourEff - 1 }, { p: 1 - (result.p || 0.5), net: -1 }];
        const r = Math.random();
        let cum = 0;
        let net = -1;
        for (const state of ret) {
          cum += state.p;
          if (r <= cum) { net = state.net; break; }
        }
        bank *= (1 + result.kadj * net);
        path.push(bank);
      }
      paths.push(path);
    }
    return paths;
  }, [result, config]);

  const ruin = sims.filter(p => p[p.length - 1] < 0.5).length / sims.length;
  const finals = sims.map(p => p[p.length - 1]).sort((a, b) => a - b);
  const median = finals[Math.floor(finals.length / 2)];

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-1">
        <div className="section-title mb-0">Projeção de banca (Monte Carlo)</div>
        <span className="tag tag-info">{sims.length} trajetórias · 250 apostas</span>
      </div>
      <p className="text-[11px] text-text-muted mb-3">Risco de ruína e mediana após 250 apostas</p>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Ruína aprox: <span className="font-mono text-text-secondary">{fpct(ruin)}</span></span>
        <span>Mediana final: <span className="font-mono text-text-secondary">{median.toFixed(2)}x</span></span>
      </div>
    </div>
  );
}

function fpct(n: number): string {
  return (n * 100).toFixed(2).replace('.', ',') + '%';
}
