import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { ExpansionBranch } from "./skirmish-ai-expansion-branch";
import { EXPANSION_HOME_RAIDER_ROLES } from "./skirmish-ai-expansion-branch";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { expansionEffectMatchesExecution, expansionServiceFailures } from "./skirmish-ai-expansion-service-evaluation";
import { expansionPressureResolution } from "./skirmish-ai-expansion-pressure-resolution";
import { nativeDamageMatches } from "./skirmish-ai-native-damage";
import { expansionHomeDanger } from "./skirmish-ai-expansion-home-danger";

/** Withdrawal recovery starts once observed sustained home danger has cleared; movement completion is checked separately. */
export function expansionRecoveryBoundary(
  branch: ExpansionBranch,
  withdrawalClear: { tick: number; sequence: number } | undefined,
  resolution: { resolvedTick: number | undefined; resolvedSequence: number | undefined }
): { tick: number; sequence: number } | undefined {
  if (branch === "pressure_withdrawn") return withdrawalClear;
  if (branch === "combat_resolved" && resolution.resolvedTick !== undefined && resolution.resolvedSequence !== undefined)
    return { tick: resolution.resolvedTick, sequence: resolution.resolvedSequence };
  return undefined;
}

/** A service selected from the first complete clear observation is itself an actionable recovery response. */
export function isAtOrAfterRecoveryBoundary(
  tick: number,
  sequence: number,
  boundary: { tick: number; sequence: number }
): boolean {
  return tick > boundary.tick || tick === boundary.tick && sequence >= boundary.sequence;
}

/** Find a confirmed clear interval after danger; one missing or incomplete sample cannot end pressure. */
export function firstSustainedClearBoundary(
  observations: readonly { tick: number; sequence: number; dangerous: boolean; complete: boolean }[],
  afterTick: number,
  throughTick: number,
  requiredClearObservations = 2
): { tick: number; sequence: number } | undefined {
  let observedDanger = false;
  const clear: { tick: number; sequence: number }[] = [];
  for (const observation of observations) {
    if (observation.tick < afterTick) continue;
    if (observation.tick > throughTick) break;
    if (observation.dangerous) {
      observedDanger = true;
      clear.length = 0;
      continue;
    }
    if (!observedDanger || !observation.complete) {
      clear.length = 0;
      continue;
    }
    clear.push(observation);
    if (clear.length >= requiredClearObservations) return { tick: clear[0].tick, sequence: clear[0].sequence };
  }
  return undefined;
}

/** Real home danger, damage and survival precede suppression; the full matrix also requires a productive safe pair. */
export function expansionPressureFailures(
  branch: ExpansionBranch,
  result: Pick<RuntimeVariantResultV1, "productionCapture" | "presetCreatedActorIds">,
  human: AiRuntimeProductionCaptureV1
): string[] {
  if (branch === "expand" || branch === "served") return [];
  const capture = result.productionCapture, homeId = result.presetCreatedActorIds["original-home"];
  const raiderIds = EXPANSION_HOME_RAIDER_ROLES.map((role) => result.presetCreatedActorIds[role]);
  const failures: string[] = [];
  if (!capture || !homeId || raiderIds.some((id) => !id)) return ["expansion_pressure_original_roles_missing"];
  const originalRaiders = raiderIds.filter((id): id is string => !!id);
  const source = capture.facts.flatMap((fact) => fact.kind === "decision_selected"
    ? fact.decision.input?.observation?.actors.filter((actor) =>
      actor.actorId === result.presetCreatedActorIds["safe-source"] && actor.logicalPosition.status === "known") ?? [] : []
  )[0];
  if (source?.logicalPosition.status !== "known") return ["expansion_pressure_fair_remote_source_missing"];
  const sourcePosition = source.logicalPosition.value;
  const homeName = capture.setup?.actors.find((actor) => actor.actorId === homeId)?.definition.name;
  const remoteService = (intent: AiIntentV1) => intent.kind === "construct" &&
    (intent.objectName === "WorkMill" || intent.objectName === homeName) &&
    Math.abs(intent.logicalPosition.x - sourcePosition.x) + Math.abs(intent.logicalPosition.y - sourcePosition.y) <= 12;
  for (const [index, raiderId] of originalRaiders.entries()) {
    const controlId = index ? `attack-original-home-${index}` : "attack-original-home";
    const attack = human.facts.find((fact) => fact.kind === "preset_control" && fact.control.id === controlId &&
      fact.control.phase === "applied"
    );
    if (attack?.kind !== "preset_control" || attack.control.command?.type !== "ACTOR_ACTION" ||
        attack.control.actorId !== raiderId || attack.control.command.execution?.source !== "human" ||
        attack.control.command.playerNumber !== 1 || attack.control.command.actorIds.length !== 1 ||
        attack.control.command.actorIds[0] !== raiderId || attack.control.command.orderType !== "Attack" ||
        !attack.control.command.targetObjectIds?.includes(homeId) || !attack.control.outcomes.some((outcome) =>
          outcome.kind === "applied" && outcome.reason === "applied" &&
          outcome.commandId === attack.control.command?.execution?.commandId)) {
      failures.push(`expansion_pressure_native_attack_not_applied:${raiderId}`);
    }
  }
  const pressured = expansionHomeDanger(capture, homeId, originalRaiders);
  if (pressured.length < 2) failures.push("expansion_pressure_has_no_sustained_fair_danger_window");
  if (!pressured.some(({ fact, home }) => home.healthPermille?.status === "known" && home.healthPermille.value <= 900 &&
    capture.facts.some((damage) => damage.tick <= fact.tick && originalRaiders.some((id) => nativeDamageMatches(damage, homeId, 1, id)))
  )) failures.push("expansion_pressure_has_no_native_serious_home_damage");
  if (pressured.some(({ fact }) => fact.decision.acceptedIntents.some(remoteService))) {
    failures.push("expansion_spent_on_overextension_during_home_pressure");
  }
  if (capture.frontiers?.intervals.some((interval) => !interval.actors.some(({ identity }) =>
    identity.actorId === homeId && identity.active && identity.alive && identity.finished && identity.indexed
  ))) failures.push("expansion_pressure_original_home_lost");
  if (branch === "pressure_withdrawn" || branch === "combat_resolved") {
    const resolution = expansionPressureResolution(human, originalRaiders, branch === "combat_resolved");
    failures.push(...resolution.failures);
    const appliedWithdrawalTicks = human.facts.flatMap((fact) => fact.kind === "preset_control" &&
      fact.control.id.startsWith("withdraw-home-pressure") && fact.control.phase === "applied" ? [fact.tick] : []);
    const withdrawalTick = appliedWithdrawalTicks.length === originalRaiders.length ? Math.max(...appliedWithdrawalTicks) : undefined;
    const dangerousSequences = new Set(pressured.map(({ fact }) => fact.sequence));
    const withdrawalClear = withdrawalTick !== undefined && resolution.resolvedTick !== undefined
      ? firstSustainedClearBoundary(capture.facts.flatMap((fact) => {
        if (fact.kind !== "decision_selected" || fact.tick < withdrawalTick || fact.tick > resolution.resolvedTick) return [];
        const input = fact.decision.input, observation = input?.observation;
        if (!input || input.gaps.length || input.snapshotRestoreInProgress || observation?.tick !== fact.tick) return [];
        const home = observation.actors.find((actor) => actor.actorId === homeId && actor.relation === "self");
        if (home?.logicalPosition.status !== "known") return [];
        const allRaidersKnown = originalRaiders.every((id) => {
          const raider = observation.actors.find((actor) => actor.actorId === id);
          const confirmedDead = human.facts.some((entry) => entry.kind === "actor_unregistered" &&
            entry.actorId === id && entry.actor?.playerNumber === 1 && entry.actor.alive === false && entry.tick <= fact.tick);
          return confirmedDead || raider?.visibility === "visible" && raider.relation === "enemy" &&
            raider.logicalPosition.status === "known" && raider.combatProfile.status === "known";
        });
        return [{ tick: fact.tick, sequence: fact.sequence, dangerous: dangerousSequences.has(fact.sequence),
          complete: allRaidersKnown }];
      }), withdrawalTick, resolution.resolvedTick) : undefined;
    const recoveryBoundary = expansionRecoveryBoundary(branch, withdrawalClear, resolution);
    const resumed = capture.facts.flatMap((fact) => fact.kind === "decision_selected" &&
      recoveryBoundary !== undefined &&
      isAtOrAfterRecoveryBoundary(fact.tick, fact.sequence, recoveryBoundary) &&
      !pressured.some((entry) => entry.fact.sequence === fact.sequence)
      ? fact.decision.acceptedIntents.flatMap((intent) => intent.kind === "construct" && remoteService(intent)
        ? [{ fact, intent }] : []) : []
    );
    if (!resumed.some(({ fact, intent }) => capture.facts.some((placement) => {
      if (placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement" ||
          placement.sequence <= fact.sequence) return false;
      const siteId = placement.spatial.site.actorId, command = placement.spatial.command.execution;
      const builderId = intent.builderIds[0];
      return !!siteId && !!builderId && command?.source === "ai" &&
        expansionEffectMatchesExecution(intent.effectId, command) &&
        !Object.values(result.presetCreatedActorIds).includes(siteId) &&
        expansionServiceFailures(result, siteId, command.commandId, builderId).length === 0;
    }))) failures.push("expansion_did_not_resume_productive_service_after_pressure_removed");
  }
  return failures;
}
