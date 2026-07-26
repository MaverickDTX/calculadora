import {
  Plus,
  Minus,
  Sparkles,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { HelpTip } from "../HelpTip";
import { Select } from "../Select";
import { NumberInput } from "../NumberInput";
import { outcomeLabels } from "../../lib/outcome-labels";
import type { BetResult, Config } from "../../types";
import { BetSidePanels } from "../BetSidePanels";
import { fpct, fnum } from "../../lib/math";

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onLoadExample: (key: string) => void;
  onReset: () => void;
  onCalculate: () => void;
  isLoading?: boolean;
  hideCalcButton?: boolean;
  result: BetResult | { err: string } | null;
  config: Config;
}

export function NResultsTab({
  values,
  onChange,
  onLoadExample,
  onReset,
  onCalculate,
  hideCalcButton = false,
  result,
  config,
}: Props) {
   const oddsRaw = values["nres-odds"] || "";
   const oddsList = oddsRaw ? oddsRaw.split(",").map((s) => s.trim()) : [""];
   const sel = parseInt(values["nres-sel"] || "0", 10);
   const currentLabels = outcomeLabels[values["nres-type"] || "1X2 / Moneyline"];
   const outcomeLabel = (index: number) =>
     currentLabels?.[index] || `Resultado ${index + 1}`;

const updateOdds = (newOdds: string[]) => {
      newOdds = newOdds.map((s) => s.replace(/,/g, "."));
      onChange("nres-odds", newOdds.join(","));
    };

   const addOdd = () => updateOdds([...oddsList, ""]);
   const removeOdd = (i: number) => {
     const next = oddsList.filter((_, idx) => idx !== i);
     const nextSel =
       i < sel ? sel - 1 :
       i === sel ? 0 :
       sel;
     onChange("nres-sel", String(Math.min(nextSel, Math.max(0, next.length - 1))));
     updateOdds(next.length > 0 ? next : [""]);
   };
   const changeOdd = (i: number, v: string) => {
     const next = [...oddsList];
     next[i] = v;
     updateOdds(next);
   };
   const selectSel = (i: number) => {
     onChange("nres-sel", String(i));
   };

   const presets = [
     {
       key: "nres-1x2",
       label: "Mercado 1X2 / Moneyline",
       desc: "Casa 2.50 · Empate 3.30 · Fora 2.80",
     },
     {
       key: "nres-ou",
       label: "Over/Under de Gols",
       desc: "Over 1.95 · Under 1.95",
     },
   ];

    const marketMargin = result && !('err' in result) ? result.M : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Exemplos (full width, fino) */}
      <div className="panel py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Exemplos de Mercado
          </span>
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
          >
            <RotateCw size={11} /> Limpar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onLoadExample(p.key)}
              className="flex-1 min-w-[240px] max-w-[340px] border border-border bg-canvas/30 hover:border-accent hover:bg-surface-hover p-2 rounded-lg text-left transition-all flex items-start gap-2 group"
            >
              <div className="w-7 h-7 rounded bg-accent-soft text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-canvas transition-colors">
                <Sparkles size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                  {p.label}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5 font-mono truncate">
                  {p.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Odds da casa + Sua aposta */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        {/* Card 1: Odds da casa (tipo de mercado + odds) */}
        <div className="panel">
          <div className="section-title flex items-center gap-1">
            Odds da casa (mercado completo)
            <HelpTip text="Todas as vias são usadas juntas para remover a margem do mercado." />
          </div>
          <label className="text-xs text-text-muted mb-1.5 block">
            Tipo do mercado
          </label>
          <Select
            value={values["nres-type"] || "1X2 / Moneyline"}
            onChange={(v) => {
              onChange("nres-type", v);
              onChange("nres-name", v);
            }}
            options={[
              { value: "1X2 / Moneyline", label: "1X2 / Moneyline" },
              { value: "Over/Under", label: "Over/Under" },
              { value: "Dupla chance", label: "Dupla chance" },
              { value: "Ambas marcam", label: "Ambas marcam" },
              {
                value: "Handicap asiático (3 vias)",
                label: "Handicap asiático (3 vias)",
              },
              { value: "Outro", label: "Outro" },
            ]}
          />
           <div
             className="grid gap-3 mt-3"
             role="radiogroup"
             aria-label="Resultado avaliado"
           >
             {oddsList.map((v, i) => {
               const isSelected = sel === i;
               return (
                 <div
                   key={i}
                   className={`relative rounded-lg border p-3 transition-colors ${
                     isSelected
                       ? "border-accent bg-accent/5"
                       : "border-border bg-canvas/30 hover:border-hairline-strong"
                   }`}
                 >
                   <label className="flex items-center gap-2 mb-2 cursor-pointer">
                     <input
                       type="radio"
                       name="nres-sel"
                       checked={isSelected}
                       onChange={() => selectSel(i)}
                       className="accent-accent"
                       aria-label={`Avaliar ${outcomeLabel(i)}`}
                     />
                     <span
                       className={`text-[10px] uppercase tracking-wider font-semibold ${
                         isSelected ? "text-accent" : "text-text-muted"
                       }`}
                     >
                       {outcomeLabel(i)}
                     </span>
                   </label>
                   <NumberInput
                     value={v}
                     onChange={(val) => changeOdd(i, val)}
                     placeholder="Odd"
                     min={1.01}
                   />
                   {result && !("err" in result) &&
                     result.fairProbabilities &&
                     result.fairProbabilities.length === oddsList.length && (
                       <div className="mt-1.5 flex items-center gap-2">
                         <div className="h-0.5 flex-1 rounded bg-surface-hover overflow-hidden">
                           <div
                             className={`h-full rounded ${
                               isSelected ? "bg-accent" : "bg-text-muted/50"
                             }`}
                             style={{ width: `${Math.max(2, result.fairProbabilities[i] * 100)}%` }}
                           />
                         </div>
                         <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
                           {fpct(result.fairProbabilities[i])} · justa{" "}
                           {fnum(1 / result.fairProbabilities[i], 3)}
                         </span>
                       </div>
                     )}
                   {oddsList.length > 1 && (
                     <button
                       type="button"
                       aria-label="Remover resultado"
                       onClick={() => removeOdd(i)}
                       className="absolute top-2 right-2 text-text-muted hover:text-danger p-1 rounded hover:bg-danger-soft transition-colors"
                     >
                       <Minus size={14} />
                     </button>
                   )}
                 </div>
               );
             })}
           </div>
           <button
             type="button"
             onClick={addOdd}
             className="mt-3 w-full border border-dashed border-hairline-strong hover:border-accent rounded-lg p-2.5 text-xs text-text-muted hover:text-accent transition-all flex items-center justify-center gap-1.5"
           >
             <Plus size={14} /> Adicionar resultado
           </button>
            {marketMargin !== null && (
              <div
                className={`mt-3 flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                  marketMargin > 0.2
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : marketMargin > 0.1
                      ? "border-warn/30 bg-warn/10 text-warn"
                      : marketMargin >= 0
                        ? "border-hairline bg-canvas text-text-secondary"
                        : marketMargin >= -0.05
                          ? "border-accent/25 bg-accent/10 text-accent"
                          : "border-danger/30 bg-danger/10 text-danger"
                }`}
              >
                {(marketMargin > 0.1 || marketMargin < -0.05) ? (
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                ) : marketMargin < 0 ? (
                  <TrendingUp size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {marketMargin > 0.2
                      ? `Erro de Linha: Overround Extremo (+${(marketMargin * 100).toFixed(1)}%)`
                      : marketMargin > 0.1
                        ? `Margem de Casa Salgada (+${(marketMargin * 100).toFixed(1)}%)`
                        : marketMargin >= 0
                          ? `Mercado Saudável (Overround: +${(marketMargin * 100).toFixed(1)}%)`
                          : marketMargin >= -0.05
                            ? `Margem Negativa / Arbitragem (${(marketMargin * 100).toFixed(1)}%)`
                            : `Erro de Linha: as odds não formam um mercado completo (${(marketMargin * 100).toFixed(1)}%)`}
                  </div>
                  <div className="text-text-secondary mt-0.5">
                    {marketMargin > 0.2
                      ? "A soma das probabilidades deste mercado é excessivamente alta. Verifique se digitou as odds corretamente."
                      : marketMargin > 0.1
                        ? "O overround de mercado está alto. O de-vig funcionará, mas odds com altas margens reduzem o valor matemático sugerido."
                        : marketMargin >= 0
                          ? "Parâmetros normais de de-vig"
                          : marketMargin >= -0.05
                            ? "As odds criam uma soma de probabilidades inferior a 100%. Pode ser arbitragem real entre duas vias."
                            : `A soma das probabilidades é de ${fpct(1 + marketMargin)}. Faltam vias, ou as odds são de mercados diferentes. Verifique antes de apostar.`}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Coluna direita: card da aposta + painéis laterais */}
        <div className="space-y-4">
          <div
            className="panel self-start"
            style={{
              background: "var(--color-accent-soft)",
              border: "1px solid var(--color-accent)",
            }}
          >
            <label
              className="text-xs font-semibold mb-1.5 block"
              style={{ color: "var(--color-accent)" }}
            >
              Odd da sua aposta
            </label>
            <NumberInput
              value={values["nres-your"] || ""}
              onChange={(v) => onChange("nres-your", v)}
              className="input-highlight"
              placeholder="2.65"
              min={1.01}
            />
            <p className="mt-1.5 text-[11px] text-text-muted">
              Casa onde você vai apostar
            </p>
            {!hideCalcButton && (
              <button
                type="button"
                onClick={onCalculate}
                className="btn-calc w-full mt-4"
              >
                Calcular
              </button>
            )}
          </div>

          <BetSidePanels result={result} config={config} />
        </div>
      </div>
    </div>
  );
}
