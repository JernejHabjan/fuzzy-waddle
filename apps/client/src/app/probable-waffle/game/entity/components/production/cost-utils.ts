import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";

/**
 * Per-Definition Supply Costing Integration
 * Central helper to retrieve production resource cost directly from actor definitions.
 */
export function getCostForObjectName(objectName: ObjectNames): Partial<Record<ResourceType, number>> | undefined {
  const definition = pwActorDefinitions[objectName];
  return definition?.components?.productionCost?.resources;
}

/**
 * return wood-only fallback for legacy heuristics.
 */
export function getApproxWoodCost(objectName: ObjectNames, fallback: number): number {
  const cost = getCostForObjectName(objectName);
  if (!cost) return fallback;
  return (cost[ResourceType.Wood] ?? Object.values(cost)[0] ?? fallback) as number;
}
