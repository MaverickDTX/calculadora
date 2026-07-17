import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, ChevronDown } from 'lucide-react';
import type { BetResult, Config } from '../types';
import { fpct, fbrl, fnum, gridStake } from '../lib/math';
import { stakeFlow, setQuality } from '../lib/result-utils';
import { SkeletonResult } from './SkeletonResult';

interface ResultViewProps {
  result: BetResult | { err: string } | null;
  config: Config;
  isLoading?: boolean;
}

export function ResultView({ result, config, isLoading }: ResultViewProps) {
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    setAnimateKey(k => k + 1);
  }, [result]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5" style={{ overscrollBehavior: 'contain' }}>
      {isLoading && <SkeletonResult />}
      {!isLoading && !result && <EmptyState />}
      {!isLoading && result && 'err' in result && <ErrorState msg={result.err} />}
      {!isLoading && result && !('err' in result) && <ResultContent key={animateKey} B={result} config={config} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <TrendingUp size={28} className="opacity-40" aria-hidden="true" />
      </div>
      <p className="text-sm">Preencha os campos e clique em Calcular</p>
      <p className="text-xs mt-1 opacity-60">A stake recomendada aparecerá aqui</p>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div role="alert" className="panel border-danger/30" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
      <div className="flex items-center gap-2 text-danger mb-2">
        <AlertTriangle size={16} aria-hidden="true" />
        <span className="text-sm font-semibold">Erro no cálculo</span>
      </div>
      <p className="text-sm text-text-secondary">{msg}</p>
    </div>
  );
}

export function ResultContent({ B, config }: { B: BetResult; config: Config }) {
  const flow = stakeFlow(B);
  const gs = gridStake(B.kadj, config.bank, config.unit);
  const qual = setQuality(B);
  const QualIcon = qual.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className={`panel ${qual.cls}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QualIcon size={18} aria-hidden="true" className={qual.cls === 'quality-good' ? 'text-value' : qual.cls === 'quality-mid' ? 'text-warn' : 'text-danger'} />
            <span className="text-sm font-semibold text-text-primary">{qual.label}</span>
          </div>
          <span className={`tag ${qual.cls === 'quality-good' ? 'tag-value' : qual.cls === 'quality-mid' ? 'tag-warn' : qual.cls === 'quality-bad' ? 'tag-danger' : 'tag-info'}`}>
            {qual.pill}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">{qual.desc}</p>
      </div>

      {B.ev > 0 && B.kadj > 0 && gs.units > 0 ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="stake-display">
            <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/70">Stake recomendado</div>
              <div className="stake-value font-mono font-bold text-white mt-1">{fbrl(gs.reais)}</div>
              <div className="font-mono text-sm text-indigo-200/60 mt-1">
                {fnum(gs.units, 2)}u · {fpct(gs.pct)} · ideal {fnum(gs.rawUnits, 2)}u
              </div>
            </div>
            </div>
          </div>
          <div className="panel flex flex-col justify-center">
            <div className="metric-label">Kelly cheio · ajustado</div>
            <div className="mt-1 font-mono text-xl font-semibold text-kelly">{fpct(B.kfull)} <span className="text-text-muted">·</span> {fpct(B.kadj)}</div>
            <div className="mt-2 text-[11px] text-text-muted">Odds {fnum(B.yourEff, 3)} · {methodLabel(B.cfg.method)}</div>
          </div>
        </div>
      ) : (
        <div className="panel text-center py-6">
          <div className="text-sm font-semibold text-text-secondary mb-1">
            {B.ev <= 0 ? 'Sem valor / travado' : B.ev < config.edgemin ? 'Abaixo do edge mínimo' : 'Filtros travaram stake'}
          </div>
          <p className="text-xs text-text-muted">
            {B.ev <= 0 ? `EV de ${fpct(B.ev)}. Kelly cheio é zero.` : `Edge ${fpct(B.ev)} < mínimo ${fpct(config.edgemin)}`}
          </p>
        </div>
      )}

      <CollapsibleSection title="Decomposição">
        <div className="font-mono text-sm text-text-secondary rounded-lg p-3 border border-border"
          style={{ background: 'var(--color-surface)' }}
        >
          {B.decomp}
          {B.boosted && <span className="text-accent ml-2">→ boost {fnum(B.yourEff, 3)}</span>}
        </div>
      </CollapsibleSection>

      <div className="grid grid-cols-3 gap-2.5">
        <MetricCard label="Prob. justa" value={B.p ? fpct(B.p) : 'multi'} />
        <MetricCard label="Margem removida" value={B.M !== null ? fpct(B.M) : '—'} />
        <MetricCard label="EV" value={`${B.ev >= 0 ? '+' : ''}${fpct(B.ev)}`} highlight={B.ev >= 0 ? 'good' : 'bad'} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="Odd justa" value={B.fair ? fnum(B.fair, 3) : 'multi'} />
        <MetricCard label="Odd efetiva" value={fnum(B.yourEff, 3)} />
      </div>

      <CollapsibleSection title="Fluxo do ajuste">
        <div className="flex flex-wrap gap-1.5">
          <FlowTag label={`fração ${fnum(config.frac, 2)}`} />
          <FlowTag label={`confiança ${fnum(flow.cf, 2)}`} type={flow.cf < 1 ? 'warn' : 'info'} />
          <FlowTag label={`sensibilidade ${fnum(flow.sf, 2)}`} type={flow.sf < 1 ? 'warn' : 'info'} />
          {flow.df < 1 && <FlowTag label={`divergência ${fnum(flow.df, 2)}`} type="warn" />}
          <FlowTag label={`pré-travas ${fpct(flow.raw)}`} type="info" />
          {flow.floorApplied && <FlowTag label={`piso ${fpct(flow.afterFloor)}`} type="good" />}
          {flow.capApplied && <FlowTag label={`teto ${fpct(config.cap)}`} type="warn" />}
          {B.ev < config.edgemin && <FlowTag label="edge mínimo trava" type="bad" />}
        </div>
      </CollapsibleSection>

      <div className="panel">
        <div className="section-title">Confiança do modelo</div>
        <div className="flex items-center gap-2">
          <span className={`tag ${B.confClass === 'high' ? 'tag-value' : B.confClass === 'mid' ? 'tag-warn' : 'tag-danger'}`}>
            {B.confClass === 'high' ? 'Alta' : B.confClass === 'mid' ? 'Média' : 'Baixa'}
          </span>
          <span className="text-xs text-text-muted">{B.confTxt}{B.fb ? ' (fallback proporcional)' : ''}</span>
        </div>
      </div>

      {B.ev > 0 && B.kadj > 0 && gs.units > 0 && B.returns.length > 0 && (
        <CollapsibleSection title="Retornos por estado" defaultOpen={false}>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Melhor estado</span>
              <span className="font-mono text-value font-semibold">
                +{fnum(gs.units * Math.max(...B.returns.map(r => r.net)), 2)}u
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Pior estado</span>
              <span className="font-mono text-danger font-semibold">
                {fnum(gs.units * Math.min(...B.returns.map(r => r.net)), 2)}u
              </span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {B.warnings.length > 0 && (
        <div className="space-y-1.5">
          {B.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-warn rounded-lg p-2.5 border border-warn/20"
              style={{ background: 'rgba(245, 158, 11, 0.06)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function methodLabel(method: Config['method']): string {
  const labels: Record<Config['method'], string> = { equal: 'Equitativo', prop: 'Proporcional', probit: 'Probit', log: 'Log', shin: 'Shin', auto: 'Automático' };
  return labels[method];
}

export function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' | 'kelly' }) {
  const colorClass = highlight === 'good' ? 'text-value' : highlight === 'bad' ? 'text-danger' : highlight === 'kelly' ? 'text-kelly' : 'text-text-primary';
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${colorClass}`}>{value}</div>
    </div>
  );
}

export function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="panel-collapsible" open={defaultOpen}>
      <summary>
        <span className="section-title mb-0">{title}</span>
        <ChevronDown size={16} className="chevron" aria-hidden="true" />
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}

export function FlowTag({ label, type = 'info' }: { label: string; type?: 'info' | 'warn' | 'good' | 'bad' }) {
  const map = {
    info: 'tag-info',
    warn: 'tag-warn',
    good: 'tag-value',
    bad: 'tag-danger',
  };
  return <span className={`tag ${map[type]}`}>{label}</span>;
}
