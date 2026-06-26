import { useState, useCallback, useEffect } from 'react';
import { Save, X, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BetResult, Config } from '../types';
import { fpct, fbrl, fnum, gridStake, confFactor } from '../lib/math';
import { saveBet } from '../lib/supabase';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
  onClose: () => void;
}

function stakeFlow(B: BetResult) {
  const cf = confFactor(B.confClass, B.cfg.confAdj);
  const sf = B.sensInfo ? B.sensInfo.factor : 1;
  const df = B.divInfo ? B.divInfo.factor : 1;
  const raw = B.kfull * B.cfg.frac * cf * sf * df;
  const floorLimit = Math.min(B.cfg.floor, B.kfull);
  let afterFloor = raw;
  let floorApplied = false;
  if (B.confClass === 'high' && sf >= 1 && df >= 1 && afterFloor > 0 && afterFloor < floorLimit) {
    afterFloor = floorLimit;
    floorApplied = true;
  }
  const beforeCap = afterFloor;
  const afterCap = Math.min(afterFloor, B.cfg.cap, B.kfull);
  return { cf, sf, df, raw, afterFloor, beforeCap, afterCap, floorApplied, capApplied: afterCap < beforeCap - 1e-12 };
}

function setQuality(B: BetResult): { cls: string; label: string; pill: string; desc: string; icon: React.ElementType } {
  const minEdge = B.cfg.edgemin;
  if (B.ev <= 0) return { cls: 'quality-bad', label: 'Evitar', pill: 'Sem valor', desc: 'EV negativo ou nulo. O Kelly cheio é zero.', icon: AlertTriangle };
  if (B.ev < minEdge) return { cls: 'quality-off', label: 'Travada por edge mínimo', pill: 'Sem stake', desc: 'O EV é positivo, mas está abaixo do mínimo configurado para liberar stake.', icon: Minus };
  if (B.kadj <= 0) return { cls: 'quality-off', label: 'Travada por filtros', pill: 'Sem stake', desc: 'Há valor matemático, mas confiança, sensibilidade, teto ou grade travaram a aposta.', icon: Minus };
  if (B.confClass === 'high' && B.ev >= 0.035 && B.sensInfo && B.sensInfo.status !== 'bad') {
    return { cls: 'quality-good', label: 'Aposta forte', pill: 'Aprovada', desc: 'EV relevante, confiança alta e stake liberado após os redutores.', icon: TrendingUp };
  }
  if (B.confClass !== 'low' && B.ev >= 0.015) {
    return { cls: 'quality-good', label: 'Aposta aceitável', pill: 'Valor', desc: 'EV positivo e stake liberado. Ainda depende da premissa do modelo usado.', icon: TrendingUp };
  }
  if (B.confClass === 'low') {
    return { cls: 'quality-mid', label: 'Valor frágil', pill: 'Cautela', desc: 'O EV é positivo, mas a confiança do preço/modelo é baixa.', icon: TrendingDown };
  }
  return { cls: 'quality-mid', label: 'Marginal', pill: 'Revisar', desc: 'Há sinal de valor, mas a aposta depende dos redutores e da qualidade da referência.', icon: TrendingDown };
}

export function ResultsDrawer({ result, config, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    setSaved(false);
    setAnimateKey(k => k + 1);
  }, [result]);

  const handleSave = useCallback(async () => {
    if (!result || 'err' in result || !result.saveable) return;
    setSaving(true);
    const gs = gridStake(result.kadj, config.bank, config.unit);
    const { error } = await saveBet({
      label: result.label,
      market: result.label,
      prob: result.p,
      fair: result.fair,
      your: result.your,
      your_eff: result.yourEff,
      ev: result.ev,
      kfull: result.kfull,
      kadj: result.kadj,
      stake_units: gs.units,
      stake_reais: gs.reais,
      confidence: result.confClass,
      method: config.method,
      decomp: result.decomp,
    });
    setSaving(false);
    if (!error) setSaved(true);
  }, [result, config]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:relative md:inset-auto md:z-auto md:w-[400px] md:shrink-0 border-l border-border animate-slide-right"
      style={{
        background: 'rgba(11, 15, 23, 0.75)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
      }}
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between"
        style={{ background: 'rgba(11, 15, 23, 0.4)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
          <span className="text-sm font-semibold text-text-primary">Resultado</span>
        </div>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {!result && <EmptyState />}
        {result && 'err' in result && <ErrorState msg={result.err} />}
        {result && !('err' in result) && <ResultContent key={animateKey} B={result} config={config} onSave={handleSave} saving={saving} saved={saved} />}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <ChevronRight size={28} className="opacity-40" />
      </div>
      <p className="text-sm">Preencha os campos para ver o resultado</p>
      <p className="text-xs mt-1 opacity-60">A stake recomendada aparecerá aqui</p>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="panel border-danger/30" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
      <div className="flex items-center gap-2 text-danger mb-2">
        <AlertTriangle size={16} />
        <span className="text-sm font-semibold">Erro no cálculo</span>
      </div>
      <p className="text-sm text-text-secondary">{msg}</p>
    </div>
  );
}

function ResultContent({ B, config, onSave, saving, saved }: { B: BetResult; config: Config; onSave: () => void; saving: boolean; saved: boolean }) {
  const flow = stakeFlow(B);
  const gs = gridStake(B.kadj, config.bank, config.unit);
  const qual = setQuality(B);
  const QualIcon = qual.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Quality verdict */}
      <div className={`panel ${qual.cls}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QualIcon size={18} className={qual.cls === 'quality-good' ? 'text-value' : qual.cls === 'quality-mid' ? 'text-warn' : 'text-danger'} />
            <span className="text-sm font-semibold text-text-primary">{qual.label}</span>
          </div>
          <span className={`tag ${qual.cls === 'quality-good' ? 'tag-value' : qual.cls === 'quality-mid' ? 'tag-warn' : qual.cls === 'quality-bad' ? 'tag-danger' : 'tag-info'}`}>
            {qual.pill}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">{qual.desc}</p>
      </div>

      {/* Stake */}
      {B.ev > 0 && B.kadj > 0 && gs.units > 0 ? (
        <div className="stake-display">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/70">Stake recomendado</div>
              <div className="font-mono text-[clamp(32px,4vw,48px)] font-bold text-white mt-1">{fbrl(gs.reais)}</div>
              <div className="font-mono text-sm text-indigo-200/60 mt-1">
                {fnum(gs.units, 2)}u · {fpct(gs.pct)} · ideal {fnum(gs.rawUnits, 2)}u
              </div>
            </div>
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

      {/* Decomp */}
      <div className="panel">
        <div className="section-title">Decomposição</div>
        <div className="font-mono text-sm text-text-secondary rounded-lg p-3 border border-border"
          style={{ background: 'rgba(11, 15, 23, 0.5)' }}
        >
          {B.decomp}
          {B.boosted && <span className="text-accent ml-2">→ boost {fnum(B.yourEff, 3)}</span>}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="Prob. justa" value={B.p ? fpct(B.p) : 'multi'} />
        <MetricCard label="Odd justa" value={B.fair ? fnum(B.fair, 3) : 'multi'} />
        <MetricCard label="EV" value={`${B.ev >= 0 ? '+' : ''}${fpct(B.ev)}`} highlight={B.ev >= 0 ? 'good' : 'bad'} />
        <MetricCard label="Kelly cheio" value={B.kfull > 0 ? fpct(B.kfull) : '—'} />
        <MetricCard label="Kelly ajustado" value={B.kadj > 0 ? fpct(B.kadj) : '—'} highlight={B.kadj > 0 ? 'kelly' : undefined} />
        <MetricCard label="Odd efetiva" value={fnum(B.yourEff, 3)} />
      </div>

      {/* Flow */}
      <div className="panel">
        <div className="section-title">Fluxo do ajuste</div>
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
      </div>

      {/* Confidence */}
      <div className="panel">
        <div className="section-title">Confiança do modelo</div>
        <div className="flex items-center gap-2">
          <span className={`tag ${B.confClass === 'high' ? 'tag-value' : B.confClass === 'mid' ? 'tag-warn' : 'tag-danger'}`}>
            {B.confClass === 'high' ? 'Alta' : B.confClass === 'mid' ? 'Média' : 'Baixa'}
          </span>
          <span className="text-xs text-text-muted">{B.confTxt}{B.fb ? ' (fallback proporcional)' : ''}</span>
        </div>
      </div>

      {/* Returns */}
      {B.ev > 0 && B.kadj > 0 && gs.units > 0 && B.returns.length > 0 && (
        <div className="panel">
          <div className="section-title">Retornos por estado</div>
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
        </div>
      )}

      {/* Warnings */}
      {B.warnings.length > 0 && (
        <div className="space-y-1.5">
          {B.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-warn rounded-lg p-2.5 border border-warn/20"
              style={{ background: 'rgba(245, 158, 11, 0.06)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Save */}
      {B.saveable && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="btn-primary w-full justify-center"
        >
          <Save size={16} />
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar aposta'}
        </button>
      )}
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' | 'kelly' }) {
  const colorClass = highlight === 'good' ? 'text-value' : highlight === 'bad' ? 'text-danger' : highlight === 'kelly' ? 'text-kelly' : 'text-text-primary';
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${colorClass}`}>{value}</div>
    </div>
  );
}

function FlowTag({ label, type = 'info' }: { label: string; type?: 'info' | 'warn' | 'good' | 'bad' }) {
  const map = {
    info: 'tag-info',
    warn: 'tag-warn',
    good: 'tag-value',
    bad: 'tag-danger',
  };
  return <span className={`tag ${map[type]}`}>{label}</span>;
}
