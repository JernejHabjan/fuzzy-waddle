import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../../data/actor-definitions";
import { type ConstructionSiteDefinition } from "../../../entity/building/construction/construction-site-component";

export const coreConstructionSiteDefinition: ConstructionSiteDefinition = {
  consumesBuilders: false,
  maxAssignedBuilders: 4,
  maxAssignedRepairers: 2,
  progressMadeAutomatically: 0,
  progressMadePerBuilder: 1,
  initialHealthPercentage: 0.2,
  repairFactor: 0.005,
  refundFactor: 0.5,
  startImmediately: false,
  canBeDragPlaced: false
};
