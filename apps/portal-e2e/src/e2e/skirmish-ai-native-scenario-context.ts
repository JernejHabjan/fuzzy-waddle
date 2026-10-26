import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { runtimeClosedHistoryFailures } from "./skirmish-ai-runtime-closed-history";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";
import { nativeDamageMatches } from "./skirmish-ai-native-damage";

/** Broad resource history is unnecessary where the scenario binds its exact native transaction and outcome. */
export function nativeScenarioRequiresResourceCoverage(scenarioId: string): boolean {
  return (
    !scenarioId.startsWith("PLACE-") &&
    !scenarioId.startsWith("WALL-") &&
    !scenarioId.startsWith("SCOUT-") &&
    !scenarioId.startsWith("DOMAIN-") &&
    !["EXP-01", "H-06", "H-07", "H-10", "H-12", "H-13", "H-14", "H-15", "H-22", "H-27", "H-28", "H-30"].includes(scenarioId)
  );
}

/** One projection of existing raw authority, shared by the ID-specific assertions. No additional match/report interpreter. */
export function nativeScenarioContext(
  result: RuntimeVariantResultV1,
  latestTick: number,
  terminalHorizon?: number,
  options: { readonly requireResourceCoverage?: boolean } = {}
) {
  const capture = result.productionCapture,
    opponent = result.opponentCapture;
  const failures = [
    ...runtimeClosedHistoryFailures(capture, latestTick, terminalHorizon),
    ...runtimeClosedHistoryFailures(opponent, latestTick, terminalHorizon).map((failure) => `opponent:${failure}`),
    ...(result.otherOpponentCaptures ?? []).flatMap((other) => [
      ...runtimeClosedHistoryFailures(other, latestTick, terminalHorizon),
      ...(JSON.stringify(other.setup) !== JSON.stringify(capture?.setup) ||
      other.playerNumber < 3 ||
      (options.requireResourceCoverage !== false && other.resourceCoverage?.lost)
        ? ["native_other_opponent_capture_invalid"]
        : [])
    ])
  ];
  if (
    options.requireResourceCoverage !== false &&
    (capture?.resourceCoverage?.lost || opponent?.resourceCoverage?.lost)
  )
    failures.push("native_capture_channel_lost");
  const frames = (capture?.facts ?? []).filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "decision_selected" }> =>
      fact.kind === "decision_selected" && fact.tick <= latestTick
  );
  if (
    !frames.length ||
    frames.some(
      ({ tick, decision, tacticalBoundary: native }) =>
        !decision.input?.observation ||
        decision.input.observation.tick !== tick ||
        decision.identity.tick !== tick ||
        decision.input.gaps.length ||
        decision.input.snapshotRestoreInProgress ||
        decision.input.cadence.clock !== "simulation" ||
        !decision.missionState ||
        !native ||
        native.tick !== tick ||
        native.gaps.length ||
        native.snapshotRestoreInProgress ||
        native.playerNumber !== capture?.playerNumber ||
        native.informationPolicy !== "skirmish"
    )
  )
    failures.push("native_decision_or_mission_boundary_missing");
  if (
    !capture?.setup ||
    capture.setupGaps?.length ||
    !opponent?.setup ||
    opponent.setupGaps?.length ||
    capture.playerNumber !== 2 ||
    opponent.playerNumber !== 1 ||
    !result.productionPreset ||
    result.productionPreset.fixtureId !== result.presetFixtureId ||
    JSON.stringify(capture.setup) !== JSON.stringify(opponent.setup)
  )
    failures.push("native_scenario_setup_not_bound");
  const movements = capture
    ? normalizeRuntimeMovement(capture)
    : { failures: ["native_movement_missing"], movements: [] };
  failures.push(...movements.failures);
  const roles = result.presetCreatedActorIds;
  /** A missing authored actor must fail the oracle, never widen a target-specific query to every actor. */
  const role = (name: string): string => {
    const id = roles[name];
    if (!id) throw new Error(`native_required_actor_role_missing:${name}`);
    return id;
  };
  const facts = [
    ...(capture?.facts ?? []),
    ...(opponent?.facts ?? []),
    ...(result.otherOpponentCaptures ?? []).flatMap((other) => other.facts)
  ]
    .filter((fact) => fact.tick <= latestTick)
    .sort((a, b) => a.sequence - b.sequence);
  const arrived = (actorId?: string, afterTick = 0) =>
    movements.movements.filter(
      (movement) =>
        movement.callerAttributed &&
        !movement.gaps.length &&
        movement.returned === "true" &&
        movement.arrival === "original_destination" &&
        movement.started.tick >= afterTick &&
        movement.started.tick <= latestTick &&
        movement.observations.every((entry) => entry.tick <= latestTick) &&
        movement.observations[0]?.spatial.source.actorId === actorId &&
        movement.observations[0]?.spatial.caller?.order?.commandContext?.execution.source === "ai"
    );
  const damageTo = (actorId?: string, afterTick = 0) =>
    facts.filter((fact) => fact.tick >= afterTick && !!actorId && nativeDamageMatches(fact, actorId, 2));
  const selectedActorIds = (frame: (typeof frames)[number]) =>
    frame.decision.acceptedIntents.flatMap((intent) =>
      "actorIds" in intent
        ? [...intent.actorIds]
        : "actorId" in intent
          ? [intent.actorId]
          : "builderIds" in intent
            ? [...intent.builderIds]
            : "producerId" in intent
              ? [intent.producerId]
              : []
    );
  for (const frame of frames) {
    const members =
      frame.decision.missionState?.squads
        .filter((squad) => !["completed", "cancelled"].includes(squad.state))
        .flatMap((squad) => squad.actorIds) ?? [];
    if (members.length !== new Set(members).size) failures.push("native_actor_owned_by_multiple_squads");
    const commanded = selectedActorIds(frame);
    if (commanded.length !== new Set(commanded).size) failures.push("native_actor_commanded_twice_in_decision");
  }
  return { result, capture, opponent, frames, facts, roles, role, arrived, damageTo, failures };
}
