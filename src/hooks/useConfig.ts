import { useState, useCallback } from 'react';
import type { Config, DevigMethod, BoostType } from '../types';

const DEFAULTS: Config = {
  bank: 1000,
  unit: 10,
  floor: 0.0025,
  cap: 0.05,
  edgemin: 0.005,
  frac: 0.20,
  method: 'auto',
  boostType: 'none',
  boostVal: 0,
  confAdj: 'on',
};

// Se um valor foi salvo em formato percentual (>1), converte para decimal.
// Necessário porque versões antigas exibiam os campos sem conversão ×100.
function migratePercent(v: number | undefined, fallback: number): number {
  if (typeof v !== 'number' || v < 0) return fallback;
  return v > 1 ? v / 100 : v;
}

function loadConfig(): Config {
  try {
    const raw = localStorage.getItem('kelly_config');
    if (raw) {
      const p = JSON.parse(raw);
      return {
        bank: typeof p.bank === 'number' && p.bank > 0 ? p.bank : DEFAULTS.bank,
        unit: typeof p.unit === 'number' && p.unit > 0 ? p.unit : DEFAULTS.unit,
        frac: typeof p.frac === 'number' && p.frac > 0 ? p.frac : DEFAULTS.frac,
        cap: migratePercent(p.cap, DEFAULTS.cap),
        floor: migratePercent(p.floor, DEFAULTS.floor),
        edgemin: migratePercent(p.edgemin, DEFAULTS.edgemin),
        method: (p.method as DevigMethod) || DEFAULTS.method,
        boostType: (p.boostType as BoostType) || DEFAULTS.boostType,
        boostVal: typeof p.boostVal === 'number' ? p.boostVal : DEFAULTS.boostVal,
        confAdj: p.confAdj === 'off' ? 'off' : 'on',
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveConfig(cfg: Config) {
  try {
    localStorage.setItem('kelly_config', JSON.stringify(cfg));
  } catch { /* ignore */ }
}

export function useConfig() {
  const [config, setConfigState] = useState<Config>(loadConfig);

  const setConfig = useCallback((updater: Partial<Config> | ((prev: Config) => Config)) => {
    setConfigState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveConfig(next);
      return next;
    });
  }, []);

  return { config, setConfig };
}
