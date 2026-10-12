import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import { evaluateRuntimeProductionSchedule } from "./skirmish-ai-runtime-production-schedule-evaluation";
import { evaluateRuntimeProductionRecovery } from "./skirmish-ai-runtime-production-recovery-evaluation";
import {
  evaluateRuntimeProductionQueueAuthority,
  evaluateRuntimeProductionQueuePayments
} from "./skirmish-ai-runtime-production-queue-authority-evaluation";

/** Full runtime rows require V2. The retained V1 pure controls are diagnostic regressions, not runtime certification. */
export function evaluateRuntimeProductionAuthority(
  scenarioId: string,
  contract: RuntimeProductionContractV1 | undefined,
  evidence: RuntimeProductionEvidenceV2 | undefined
): string[] {
  if (!["PRO-03", "PRO-06", "PRO-07"].includes(scenarioId)) return [];
  if (!contract || contract.scenarioId !== scenarioId) return ["production_contract_missing"];
  if (!evidence || evidence.schemaVersion !== 2) return ["production_v2_evidence_missing"];
  const failures = [...evidence.failures, ...evidence.gaps.map((gap) => `production_v2_gap:${gap}`)];
  if (!evidence.setup?.digest || !evidence.decisions.length) failures.push("production_v2_setup_or_decisions_missing");
  const history = evidence.coverage;
  if (
    history &&
    evidence.decisions.some((entry) => {
      const transition = entry.result.economyProduction.transition;
      return (
        transition?.status === "committed" &&
        [transition.beginsTick, transition.forceDeadlineTick].some((tick) => !history.requiredTicks.includes(tick))
      );
    })
  )
    failures.push("production_v2_commitment_frontiers_missing");
  if (
    !history ||
    history.latestTick !== contract.latestTick ||
    history.closedThroughTick !== contract.latestTick ||
    !history.intervals.length ||
    history.gaps.length ||
    history.intervals.some(
      (interval, index) =>
        !Number.isSafeInteger(interval.closedThroughTick) ||
        interval.closedThroughTick < interval.closedFromTick ||
        interval.capturedAtTick !== interval.closedThroughTick + 1 ||
        interval.closedFromTick !== (index ? (history.intervals[index - 1]?.closedThroughTick ?? -2) + 1 : 0) ||
        interval.afterSequence < (index ? (history.intervals[index - 1]?.afterSequence ?? Infinity) : 0)
    ) ||
    history.intervals.at(-1)?.closedThroughTick !== contract.latestTick ||
    history.requiredTicks.some((tick) => !history.intervals.some((interval) => interval.closedThroughTick === tick))
  ) {
    failures.push("production_v2_closed_history_invalid");
  }
  if (
    evidence.decisions.some(
      (decision, index) =>
        decision.inputTick !== decision.result.identity.tick ||
        decision.inputGeneration !== decision.result.identity.generation ||
        decision.inputTick > decision.selectedTick ||
        decision.result.input?.observation?.tick !== decision.inputTick ||
        decision.result.input?.cadence.tick !== decision.selectedTick ||
        decision.selectedSequence <= (index ? (evidence.decisions[index - 1]?.selectedSequence ?? Infinity) : 0)
    )
  ) {
    failures.push("production_v2_decision_clocks_invalid");
  }
  if (
    !Number.isSafeInteger(contract.stableForTicks) ||
    contract.stableForTicks <= 0 ||
    contract.latestTick <= contract.stableForTicks
  )
    failures.push("production_v2_contract_horizon_invalid");
  if (
    evidence.decisions.some(
      (entry, index) =>
        entry.result.input?.cadence.clock !== "simulation" ||
        (index === 0
          ? entry.result.identity.decisionSequence !== 1 || entry.result.input.cadence.completedBefore !== 0
          : entry.result.identity.authorityEpoch !== evidence.decisions[index - 1]?.result.identity.authorityEpoch ||
            entry.result.identity.decisionSequence !==
              (evidence.decisions[index - 1]?.result.identity.decisionSequence ?? -1) + 1)
    )
  ) {
    failures.push("production_v2_decision_history_incomplete");
  }
  if (
    evidence.lifecycle.queues.some(
      (event) =>
        event.applicationTick !== event.tick ||
        (event.selectedSequence !== null &&
          !evidence.decisions.some(
            (decision) =>
              decision.selectedSequence === event.selectedSequence && decision.selectedTick <= event.applicationTick
          ))
    )
  ) {
    failures.push("production_v2_applied_event_clock_invalid");
  }
  if (failures.length) return [...new Set(failures)];
  if (scenarioId !== "PRO-07") failures.push(...evaluateRuntimeProductionQueuePayments(evidence));
  return [
    ...new Set([
      ...failures,
      ...(scenarioId === "PRO-03"
        ? evaluateRuntimeProductionSchedule(contract, evidence)
        : scenarioId === "PRO-06"
          ? evaluateRuntimeProductionRecovery(contract, evidence)
          : evaluateRuntimeProductionQueueAuthority(contract, evidence))
    ])
  ];
}

/** Exact state at a closed deadline; interval membership is valid only after complete coverage validation. */
export function productionWorldAt(evidence: RuntimeProductionEvidenceV2, tick: number) {
  return evidence.coverage?.intervals.find(
    (interval) => interval.closedFromTick <= tick && interval.closedThroughTick >= tick
  );
}

/** Retains the exact registered actor throughout the full interval; a replacement name/count never satisfies this. */
export function productionActorRetained(
  evidence: RuntimeProductionEvidenceV2,
  actorId: string,
  from: number,
  through: number
) {
  const intervals =
    evidence.coverage?.intervals.filter(
      (interval) => interval.closedThroughTick >= from && interval.closedFromTick <= through
    ) ?? [];
  return (
    !evidence.lifecycle.losses.some((loss) => loss.actorId === actorId && loss.tick >= from && loss.tick <= through) &&
    !!productionWorldAt(evidence, from) &&
    !!productionWorldAt(evidence, through) &&
    intervals.every((interval) =>
      interval.actors.some(
        (actor) =>
          actor.identity.actorId === actorId &&
          actor.identity.alive &&
          actor.identity.active &&
          actor.identity.indexed &&
          actor.identity.finished
      )
    )
  );
}
