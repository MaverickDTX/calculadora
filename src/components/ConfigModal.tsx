import { useState, useEffect } from 'react';
import { X, Wallet, SlidersHorizontal, Percent, Shield, TrendingUp } from 'lucide-react';
import type { Config, DevigMethod, BoostType } from '../types';
import { useDialog } from '../hooks/useDialog';

interface Props {
  config: Config;
  onChange: (c: Config) => void;
  onClose: () => void;
}

const TITLE_ID = 'config-modal-title';

const METHODS: { id: DevigMethod; label: string; desc: string }[] = [
  { id: 'equal', label: 'Margem igual', desc: 'Distribui a margem igualmente entre todas as vias' },
  { id: 'prop', label: 'Proporcional', desc: 'Remove a margem proporcionalmente às probabilidades' },
  { id: 'probit', label: 'Probit', desc: 'Escala no quantil normal; melhor para favoritos fortes' },
  { id: 'log', label: 'Log-function', desc: 'Ajuste logarítmico; robusto para mercados equilibrados' },
  { id: 'shin', label: 'Shin', desc: 'Correção de insider trading; conservador' },
  { id: 'auto', label: 'Automático', desc: 'Recomenda o melhor método pelo perfil de odds' },
];

export function ConfigModal({ config, onChange, onClose }: Props) {
  const [local, setLocal] = useState<Config>(config);
  const { ref, dialogProps } = useDialog<HTMLDivElement>({
    open: true,
    onClose,
    labelId: TITLE_ID,
  });

  const update = (patch: Partial<Config>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in" style={{ overscrollBehavior: 'contain' }} onClick={onClose}>
      <div ref={ref} {...dialogProps}
        className="border border-border rounded-2xl shadow-float w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
        style={{ background: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(32px) saturate(150%)', WebkitBackdropFilter: 'blur(32px) saturate(150%)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <SlidersHorizontal size={16} className="text-accent" aria-hidden="true" />
            </div>
            <div>
              <h2 id={TITLE_ID} className="text-sm font-semibold text-text-primary">Configurações</h2>
              <p className="text-xs text-text-muted">Ajuste a gestão de banca e o motor de cálculo</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar configurações" className="icon-btn text-text-muted hover:text-text-primary transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* Bankroll */}
          <Section icon={Wallet} title="Banca e unidade">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Banca total (R$)" value={String(local.bank).replace('.', ',')} onChange={v => update({ bank: parseFloat(v.replace(',', '.')) || 0 })} />
              <Field label="Unidade (R$)" value={String(local.unit).replace('.', ',')} onChange={v => update({ unit: parseFloat(v.replace(',', '.')) || 0 })} />
            </div>
          </Section>

          {/* Kelly */}
          <Section icon={TrendingUp} title="Critério de Kelly">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Fração Kelly" value={String(local.frac).replace('.', ',')} onChange={v => update({ frac: parseFloat(v.replace(',', '.')) || 0.20 })} />
              <Field label="Teto (% banca)" value={fmtPct(local.cap)} onChange={v => update({ cap: parsePct(v) })} suffix="%" />
              <Field label="Piso (% banca)" value={fmtPct(local.floor)} onChange={v => update({ floor: parsePct(v) })} suffix="%" />
            </div>
          </Section>

          {/* Edge */}
          <Section icon={Shield} title="Filtros de valor">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Edge mínimo" value={fmtPct(local.edgemin)} onChange={v => update({ edgemin: parsePct(v) })} suffix="%" />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={local.confAdj === 'on'}
                    onChange={e => update({ confAdj: e.target.checked ? 'on' : 'off' })}
                    className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent/30"
                  />
                  <span className="text-sm text-text-secondary">Ajustar por confiança</span>
                </label>
              </div>
            </div>
          </Section>

          {/* De-vig */}
          <Section icon={Percent} title="Método de de-vig">
            <div className="space-y-2">
              {METHODS.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    local.method === m.id
                      ? 'border-accent bg-accent-soft'
                      : 'border-border bg-surface hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.id}
                    checked={local.method === m.id}
                    onChange={() => update({ method: m.id })}
                    className="mt-0.5 w-4 h-4 text-accent border-border bg-surface focus:ring-accent/30"
                  />
                  <div>
                    <div className={`text-sm font-medium ${local.method === m.id ? 'text-accent' : 'text-text-primary'}`}>{m.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Boost */}
          <Section icon={TrendingUp} title="Boost de odd">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Tipo</label>
                <select
                  value={local.boostType}
                  onChange={e => update({ boostType: e.target.value as BoostType })}
                  className="input-dark"
                >
                  <option value="none">Sem boost</option>
                  <option value="profit">Profit %</option>
                  <option value="mult">Multiplicador</option>
                </select>
              </div>
              {local.boostType !== 'none' && (
                <Field
                  label={local.boostType === 'profit' ? 'Profit %' : 'Multiplicador'}
                  value={String(local.boostVal).replace('.', ',')}
                  onChange={v => update({ boostVal: parseFloat(v.replace(',', '.')) || 0 })}
                />
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-text-muted" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

function fmtPct(v: number): string {
  // Exibe cap/floor/edgemin em pontos percentuais (0.05 → "5")
  const pct = v * 100;
  const rounded = parseFloat(pct.toPrecision(6));
  return String(rounded).replace('.', ',');
}

function parsePct(s: string): number {
  return (parseFloat(s.replace(',', '.')) || 0) / 100;
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <div>
      <label className="text-xs text-text-muted mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => onChange(draft)}
          className="input-dark pr-8"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
