import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiAdaptationRole } from "./ai-adaptation-role";
import { matchesAdaptationRole } from "./ai-adaptation-role-match";

/** Compatible queued units satisfy role demand before further production is proposed. */
export function queuedAdaptationRoleItemIds(
  observation: AiObservation,
  catalog: AiCapabilityCatalog,
  role: AiAdaptationRole
): readonly string[] {
  return [...new Set(observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned" && actor.queue.status === "known")
    .flatMap((actor) => actor.queue.status === "known" ? (actor.queue.value.items ?? []) : [])
    .filter((item) => {
      if (item.kind !== "production" || item.objectName === null) return false;
      return catalog.entries.some((entry) =>
        entry.sourceObjectName === item.objectName && matchesAdaptationRole(entry, role)
      );
    })
    .map((item) => item.itemId))].sort();
}
