import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Observed actor/controller resets fence existing orders; an absent history never proves continuity. */
export function runtimeRouteOrderFenced(capture: AiRuntimeProductionCaptureV1, actorId: string | null,
  start: number, end: number): boolean {
  return capture.facts.some((fact) => fact.sequence > start && fact.sequence <= end &&
    (fact.kind === "actor_unregistered" && fact.actorId === actorId ||
      fact.kind === "actor_registered" && fact.actor.actorId === actorId ||
      fact.kind === "spatial_authority" && fact.spatial.kind === "route_order_restore" &&
        fact.spatial.source.actorId === actorId));
}
