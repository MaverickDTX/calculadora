// ─── SGP registry — maps SportId → SportModel ───
import type { SportId, SportModel } from './types';
import { footballModel } from './football';
import { tennisModel } from './tennis';

export const SGP_REGISTRY: Record<SportId, SportModel> = {
  football: footballModel,
  tennis: tennisModel,
  // basketball: basketballModel, // Fase 2
};

export function getModel(sport: SportId): SportModel {
  const m = SGP_REGISTRY[sport];
  if (!m) throw new Error(`Modelo SGP não registrado para esporte: ${sport}`);
  return m;
}

export { footballModel, tennisModel };
export type { SportId, SportModel, SportInputs, ModelParams, Outcome, Leg, LegKindDef } from './types';
