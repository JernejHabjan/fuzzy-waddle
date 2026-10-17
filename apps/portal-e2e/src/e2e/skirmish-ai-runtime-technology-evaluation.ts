import type { RuntimeTechnologyContract } from "./skirmish-ai-runtime-technology-contract";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

/** Independent research application/completion and counter delivery; a ledger target alone never passes. */
export function evaluateRuntimeTechnology(
  scenarioId: string,
  contract: RuntimeTechnologyContract | undefined,
  variant: Pick<RuntimeVariantResultV1, "productionEvidenceV2" | "checkpoints">
): string[] {
  if (!scenarioId.startsWith("TECH-")) return [];
  if (!contract) return ["technology_contract_missing"];
  const branches: Readonly<Record<string, readonly string[]>> = {
    "TECH-01": ["small_army", "mass_army"],
    "TECH-02": ["emergency"],
    "TECH-03": ["air_clue", "air_mass"],
    "TECH-04": ["air_mass"],
    "TECH-05": ["stale_counter"],
    "TECH-06": ["matchup"]
  };
  if (
    !branches[scenarioId]?.includes(contract.branch) ||
    !Number.isSafeInteger(contract.latestTick) ||
    contract.latestTick <= 0 ||
    !contract.productObjectName
  )
    return ["technology_contract_invalid"];
  const evidence = variant.productionEvidenceV2;
  if (
    !evidence?.setup ||
    evidence.coverage?.closedThroughTick !== contract.latestTick ||
    evidence.coverage.gaps.length ||
    evidence.gaps.length ||
    evidence.failures.length ||
    evidence.lifecycle.gaps.length ||
    evidence.lifecycle.failures.length ||
    !evidence.decisions.length ||
    evidence.decisions.some(
      (decision) => !decision.result.input?.observation || !decision.result.input.capabilityCatalog
    )
  )
    return ["technology_native_history_missing"];
  const failures: string[] = [];
  const decisions = evidence.decisions;
  const intents = decisions.flatMap((decision) => decision.result.acceptedIntents);
  const research = intents.filter(
    (intent) => intent.kind === "research" && intent.researchType === contract.researchType
  );
  const complete = evidence.lifecycle.queues.filter(
    (event) =>
      event.kind === "complete" &&
      event.productKey === contract.researchType &&
      research.some((intent) => intent.effectId.replace(/^effect:/, "") === event.effectId)
  );
  if (["small_army", "mass_army", "emergency"].includes(contract.branch)) {
    const first = decisions[0]?.result.input?.observation;
    const beneficiaries =
      first?.actors.filter((actor) => actor.relation === "self" && actor.objectName === contract.productObjectName)
        .length ?? 0;
    if (contract.branch === "small_army") {
      if (beneficiaries > 1 || research.length) failures.push("technology_small_army_upgraded");
    } else {
      if (beneficiaries < (contract.minimumBeneficiaries ?? 4)) failures.push("technology_beneficiaries_missing");
      if (
        contract.branch === "mass_army" &&
        (complete.length !== 1 ||
          !evidence.coverage.intervals.at(-1)?.completedResearch.some((key) => key === contract.researchType))
      )
        failures.push("technology_research_not_completed_once");
    }
    if (contract.branch === "emergency") {
      const threatened = decisions.filter(
        (decision) => (decision.result.input?.observation?.threatSummary.visibleEnemyActorIds.length ?? 0) > 0
      );
      if (!threatened.length) failures.push("technology_emergency_precondition_missing");
      if (threatened.some((decision) => decision.result.acceptedIntents.some((intent) => intent.kind === "research")))
        failures.push("technology_spent_during_emergency");
      if (
        !evidence.lifecycle.queues.some(
          (event) =>
            event.kind === "enqueue" &&
            research.some((intent) => intent.effectId.replace(/^effect:/, "") === event.effectId)
        )
      )
        failures.push("technology_research_not_resumed");
    }
  } else if (["air_clue", "air_mass", "stale_counter"].includes(contract.branch)) {
    const targets = decisions
      .flatMap((decision) => decision.result.economyProduction.adaptation.activeRoleTargets)
      .filter((target) => target.role === "anti_air");
    const desired = Math.max(0, ...targets.map((target) => target.desired));
    if (desired !== contract.counterCount) failures.push("technology_counter_scale_mismatch");
    const counterIntents = intents.filter(
      (intent) => intent.kind === "produce" && intent.demandId === "demand:adapt:anti_air"
    );
    const outputs = evidence.lifecycle.queues.filter(
      (event) =>
        event.kind === "complete" &&
        event.createdActorId &&
        counterIntents.some(
          (intent) =>
            intent.kind === "produce" &&
            intent.effectId.replace(/^effect:/, "") === event.effectId &&
            intent.objectName === event.productKey &&
            intent.producerId === event.actorId &&
            decisions.some((decision) =>
              decision.result.input?.capabilityCatalog?.entries.some(
                (entry) => entry.sourceObjectName === intent.objectName && entry.targetDomains.includes("air")
              )
            )
        )
    );
    if (!outputs.length) failures.push("technology_counter_not_delivered");
    if (
      contract.branch === "air_mass" &&
      new Set(outputs.map((event) => event.createdActorId)).size < (contract.counterCount ?? 1)
    )
      failures.push("technology_counterforce_incomplete");
    if (contract.branch === "stale_counter") {
      const late = decisions.filter((decision) => decision.selectedTick > (contract.withdrawnTick ?? 0) + 200);
      if (
        !late.length ||
        late.some((decision) =>
          decision.result.acceptedIntents.some(
            (intent) => intent.kind === "produce" && intent.demandId === "demand:adapt:anti_air"
          )
        )
      )
        failures.push("technology_stale_counter_production");
      if (evidence.lifecycle.queues.some((event) => event.kind === "cancel"))
        failures.push("technology_cancelled_useful_queue");
    }
  } else if (contract.branch === "matchup") {
    if (
      contract.unavailableProductObjectName &&
      decisions[0]?.result.input?.capabilityCatalog?.entries.some(
        (entry) => entry.sourceObjectName === contract.unavailableProductObjectName
      )
    )
      failures.push("technology_unavailable_counter_not_absent");
    if (
      decisions.some((decision) =>
        decision.result.acceptedIntents.some(
          (intent) =>
            intent.kind === "produce" &&
            intent.objectName === contract.unavailableProductObjectName &&
            !decision.result.input?.capabilityCatalog?.entries.some(
              (entry) => entry.sourceObjectName === intent.objectName
            )
        )
      )
    )
      failures.push("technology_invented_counter");
    if (
      contract.requiredRangedAlternative &&
      !decisions.some((decision) =>
        decision.result.acceptedIntents.some(
          (intent) =>
            intent.kind === "attack" &&
            intent.actorIds.some((id) =>
              decision.result.input?.observation?.actors.some(
                (actor) =>
                  actor.actorId === id &&
                  actor.combatProfile?.status === "known" &&
                  actor.combatProfile.value.attacks.some((attack) => attack.range >= 4)
              )
            )
        )
      )
    )
      failures.push("technology_ranged_alternative_unused");
    if (
      !decisions.some((decision) =>
        decision.result.input?.observation?.actors.some(
          (actor) =>
            actor.relation === "enemy" &&
            actor.visibility === "visible" &&
            actor.combatProfile?.status === "known" &&
            actor.combatProfile.value.maxArmour > 0
        )
      )
    )
      failures.push("technology_effective_matchup_missing");
    if (
      !intents.some((intent) => intent.kind === "attack") ||
      !variant.checkpoints.some((checkpoint) => (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > 0)
    )
      failures.push("technology_useful_matchup_effect_missing");
  }
  return failures;
}
