import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BetResult } from '../types';
import { confFactor } from '../lib/math';

export function stakeFlow(B: BetResult) {
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

export function setQuality(B: BetResult): { cls: string; label: string; pill: string; desc: string; icon: React.ElementType } {
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
