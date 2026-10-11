import { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeConstructionV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-v1";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Scalar money parser keeps unknown keys and incomplete balance vectors out of normalized authority. */
function validVector(vector: Readonly<Partial<Record<ResourceType, number>>> | null, full = false): boolean {
  return vector !== null && Object.entries(vector).every(([key, amount]) =>
    Object.values(ResourceType).some((type) => type === key) && Number.isFinite(amount) && amount >= 0) &&
    (!full || Object.values(ResourceType).every((type) => typeof vector[type] === "number"));
}

/** Validate callback-time native conditions, not desired payment policy or continuity between unsampled boundaries. */
function resourceFailures(value: Extract<AiRuntimeConstructionV1, { kind: "resource" }>): string[] {
  const failures: string[] = [];
  const start = value.operation === "start_charge";
  const refundFactor = value.refundFactor;
  if ((!start && value.operation !== "cancel_refund") ||
    !["skipped", "denied", "returned", "threw"].includes(value.status) ||
    ![PaymentType.PayImmediately, PaymentType.PayOverTime].includes(value.configuredCostType) ||
    !Number.isFinite(value.requiredWorkMs) || value.requiredWorkMs < 0 ||
    !Number.isSafeInteger(value.callbackCount) || value.callbackCount < 0 || value.callbackCount > 9 ||
    typeof value.nestedEmission !== "boolean" || typeof value.balanceMatches !== "boolean" ||
    (value.ownerArgument !== null && (!Number.isSafeInteger(value.ownerArgument) || value.ownerArgument < 0)) ||
    (start ? value.state !== ConstructionStateEnum.NotStarted || value.refundFactor !== null :
      value.state === ConstructionStateEnum.Finished || value.refundFactor === null ||
      !Number.isFinite(value.refundFactor) || value.refundFactor < 0)) failures.push("production_construction_resource_invalid");
  if ([value.configuredCost, value.requested, value.callbackAmounts].some((vector) => vector !== null && !validVector(vector)) ||
    [value.before, value.after].some((vector) => vector !== null && !validVector(vector, true))) {
    failures.push("production_construction_resource_vector_invalid");
  }
  // Match the current native production-time predicate, including its known discrepancy with configured costType.
  if (start && (value.status === "skipped" ? value.requiredWorkMs === PaymentType.PayImmediately || value.requested !== null :
    value.requiredWorkMs !== PaymentType.PayImmediately || (value.requested !== null && value.configuredCost !== null &&
      !sameRuntimeQueueVector(value.requested, value.configuredCost)))) failures.push("production_construction_start_predicate_mismatch");
  if (start && (value.status === "skipped" ? value.ownerArgument !== null || value.before !== null || value.after !== null :
    value.ownerArgument === null)) failures.push("production_construction_start_owner_mismatch");
  if (!start && ((value.status !== "returned" && value.status !== "threw") ||
    (value.requested !== null && value.configuredCost !== null && refundFactor !== null &&
      Object.values(ResourceType).some((type) =>
        (value.requested?.[type] ?? 0) !== Math.floor((value.configuredCost?.[type] ?? 0) * refundFactor))))) {
    failures.push("production_construction_refund_mismatch");
  }
  if ((value.callbackCount === 0 && value.callbackAmounts !== null) ||
    ((value.status === "denied" || value.status === "skipped") && value.callbackCount !== 0)) {
    failures.push("production_construction_callback_mismatch");
  }
  const before = value.before;
  const after = value.after;
  const requested = value.requested;
  const observed = value.callbackAmounts;
  const sign = start ? -1 : 1;
  const matches = value.status === "returned" && !value.snapshotRestoreInProgress && !value.nestedEmission &&
    value.callbackCount === 1 && before !== null && after !== null && requested !== null && observed !== null &&
    Object.values(ResourceType).every((type) => (requested[type] ?? 0) === (observed[type] ?? 0) &&
      after[type] === before[type] + sign * (requested[type] ?? 0));
  if (value.balanceMatches !== matches) failures.push("production_construction_balance_claim_mismatch");
  return failures;
}

/** Bound the diagnostic group; missing history cannot be repaired from placement prices, balances or later definitions. */
export function normalizeRuntimeConstructionAuthority(capture: AiRuntimeProductionCaptureV1) {
  const records = capture.facts.filter((fact) => fact.kind === "construction_authority");
  const failures: string[] = [];
  const gaps = new Set<string>(["production_construction_payment_history_missing",
    "production_construction_global_resource_interval_unverified", "production_construction_definition_history_missing",
    "production_construction_site_lifetime_history_unverified", "production_construction_completion_effect_missing"]);
  if (!records.length) gaps.add("production_construction_authority_missing");
  for (const fact of records) {
    const value = fact.construction;
    if ((value.kind !== "resource" && value.kind !== "lifecycle") ||
      ![ConstructionStateEnum.NotStarted, ConstructionStateEnum.Constructing, ConstructionStateEnum.Paused,
        ConstructionStateEnum.Finished].includes(value.state) || !Number.isFinite(value.remainingWorkMs) ||
      typeof value.snapshotRestoreInProgress !== "boolean" || typeof value.sceneActive !== "boolean" ||
      (value.clockTick !== null && value.clockTick !== fact.tick) || value.site.playerNumber !== capture.playerNumber ||
      fact.playerNumber !== capture.playerNumber) failures.push("production_construction_boundary_invalid");
    if (!value.site.objectName || !value.site.canonicalObjectName ||
      ![value.site.active, value.site.alive, value.site.finished, value.site.indexed].every((flag) => typeof flag === "boolean") ||
      value.site.finished !== (value.state === ConstructionStateEnum.Finished)) {
      failures.push("production_construction_site_invalid");
    }
    if (!value.site.actorId || value.clockTick === null) gaps.add("production_construction_site_clock_missing");
    if (value.snapshotRestoreInProgress || !value.sceneActive) gaps.add("production_construction_restore_or_inactive_boundary");
    if (value.kind === "lifecycle") {
      if (!["started", "finished", "restored", "teardown"].includes(value.transition) ||
        (value.transition === "started" && value.state !== ConstructionStateEnum.Constructing) ||
        (value.transition === "finished" && value.state !== ConstructionStateEnum.Finished)) {
        failures.push("production_construction_lifecycle_invalid");
      }
    } else {
      failures.push(...resourceFailures(value));
      if (value.ownerArgument !== null && value.ownerArgument !== value.site.playerNumber) {
        failures.push("production_construction_owner_mismatch");
      }
      if (value.ownerArgument === null && value.status !== "skipped") gaps.add("production_construction_resource_owner_missing");
      if (!value.configuredCost || (!value.requested && value.status !== "skipped")) {
        gaps.add("production_construction_resource_vector_missing");
      }
      if (!value.balanceMatches && value.status !== "skipped" && value.status !== "denied") {
        gaps.add("production_construction_resource_application_unproven");
      }
      if (value.status === "skipped" && value.configuredCostType === PaymentType.PayImmediately) {
        gaps.add("production_construction_configured_immediate_native_charge_skipped");
      }
      if (value.status === "threw") gaps.add("production_construction_resource_threw");
      if (value.nestedEmission) gaps.add("production_construction_nested_resource_interval");
      if (value.callbackCount === 9) gaps.add("production_construction_resource_callback_overflow");
    }
  }
  if (records.length > 256) gaps.add("production_construction_authority_overflow");
  return structuredClone({ records: failures.length || records.length > 256 ? [] : records,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
