import type { BetResult, Config } from "../types";
import { fpct, fnum, gridStake } from "../lib/math";

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
}

export function BetSidePanels({ result, config }: Props) {
  if (!result || "err" in result) return null;

  const B = result;
  const step = (() => {
    // tolerância para alinhar com o tick usado em calc.ts
    if (!B.oddLadder || B.oddLadder.length < 2) return 0;
    return Number((B.oddLadder[1].odd - B.oddLadder[0].odd).toFixed(3));
  })();

  return (
    <div className="space-y-4">
      {/* Bloco A — Odd mínima */}
      <div className="panel">
        <div className="section-title">Odd mínima</div>
        <div className="font-mono text-lg font-medium text-accent mt-1">
          {B.fair ? fnum(B.fair, 3) : "—"}
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          {B.ev >= 0
            ? `Abaixo disso não há valor. Margem: ${fpct(B.ev)}`
            : `Margem negativa: ${fpct(B.ev)}`}
        </p>
      </div>

      {/* Bloco C — Se a odd fosse */}
      {B.oddLadder && B.oddLadder.length > 0 && (
        <div className="panel">
          <div className="section-title">Se a odd fosse</div>
          <div className="mt-2 space-y-1">
            {B.oddLadder.map((l, i) => {
              const gs = gridStake(l.kadj, config.bank, config.unit);
              const isCurrent = i === 0;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-2 text-xs rounded px-1.5 py-1 ${
                    isCurrent ? "bg-accent/10 text-text-primary" : "text-text-secondary"
                  }`}
                >
                  <span className="font-mono">{fnum(l.odd, 3)}</span>
                  <span className="font-mono">{fpct(l.ev)}</span>
                  <span className="font-mono text-right min-w-[56px]">
                    {gs.units > 0 ? `R$ ${fnum(gs.reais, 2)}` : "—"}
                  </span>
                  <span className="font-mono text-right min-w-[44px] text-text-muted text-[10px]">
                    {fnum(gs.rawUnits, 2)}u
                  </span>
                </div>
              );
            })}
          </div>
          {step > 0 && (
            <p className="text-[10px] text-text-muted mt-2">
              Passo: +{fnum(step, 3)} por faixa
            </p>
          )}
        </div>
      )}

      {/* Bloco B — Banca (condensado) */}
      <div className="panel">
        <div className="section-title">Banca</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-mono text-lg font-medium text-text-primary">
            R$ {config.bank.toLocaleString("pt-BR")}
          </span>
          <span className="text-[11px] text-text-muted font-mono">
            {config.frac}× · teto {fpct(config.cap)}
          </span>
        </div>
      </div>
    </div>
  );
}
