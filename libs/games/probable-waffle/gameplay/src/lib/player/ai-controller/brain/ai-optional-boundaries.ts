import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBoundaryFault } from "../contracts/ai-boundary-fault";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { assertAiBrainStateV1 } from "../contracts/validate-ai-brain-state-v1";
import { projectAiManagerState } from "./project-ai-manager-state";
import type { AiBrainBoundaryHooks } from "./ai-brain-boundary-hooks";

/** Repeated optional failures back off for 1, 2, 4 then 8 decision intervals, retaining their original incident. */
export function recordAiBoundaryFailure(
  owner: string, tick: number, cadence: number, records: readonly AiBoundaryFault[], error: unknown
): AiBoundaryFault[] {
  const previous = records.find((record) => record.owner === owner);
  const failures = Math.min(16, (previous?.failures ?? 0) + 1);
  const detail = error instanceof Error ? `${error.name}:${error.message}` : "unknown";
  const incident = { owner, failures, lastFailureTick: tick,
    retryAtTick: tick + cadence * 2 ** Math.min(3, failures - 1),
    reason: `technical_fault:${detail}`.slice(0, 128),
    recoveredTick: null } satisfies AiBoundaryFault;
  return [...records.filter((record) => record.owner !== owner), incident].sort((a, b) => a.owner.localeCompare(b.owner));
}

/** A successful retry marks recovery without erasing failure count/age, so save/load cannot restart the retry budget. */
export function recoverAiBoundary(owner: string, tick: number, records: readonly AiBoundaryFault[]): AiBoundaryFault[] {
  return records.map((record) => record.owner === owner && record.recoveredTick === null
    ? { ...record, recoveredTick: tick } : record);
}

/** Validate the entire optional batch before ranking or committing its patch; one bad output cannot partially publish. */
function assertBatch(batch: AiManagerProposalV1, owner: string, state: AiBrainStateV1, maximum: number): void {
  if (!batch || batch.managerId !== owner || !Array.isArray(batch.intents) || batch.intents.length > maximum ||
      !Array.isArray(batch.reasons) || batch.reasons.some((reason) => typeof reason !== "string") ||
      typeof batch.evaluated !== "boolean" || !["essential_economy", "supply_production", "scouting",
        "army_threat", "optional_infrastructure_tech"].includes(batch.lane)) throw new Error("invalid_optional_batch");
  if (batch.evaluatedLanes !== undefined && (!Array.isArray(batch.evaluatedLanes) ||
      batch.evaluatedLanes.some((lane) => !["essential_economy", "supply_production", "scouting",
        "army_threat", "optional_infrastructure_tech"].includes(lane)))) throw new Error("invalid_optional_lanes");
  for (const intent of batch.intents) {
    if (!Number.isSafeInteger(intent.utility) || intent.utility < 0 || intent.utility > 1000 ||
        !Number.isSafeInteger(intent.urgencyClass) || intent.urgencyClass < 0 ||
        !Number.isSafeInteger(intent.proposedTick) || intent.proposedTick < 0 ||
        !Array.isArray(intent.claims) || !Array.isArray(intent.preconditions)) throw new Error("invalid_optional_intent");
    if ((intent.kind === "produce" || intent.kind === "construct") && !Object.values(ObjectNames).includes(intent.objectName))
      throw new Error("invalid_optional_capability");
    for (const claim of intent.claims) {
      if (claim.kind === "resource" && (!Object.values(ResourceType).includes(claim.resourceType) ||
          !Number.isFinite(claim.amount) || claim.amount < 0)) throw new Error("invalid_optional_cost");
      if (claim.kind === "cargo_seat" && (!Number.isSafeInteger(claim.seats) || claim.seats < 1))
        throw new Error("invalid_optional_capacity");
    }
    for (const condition of intent.preconditions) {
      if ((condition.kind === "resource_at_least" || condition.kind === "supply_at_least") &&
          (!Number.isFinite(condition.amount) || condition.amount < 0)) throw new Error("invalid_optional_precondition");
    }
  }
  if (batch.spendingBudget && Object.values(batch.spendingBudget).some((value) =>
    !Number.isSafeInteger(value) || value < 0 || value > 1000)) throw new Error("invalid_optional_budget");
  if (batch.statePatch) assertAiBrainStateV1(projectAiManagerState(state, [batch]));
}

/** Isolates only proposer computation. Observation, authority, reconciliation and shared publication remain mandatory. */
export function collectAiProposals(
  managers: readonly AiProposalManagerV1[], observation: AiObservationV1, state: AiBrainStateV1,
  cadence: number, maximum: number, hooks?: AiBrainBoundaryHooks
) {
  const owners = managers.map((manager) => manager.managerId);
  if (new Set(owners).size !== owners.length || owners.length > 31 || owners.includes("debug_projection"))
    throw new Error("invalid_ai_manager_owners");
  let faults = [...(state.scheduler.boundaryFaults ?? [])].filter((fault) =>
    owners.includes(fault.owner) || fault.owner === "debug_projection");
  const batches = [...managers].sort((a, b) => a.managerId.localeCompare(b.managerId)).map((manager) => {
    const incident = faults.find((fault) => fault.owner === manager.managerId);
    const empty = (reason: string): AiManagerProposalV1 => ({ managerId: manager.managerId,
      lane: "optional_infrastructure_tech", evaluated: false, intents: [], reasons: [reason] });
    if (incident?.recoveredTick === null && observation.tick < incident.retryAtTick) return empty(incident.reason);
    try {
      const batch = hooks?.propose ? hooks.propose(manager, observation, state) : manager.propose(observation, state);
      assertBatch(batch, manager.managerId, state, maximum * 32);
      faults = recoverAiBoundary(manager.managerId, observation.tick, faults);
      return batch;
    } catch (error) {
      faults = recordAiBoundaryFailure(manager.managerId, observation.tick, cadence, faults, error);
      return empty(`technical_fault:${error instanceof Error ? error.name : "unknown"}`);
    }
  });
  return { batches, faults };
}
