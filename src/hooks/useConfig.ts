import { useState, useCallback } from 'react';
import type { Config, DevigMethod, BoostType } from '../types';

function loadConfig(): Config {
  try {
    const raw = localStorage.getItem('kelly_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bank: typeof parsed.bank === 'number' && parsed.bank > 0 ? parsed.bank : 1000,
        unit: typeof parsed.unit === 'number' && parsed.unit > 0 ? parsed.unit : 10,
        floor: typeof parsed.floor === 'number' && parsed.floor >= 0 ? parsed.floor : 0.0025,
        cap: typeof parsed.cap === 'number' && parsed.cap > 0 ? parsed.cap : 0.03,
        edgemin: typeof parsed.edgemin === 'number' && parsed.edgemin >= 0 ? parsed.edgemin : 0.005,
        frac: typeof parsed.frac === 'number' && parsed.frac > 0 ? parsed.frac : 0.20,
        method: (parsed.method as DevigMethod) || 'auto',
        boostType: (parsed.boostType as BoostType) || 'none',
        boostVal: typeof parsed.boostVal === 'number' ? parsed.boostVal : 0,
        confAdj: parsed.confAdj === 'off' ? 'off' : 'on',
      };
    }
  } catch { /* ignore */ }
  return {
    bank: 1000,
    unit: 10,
    floor: 0.0025,
    cap: 0.03,
    edgemin: 0.005,
    frac: 0.20,
    method: 'auto',
    boostType: 'none',
    boostVal: 0,
    confAdj: 'on',
  };
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
