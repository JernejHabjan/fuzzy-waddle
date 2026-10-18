import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { FortificationAccessBranch } from "./skirmish-ai-fortification-access-branch";
import { runtimeClosedHistoryFailures } from "./skirmish-ai-runtime-closed-history";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";

/** Physical prefab-owner controls require movement and closed native position, independent of planner graph/arrival labels. */
export function evaluateFortificationAccessWorld(
  branch: FortificationAccessBranch,
  result: Pick<RuntimeVariantResultV1, "presetCreatedActorIds" | "perturbations">,
  capture: AiRuntimeProductionCaptureV1 | undefined
): string[] {
  const failures = runtimeClosedHistoryFailures(capture, 800);
  if (!capture || failures.length) return failures;
  if (capture.playerNumber !== 1 || capture.setup?.tick !== 0) return ["fortification_native_setup_missing"];
  const probeId = result.presetCreatedActorIds["passage-probe"], targetId = result.presetCreatedActorIds["passage-target"];
  const probe = capture.setup.actors.find((actor) => actor.actorId === probeId);
  const target = capture.setup.actors.find((actor) => actor.actorId === targetId);
  if (!probe || !target || probe.position.z !== 0 || !probeId || !targetId || probeId === targetId) {
    return ["fortification_original_probe_or_target_missing"];
  }
  const blocked = ["stairs_missing", "sealed", "breach"].includes(branch);
  failures.push(...runtimeControlTransitFailures(capture, "initial-transit", branch === "breach" ? 199 : 800,
    blocked ? "blocked" : "arrive"));
  const initial = capture.facts.find((fact) => fact.kind === "preset_control" && fact.control.id === "initial-transit" &&
    fact.control.phase === "applied"
  );
  if (initial?.kind !== "preset_control" || initial.control.command?.type !== "MOVE") {
    return [...failures, "fortification_native_destination_missing"];
  }
  const destination = initial.control.command.tileVec3;
  const states = capture.frontiers?.intervals ?? [];
  const initialProbe = states[0]?.actors.find(({ identity }) => identity.actorId === probeId);
  if (!initialProbe?.tile || (initialProbe.tile.x === destination.x && initialProbe.tile.y === destination.y)) {
    failures.push("fortification_probe_already_at_destination");
  }
  if (branch === "stairs_present") {
    const content = capture.setup.content.find((entry) => entry.objectName === "Wall")?.definition;
    const components = content && typeof content === "object" && "components" in content ? content.components : undefined;
    const navigable = components && typeof components === "object" && "navigable" in components ? components.navigable : undefined;
    const height = navigable && typeof navigable === "object" && "navigableHeight" in navigable ? navigable.navigableHeight : undefined;
    if (typeof height !== "number" || !Number.isFinite(height) || height <= 0 || !states.some((interval) =>
      interval.closedFromTick >= 100 && interval.actors.some((actor) => actor.identity.actorId === probeId &&
        actor.identity.active && actor.identity.alive && actor.tile?.x === destination.x && actor.tile.y === destination.y &&
        actor.position?.z === height)
    )) failures.push("fortification_native_elevated_occupancy_missing");
  }
  if (blocked && states.some((interval) => interval.closedThroughTick < (branch === "breach" ? 200 : 801) &&
    interval.actors.some((actor) => actor.identity.actorId === probeId && actor.tile?.x === destination.x &&
      actor.tile.y === destination.y)
  )) failures.push("fortification_blocked_probe_reached_destination");
  if (branch === "breach") {
    const wallId = result.presetCreatedActorIds["entrance-wall"];
    const event = result.perturbations.find((entry) => entry.id === "open-native-breach");
    if (!wallId || event?.tick !== 200 || event.affectedActorId !== wallId || event.dispatchedActors !== 1 ||
        !capture.facts.some((fact) => fact.kind === "actor_unregistered" && fact.actorId === wallId && fact.tick >= 200)) {
      failures.push("fortification_original_native_breach_missing");
    }
    failures.push(...runtimeControlTransitFailures(capture, "breach-transit", 800, "arrive"));
  }
  return [...new Set(failures)];
}
