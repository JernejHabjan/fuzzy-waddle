import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** One fair danger predicate serves individual suppression and aligned positive-pair checks. */
export function expansionHomeDanger(capture: AiRuntimeProductionCaptureV1, homeId: string, raiderIds: readonly string[]) {
  return capture.facts.flatMap((fact) => {
    if (fact.kind !== "decision_selected" || fact.tick > 3000) return [];
    const input = fact.decision.input, observation = input?.observation;
    if (!input || input.gaps.length || input.snapshotRestoreInProgress || observation?.tick !== fact.tick) return [];
    const home = observation.actors.find((actor) => actor.actorId === homeId && actor.relation === "self");
    if (home?.logicalPosition.status !== "known") return [];
    const position = home.logicalPosition.value;
    const threats = observation.actors.filter((actor) => raiderIds.includes(actor.actorId) && actor.visibility === "visible" &&
      actor.relation === "enemy" && actor.logicalPosition.status === "known" && actor.combatProfile?.status === "known" &&
      actor.combatProfile.value.attacks.some((attack) => attack.damage > 0 && attack.targetDomains.includes("ground")) &&
      Math.abs(actor.logicalPosition.value.x - position.x) + Math.abs(actor.logicalPosition.value.y - position.y) <= 12
    );
    return threats.length >= 2 ? [{ fact, home }] : [];
  });
}
