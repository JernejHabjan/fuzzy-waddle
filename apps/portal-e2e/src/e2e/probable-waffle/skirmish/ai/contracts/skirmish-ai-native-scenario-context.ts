import type { AiRuntimeProductionFact } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeVariantResult } from "../runner/skirmish-ai-runtime-variant-result";
import { runtimeClosedHistoryFailures } from "../capture/skirmish-ai-runtime-closed-history";
import { normalizeRuntimeMovement } from "../navigation/skirmish-ai-runtime-movement-normalization";
import { nativeDamageMatches } from "../combat/effects/skirmish-ai-native-damage";

/** Broad resource history is unnecessary where the scenario binds its exact native transaction and outcome. */
export function nativeScenarioRequiresResourceCoverage(scenarioId: string): boolean {
  return (
    !scenarioId.startsWith("PLACE-") &&
    !scenarioId.startsWith("WALL-") &&
    !scenarioId.startsWith("SCOUT-") &&
    !scenarioId.startsWith("DOMAIN-") &&
    !scenarioId.startsWith("FIGHT-") &&
    !["STRAT-02", "STRAT-03", "STRAT-04", "STRAT-05", "RAID-01", "RAID-02", "RAID-03"].includes(scenarioId) &&
    ![
      "EXP-01",
      "PRO-05",
      "H-06",
      "H-07",
      "H-10",
      "H-11",
      "H-12",
      "H-13",
      "H-14",
      "H-15",
      "H-19",
      "H-22",
      "H-03",
      "H-24",
      "H-26",
      "H-27",
      "H-28",
      "H-30",
      "C-01",
      "STRAT-07",
      "STRAT-09",
      "STRAT-12",
      "STRAT-13",
      "C-05",
      "C-04"
    ].includes(scenarioId)
  );
}

/** One projection of existing raw authority, shared by the ID-specific assertions. No additional match/report interpreter. */
export function nativeScenarioContext(
  result: RuntimeVariantResult,
  latestTick: number,
  terminalHorizon?: number,
  options: { readonly requireResourceCoverage?: boolean } = {}
) {
  const capture = sealCapturedFacts(result.productionCapture, latestTick);
  const opponent = sealCapturedFacts(result.opponentCapture, latestTick);
  const otherOpponents = result.otherOpponentCaptures?.map((other) => sealCapturedFacts(other, latestTick) ?? other);
  const failures = [
    ...runtimeClosedHistoryFailures(result.productionCapture, latestTick, terminalHorizon),
    ...runtimeClosedHistoryFailures(result.opponentCapture, latestTick, terminalHorizon).map(
      (failure) => `opponent:${failure}`
    ),
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
    (fact): fact is Extract<AiRuntimeProductionFact, { kind: "decision_selected" }> =>
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
    ...(otherOpponents ?? []).flatMap((other) => other.facts)
  ].sort((a, b) => a.sequence - b.sequence);
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
  const sealedResult: RuntimeVariantResult = {
    ...result,
    productionCapture: capture,
    opponentCapture: opponent,
    otherOpponentCaptures: otherOpponents,
    checkpoints: result.checkpoints?.filter((checkpoint) => checkpoint.tick <= latestTick) ?? [],
    perturbations: result.perturbations?.filter((event) => event.tick <= latestTick) ?? []
  };
  return { result: sealedResult, capture, opponent, frames, facts, roles, role, arrived, damageTo, failures };
}

/** Advancing one frame seals the requested tick and may also emit events belonging to the next tick. */
function sealCapturedFacts(
  capture: RuntimeVariantResult["productionCapture"],
  throughTick: number
): RuntimeVariantResult["productionCapture"] {
  if (!capture) return undefined;
  return {
    ...capture,
    facts: capture.facts.filter((fact) => fact.tick <= throughTick),
    snapshots: capture.snapshots?.filter((snapshot) => snapshot.tick <= throughTick) ?? [],
    recipientResourceFacts: capture.recipientResourceFacts?.filter((fact) => fact.tick <= throughTick),
    movementQueries: capture.movementQueries?.filter((query) => query.tick <= throughTick)
  };
}
