import type { BetResult } from '../types';
import { fpct, fnum } from '../lib/math';

interface Props {
  result: BetResult | { err: string } | null;
}

export function VizSection({ result }: Props) {
  const hasResult = result && !('err' in result);

  if (!hasResult) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <UncertaintyBand result={result as BetResult} />
      <FairProbabilities result={result as BetResult} />

    </div>
  );
}

function UncertaintyBand({ result }: { result: BetResult }) {
  const cls = result.divInfo.cls;
  if (!cls || !result.evBand) return null;

  const position = cls.key === 'high' ? 17 : cls.key === 'mid' ? 50 : 83;
  const status = result.confClass === 'low' ? 'low' : cls.key;
  const label = status === 'high' ? 'Consenso alto entre métodos' : status === 'mid' ? 'Métodos em divergência' : 'Sem valor entre métodos';
  const dotClass = status === 'high' ? 'bg-value' : status === 'mid' ? 'bg-warn' : 'bg-danger';
  const spread = result.evBand[1] - result.evBand[0];

  return (
    <div className="panel">
      <div className="section-title">Consenso entre métodos</div>
      <div className="flex items-center gap-3">
        <div className="relative h-3 flex-1 rounded overflow-hidden" style={{ background: 'linear-gradient(90deg, var(--green) 0%, var(--green) 33%, var(--amber) 50%, var(--red) 100%)' }} aria-hidden="true">
          <span className="absolute top-[-3px] h-5 w-0.5 rounded bg-[var(--color-text-primary)] shadow-[0_0_0_1px_rgba(0,0,0,.35)]" style={{ left: `${position}%` }} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
          <span className={`w-2 h-2 rounded ${dotClass}`} />
          <span>{label}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-3 font-mono text-[11px] text-text-muted">
        <span>EV entre {fpct(result.evBand[0])} e {fpct(result.evBand[1])}</span>
        <span>Delta métodos {fpct(spread)}{result.divInfo.factor < 1 ? ` · Kelly ×${fnum(result.divInfo.factor, 1)}` : ''}</span>
      </div>
    </div>
  );
}

function FairProbabilities({ result }: { result: BetResult }) {
  const probabilities = result.fairProbabilities;
  const odds = result.referenceOdds;
  if (!probabilities || !odds || probabilities.length < 2 || odds.length !== probabilities.length) return null;

  return (
    <div className="panel">
      <div className="section-title">Probabilidade justa por resultado</div>
      <div className="space-y-2.5">
        {probabilities.map((probability, index) => {
          const selected = index === result.selectedOutcomeIndex;
          const label = result.label === 'Props Sim/Não' ? (index === 0 ? 'Lado apostado' : 'Lado contrário') : index === 0 ? 'Resultado avaliado' : `Resultado ${index + 1}`;
          return (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex justify-between gap-2 text-[11px] text-text-muted"><span className={selected ? 'text-accent font-semibold' : ''}>{label}</span><span className="font-mono">{fpct(probability)}</span></div>
                <div className="h-2 rounded bg-surface-hover overflow-hidden"><div className={`h-full rounded ${selected ? 'bg-accent' : 'bg-text-muted/50'}`} style={{ width: `${Math.max(2, probability * 100)}%` }} /></div>
              </div>
              <span className="font-mono text-xs text-text-secondary">{fnum(1 / probability, 3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

