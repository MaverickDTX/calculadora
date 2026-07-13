import { useMemo, useRef } from 'react';
import type { Config, BetResult } from '../types';
import { calcNres, calcProps, calcProxy, calcAub, calcCombo, calcPoi, calcAsia } from '../lib/calc';

export function useCalculator(
  inputs: Record<string, string>,
  cfg: Config,
  activeTab: string,
  trigger?: number
): { result: BetResult | { err: string } | null; recompute: () => void } {
  // Ref sempre atualizada: o modo lazy lê os inputs vigentes no momento do
  // trigger sem tê-los nas dependências do useMemo (senão o cálculo pesado
  // — ex.: calibração Monte Carlo do tênis — rodaria a cada caractere digitado).
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  const isLazy = trigger !== undefined;

  // Modo lazy (abas pesadas): recalcula SÓ quando trigger/aba/config mudam.
  // Modo reativo (abas leves): recalcula a cada mudança de input.
  // Os dois arrays têm o mesmo tamanho — exigência do React para deps condicionais.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => {
    // Lazy sem nenhum "Calcular" ainda: não roda o cálculo pesado no mount/troca de aba.
    if (isLazy && trigger === 0) return null;

    const get = (id: string) => inputsRef.current[id] ?? '';

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
  }, isLazy ? [cfg, activeTab, trigger, isLazy] : [cfg, activeTab, inputs, isLazy]);

  return { result, recompute: () => {} };
}
