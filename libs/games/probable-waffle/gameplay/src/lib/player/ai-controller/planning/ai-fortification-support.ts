import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogEntryV1, AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** Initial graph caps prevent a new plan identity from turning fortification into unbounded work. */
export const AI_FORTIFICATION_GRAPH_CAPS = { walls: 16, towers: 3, stairs: 2 } as const;
export const AI_STANDARD_FORTIFICATION_SPEND_PERMILLE = 200;
export const AI_TURTLE_FORTIFICATION_SPEND_PERMILLE = 300;

export type ConstructionCell = NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number];

export function tileKey(position: Pick<Vector3Simple, "x" | "y">): string {
  return `${position.x},${position.y}`;
}

export function positionOf(actor: AiObservationV1["actors"][number]): Vector3Simple | null {
  return actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

export function resourceEntries(cost: Readonly<Partial<Record<ResourceType, number>>>): [ResourceType, number][] {
  return Object.values(ResourceType)
    .flatMap((resourceType): [ResourceType, number][] => {
      const amount = cost[resourceType];
      return typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? [[resourceType, amount]] : [];
    })
    .sort((left, right) => left[0].localeCompare(right[0]));
}

export function hasUnmetMacroFloor(state: AiBrainStateV1): boolean {
  const protectedPurposes = new Set(["bootstrap_worker", "supply_buffer", "sustainable_food"]);
  return state.economyProduction.demands.some((demand) => {
    if (!protectedPurposes.has(demand.purpose)) return false;
    const committed =
      demand.satisfiedActorIds.length +
      demand.queuedIds.length +
      demand.constructingIds.length +
      demand.acceptedNotObservedEffectIds.length;
    return committed < demand.desired;
  });
}

/** Legacy `safe` saves retain the same defensive intent as the Stage-14 `turtle` profile. */
export function isDefensiveArchetype(archetypeId: string): boolean {
  return archetypeId.endsWith(":safe") || archetypeId.endsWith(":turtle");
}

export function threatPosition(observation: AiObservationV1, anchor: Vector3Simple): Vector3Simple | null {
  return (
    observation.actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
      .map((actor) => positionOf(actor))
      .filter((position): position is Vector3Simple => position !== null)
      .sort(
        (left, right) =>
          Math.abs(left.x - anchor.x) +
            Math.abs(left.y - anchor.y) -
            (Math.abs(right.x - anchor.x) + Math.abs(right.y - anchor.y)) ||
          left.y - right.y ||
          left.x - right.x
      )[0] ?? null
  );
}

export function constructionEntry(
  catalog: AiCapabilityCatalogV1,
  objectName: ObjectNames
): AiCapabilityCatalogEntryV1 | null {
  return (
    catalog.entries
      .filter((entry) => entry.sourceObjectName === objectName)
      .sort(
        (left, right) =>
          right.effectiveLevel - left.effectiveLevel || left.capabilityId.localeCompare(right.capabilityId)
      )[0] ?? null
  );
}
