import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

export function nativePresetControlSucceeded(
  fact: Extract<AiRuntimeProductionFactV1, { kind: "preset_control" }>, id: string
): boolean {
  const commandId = fact.control.command?.execution?.commandId;
  return fact.control.id === id && fact.control.phase === "applied" && !!commandId &&
    fact.control.outcomes.some((outcome) => outcome.commandId === commandId && outcome.reason === "applied" &&
      ["applied", "active", "completed"].includes(outcome.kind));
}

/** Paid native output, unique creation and legal spawn share the exact original item identity. */
export function nativePaidMissionOutputs(context: ReturnType<typeof nativeScenarioContext>) {
  return context.facts.flatMap((fact) => {
    if (fact.kind !== "queue_completion" || fact.completion.phase !== "after") return [];
    const value = fact.completion, actor = value.createdActor, item = value.item;
    if (!actor?.actorId || !actor.canonicalObjectName || !item || !actor.indexed || !actor.alive || !actor.finished ||
        actor.playerNumber !== 2 ||
        value.snapshotRestoreInProgress || value.gaps.length || !value.createdActorInProducerScene ||
        actor.canonicalObjectName !== value.requestedCanonicalObjectName) return [];
    const charges = context.facts.filter((entry) => entry.kind === "queue_resource" &&
      entry.resource.itemId === item.itemId && entry.resource.actorId === value.actorId &&
      entry.resource.operation === "immediate_charge" && entry.resource.emission.phase === "finished" &&
      entry.resource.emission.status === "returned" && entry.resource.emission.callbackCount === 1 &&
      entry.resource.emission.balanceMatches && !entry.resource.emission.nestedEmission &&
      !entry.resource.emission.snapshotRestoreInProgress && !entry.resource.gaps.length &&
      entry.resource.storedPrice && entry.resource.emission.requested &&
      Object.values(ResourceType).every((resource) => (entry.resource.storedPrice?.[resource] ?? 0) ===
        (entry.resource.emission.requested?.[resource] ?? 0)) &&
      Object.values(entry.resource.storedPrice).some((amount) => amount > 0));
    const spawn = context.facts.some((entry) => entry.kind === "spatial_authority" && entry.spatial.kind === "spawn" &&
      entry.spatial.item.itemId === item.itemId && entry.spatial.producer.actorId === value.actorId &&
      entry.spatial.tile && entry.spatial.sceneActive && !entry.spatial.snapshotRestoreInProgress && !entry.spatial.gaps.length);
    const unique = context.facts.filter((entry) => entry.kind === "queue_completion" && entry.completion.phase === "after" &&
      entry.completion.item?.itemId === item.itemId).length === 1;
    return charges.length === 1 && spawn && unique ? [{ fact, actor, item, objectName: actor.canonicalObjectName }] : [];
  });
}

/** Native damage identifies a living-compatible objective effect; the selected squad label alone is insufficient. */
export function nativeUsefulMissionMembers(context: ReturnType<typeof nativeScenarioContext>, targetId: string, fromTick = 0) {
  return new Set(nativeWeaponHits(context, targetId, fromTick).flatMap((fact) => fact.kind === "native_damage" &&
    fact.damage.initiator?.actorId ? [fact.damage.initiator.actorId] : []));
}

/** Exact carrier membership before sailing, native transit and actual uncontained living passengers after unload. */
export function nativeLandingFailures(context: ReturnType<typeof nativeScenarioContext>, prefix: "raid" | "escort") {
  const failures: string[] = [], carrier = context.roles[`${prefix}-carrier`];
  const passengers = prefix === "raid" ? Array.from({ length: 4 }, (_, i) => context.roles[`raider-${i}`]) :
    [context.roles["escort-worker"]];
  const capture = prefix === "raid" ? context.opponent : context.capture;
  const controlTick = (id: string, fallback: number) => capture?.facts.find(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "preset_control" }> =>
      fact.kind === "preset_control" && fact.control.id === id && fact.control.phase === "requested"
  )?.control.scheduledTick ?? fallback;
  const sailTick = controlTick(`${prefix}-sail`, prefix === "raid" ? 500 : 600);
  const unloadTick = controlTick(`${prefix}-unload`, prefix === "raid" ? 900 : 1200);
  const loaded = context.frames.find((frame) => frame.tick < sailTick && frame.tacticalBoundary?.actors.some((actor) =>
    actor.identity.actorId === carrier && passengers.every((id) => !!id && actor.passengerIds?.includes(id))));
  const unloaded = context.frames.find((frame) => frame.tick >= unloadTick && frame.tick <= unloadTick + 200 &&
    frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === carrier && actor.passengerIds?.length === 0) &&
    passengers.every((id) => frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === id &&
      actor.identity.alive && actor.identity.active && actor.containerId === null && actor.tile &&
      actor.tile.x >= 28 && actor.tile.y >= (prefix === "raid" ? 17 : 30))));
  if (!carrier || !loaded || !unloaded || !capture ||
      runtimeControlTransitFailures(capture, `${prefix}-sail`, unloadTick, "arrive").length)
    failures.push("mission_real_board_sail_unload_missing");
  if (!capture?.facts.some((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "preset_control" }> =>
      fact.kind === "preset_control" && nativePresetControlSucceeded(fact, `${prefix}-unload`)))
    failures.push("mission_native_unload_application_missing");
  return failures;
}
