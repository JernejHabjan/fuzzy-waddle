import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { canReachAiConstructionSite } from "./ai-construction-recovery-proposal";
import { constructionAccessPolicy } from "./ai-construction-access";
import { aiEconomySiteSafety } from "./ai-economy-site-safety";
import { isAvailableBuilder } from "./ai-macro-observation";

/** Reuses recovery route facts and current fair placement cells; native application owns final admission. */
export function findAiExpansionBuilder(args: {
  observation: AiObservationV1;
  state: AiBrainStateV1;
  catalog: AiCapabilityCatalogV1;
  objectName: ObjectNames;
  position: Vector3Simple;
  accessNodeId: string | null;
}): AiObservedActorV1 | undefined {
  const { observation, state, catalog, objectName, position } = args;
  const radius =
    catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile?.footprintRadiusTiles ??
    0;
  const cells = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
  const footprint: string[] = [];
  const safety = aiEconomySiteSafety(observation);
  for (let y = position.y - radius; y <= position.y + radius; y += 1)
    for (let x = position.x - radius; x <= position.x + radius; x += 1) {
      const key = `${x},${y}`;
      const cell = cells.get(key);
      if (cell && (!cell.groundPassable || cell.observedBlocked)) return undefined;
      if (!safety.positionSafe({ x, y, z: position.z })) return undefined;
      footprint.push(key);
    }
  const knownFootprint = footprint.some((key) => cells.has(key));
  if (knownFootprint && footprint.some((key) => !cells.has(key))) return undefined;
  const leased = new Set(
    state.reservations
      .filter(
        (reservation) =>
          reservation.state.kind !== "provisional" || reservation.state.expiresAt.dueTick > observation.tick
      )
      .flatMap((reservation) => (reservation.subjectKey?.startsWith("actor:") ? [reservation.subjectKey.slice(6)] : []))
  );
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned" && isAvailableBuilder(actor))
    .filter((actor) => !leased.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(objectName)
      )
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId))
    .find((builder) => {
      const target: AiObservedActorV1 = {
        ...builder,
        actorId: `expansion-site:${position.x}:${position.y}:${position.z}`,
        observedTick: observation.tick,
        logicalPosition: { status: "known", value: position, observedTick: observation.tick },
        accessNodeId:
          args.accessNodeId === null || !args.accessNodeId.startsWith("access:")
            ? { status: "unknown", reason: "not_supported" }
            : { status: "known", value: `access:${args.accessNodeId.slice(7)}`, observedTick: observation.tick }
      };
      return (
        canReachAiConstructionSite(observation, catalog, builder, target) &&
        (!knownFootprint || constructionAccessPolicy(observation, builder, new Set())(footprint))
      );
    });
}
