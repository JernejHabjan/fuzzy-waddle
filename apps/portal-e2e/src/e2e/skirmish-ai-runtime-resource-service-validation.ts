import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeResourceServiceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-resource-service-v1";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";
import type { ResourceCargoSample } from
  "@fuzzy-waddle/probable-waffle-phaser/entity/components/resource/resource-cargo-sample";

const types = Object.values(ResourceType);
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
const id = (value: number | null) => value === null || integer(value) && value > 0 && value <= 8192;
const resource = (value: ResourceType | null) => value === null || types.includes(value);
const actor = (value: AiRuntimeCreatedActorV1 | null) => !!value && !!value.actorId && !!value.objectName &&
  !!value.canonicalObjectName && (value.playerNumber === null || integer(value.playerNumber)) &&
  [value.active, value.alive, value.finished, value.indexed].every((flag) => typeof flag === "boolean");
const cargo = (value: ResourceCargoSample) => !!value && amount(value.amount) && resource(value.resourceType);
const vector = (value: Partial<Record<ResourceType, number>> | null, complete = false) => value === null ||
  !!value && !Array.isArray(value) &&
    Object.entries(value).every(([key, quantity]) => types.some((type) => type === key) && amount(quantity)) &&
    (!complete || types.every((type) => amount(value[type])));

/** Recompute the native scoped application claim. Root event timing/current balances cannot backfill this interval. */
export function runtimeResourceCreditMatches(value: Extract<AiRuntimeResourceServiceV1, { phase: "resource_credit" }>): boolean {
  return value.status === "returned" && value.emissionRestoreInProgress === false && !value.interference &&
    value.callbackCount === 1 && value.resourceType !== null && value.beneficiary !== null &&
    value.before !== null && value.after !== null && value.callbackAmounts !== null && types.every((type) => {
      const delta = type === value.resourceType ? value.amount : 0;
      return (value.callbackAmounts?.[type] ?? 0) === delta && value.after?.[type] === (value.before?.[type] ?? NaN) + delta;
    });
}

/** Inspect every supplied cargo/credit tail before overflow suppression, including failed/suppressed native attempts. */
export function validateRuntimeResourceService(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [];
  const identities = new Map<number, string>(), closed = new Set<number>(), additions = new Set<number>();
  const executions = new Set<number>();
  let creditCount = 0;
  const transfers = new Map<number, { fingerprint: string; offered: boolean; credited: boolean; removed: boolean }>();
  const facts = capture.facts.filter((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "resource_service");
  for (const fact of facts) {
    if (fact.spatial.kind !== "resource_service") continue;
    const value = fact.spatial;
    if (fact.playerNumber !== capture.playerNumber || !integer(fact.tick) || fact.tick < capture.startedTick ||
      !integer(fact.sequence) || fact.sequence < 1 || value.clockTick !== null && value.clockTick !== fact.tick ||
      typeof value.sceneActive !== "boolean" || typeof value.snapshotRestoreInProgress !== "boolean" ||
      !actor(value.source) || value.source.playerNumber !== capture.playerNumber || value.target !== null && !actor(value.target) ||
      typeof value.sourceInCaptureScene !== "boolean" ||
      (value.target === null ? value.targetInCaptureScene !== null : typeof value.targetInCaptureScene !== "boolean") ||
      typeof value.lifetimeValid !== "boolean" || !id(value.cargoId) || !id(value.attemptId) || !id(value.transferId)) {
      failures.push("production_resource_service_boundary_invalid"); continue;
    }
    const sourceIdentity = JSON.stringify([value.source.actorId, value.source.canonicalObjectName, value.source.playerNumber]);
    if (value.cargoId !== null) {
      const previous = identities.get(value.cargoId);
      if (previous && previous !== sourceIdentity) failures.push("production_resource_cargo_identity_conflict");
      identities.set(value.cargoId, sourceIdentity);
      if (closed.has(value.cargoId) && value.lifetimeValid) failures.push("production_resource_cargo_lifetime_revived");
    }
    if (value.phase === "cargo_changed") {
      if (!["added", "removed", "reset", "restore"].includes(value.change.reason) || !cargo(value.before) || !cargo(value.after) ||
        value.change.reason !== "removed" && value.transferId !== null ||
        (value.change.reason === "added" || value.change.reason === "removed" ? !value.target ||
          !resource(value.change.resourceType ?? null) || !amount(value.change.delta) :
          value.change.delta !== undefined || value.change.resourceType !== undefined) ||
        value.change.reason === "added" && value.after.amount !== value.before.amount + (value.change.delta ?? NaN)) {
        failures.push("production_resource_cargo_payload_invalid"); continue;
      }
      if (value.change.reason === "added" && value.attemptId !== null) {
        if (additions.has(value.attemptId)) failures.push("production_resource_gather_attempt_reused");
        additions.add(value.attemptId);
      }
      if (value.change.reason === "restore" && value.cargoId !== null) closed.add(value.cargoId);
    } else if (value.phase === "cargo_started") {
      if (!cargo(value.cargo) || !value.target || value.transferId !== null) failures.push("production_resource_entry_payload_invalid");
      if (value.attemptId !== null) {
        if (executions.has(value.attemptId)) failures.push("production_resource_entry_repeated");
        executions.add(value.attemptId);
      }
    } else if (value.phase === "cargo_offered") {
      if (!cargo(value.cargo) || !value.target || value.transferId === null) failures.push("production_resource_offer_payload_invalid");
    } else if (value.phase === "resource_credit") {
      creditCount++;
      if (!resource(value.resourceType) || !amount(value.amount) || !value.target ||
        !["immediate", "drop_off"].includes(value.channel) || !["returned", "threw", "campaign_suppressed"].includes(value.status) ||
        value.ownerArgument !== null && !integer(value.ownerArgument) || value.beneficiary !== null && !integer(value.beneficiary) ||
        value.ownerArgument !== null && value.beneficiary !== value.ownerArgument ||
        !vector(value.before, true) || !vector(value.after, true) || !vector(value.callbackAmounts) ||
        !integer(value.callbackCount) || value.callbackCount > 9 || typeof value.interference !== "boolean" ||
        value.callbackCount === 0 && value.callbackAmounts !== null ||
        value.emissionRestoreInProgress !== null && typeof value.emissionRestoreInProgress !== "boolean" ||
        typeof value.balanceMatches !== "boolean" || value.balanceMatches !== runtimeResourceCreditMatches(value) ||
        value.status === "campaign_suppressed" && (value.callbackCount !== 0 || value.callbackAmounts !== null)) {
        failures.push("production_resource_credit_payload_invalid"); continue;
      }
    } else { failures.push("production_resource_service_phase_invalid"); continue; }
    if (value.transferId !== null) {
      const fingerprint = JSON.stringify([sourceIdentity, value.cargoId, value.attemptId,
        value.target?.actorId, value.target?.canonicalObjectName]);
      const previous = transfers.get(value.transferId) ?? { fingerprint, offered: false, credited: false, removed: false };
      if (previous.fingerprint !== fingerprint) failures.push("production_resource_transfer_identity_conflict");
      const key = value.phase === "cargo_offered" ? "offered" : value.phase === "resource_credit" ? "credited" : "removed";
      if (previous[key]) failures.push("production_resource_transfer_boundary_repeated");
      previous[key] = true; transfers.set(value.transferId, previous);
    }
  }
  return { facts, failures: [...new Set(failures)],
    overflow: identities.size > 256 || transfers.size > 256 || executions.size > 256 || creditCount > 256 };
}
