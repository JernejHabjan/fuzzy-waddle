import type { GameCommand, GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

/** The native bus sorts reported actor scopes; ActionSystem applies/rejects each addressed pawn separately. */
export function runtimeRouteServiceOutcomeActors(outcome: GameCommandOutcome, command: GameCommand): boolean {
  const actors = outcome.actorIds;
  if (outcome.schemaVersion !== 1 || !actors.length || actors.length > 256 ||
    new Set(actors).size !== actors.length || actors.some((actorId) => !command.actorIds.includes(actorId)) ||
    [...actors].sort().some((actorId, index) => actorId !== actors[index])) return false;
  return outcome.kind !== "dispatched" || actors.length === command.actorIds.length &&
    [...command.actorIds].sort().every((actorId, index) => actorId === actors[index]);
}

/** Independent actor applications are legal; duplicate applications or conflicting terminal effects are not evidence. */
export function validateRuntimeRouteServiceLifecycle(outcomes: readonly GameCommandOutcome[]): readonly string[] {
  const applications = new Set<string>(), terminals = new Set<string>();
  for (const outcome of outcomes) {
    const terminal = ["completed", "cancelled", "rejected", "failed"].includes(outcome.kind);
    if (outcome.kind !== "applied" && !terminal) continue;
    const seen = terminal ? terminals : applications;
    for (const actorId of outcome.actorIds) {
      if (seen.has(actorId)) return ["production_route_service_actor_lifecycle_duplicate"];
      seen.add(actorId);
    }
  }
  return [];
}
