import { useState, useRef, useEffect, useMemo } from 'react';
import type { Config, BetResult } from '../types';
import { calcNres, calcProps, calcProxy, calcAub, calcCombo, calcPoi, calcAsia } from '../lib/calc';

export function useCalculator(
  inputs: Record<string, string>,
  cfg: Config,
  activeTab: string,
  trigger?: number
): { result: BetResult | { err: string } | null; recompute: () => void; isLoading: boolean } {
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  const isLazy = trigger !== undefined;
  const [lazyResult, setLazyResult] = useState<BetResult | { err: string } | null>(null);
  const [lazyLoading, setLazyLoading] = useState(false);

  // Modo reativo (abas leves): cálculo síncrono via useMemo, sem loading state.
  // O cálculo é instantâneo o suficiente para não precisar de feedback visual.
  const reactiveResult = useMemo(() => {
    const get = (id: string) => inputsRef.current[id] ?? '';
    switch (activeTab) {
      case 'nres': return calcNres(get, cfg);
      case 'props': return calcProps(get, cfg);
      case 'proxy': return calcProxy(get, cfg);
      case 'aub': return calcAub(get, cfg);
      default: return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, activeTab, inputs, isLazy]);

  // Modo lazy (abas pesadas): cálculo assíncrono com setTimeout(0) para permitir
  // que o React pinte o skeleton (isLoading=true) antes do trabalho síncrono pesado
  // bloquear a thread principal.
  useEffect(() => {
    if (!isLazy) {
      return;
    }

    if (trigger === 0) {
      setLazyResult(null);
      setLazyLoading(false);
      return;
    }

    setLazyLoading(true);

    const timeoutId = setTimeout(() => {
      const get = (id: string) => inputsRef.current[id] ?? '';
      let computed: BetResult | { err: string } | null;
      switch (activeTab) {
        case 'combo': computed = calcCombo(get, cfg); break;
        case 'poi': computed = calcPoi(get, cfg); break;
        case 'asia': computed = calcAsia(get, cfg); break;
        default: computed = null;
      }
      setLazyResult(computed);
      setLazyLoading(false);
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, isLazy ? [cfg, activeTab, trigger, isLazy] : [cfg, activeTab, inputs, isLazy]);

  return {
    result: isLazy ? lazyResult : reactiveResult,
    recompute: () => {},
    isLoading: isLazy ? lazyLoading : false,
  };
}