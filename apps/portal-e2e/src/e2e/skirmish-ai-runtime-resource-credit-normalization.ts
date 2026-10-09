import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { ResourceCargoSample } from "@fuzzy-waddle/probable-waffle-phaser/entity/components/resource/resource-cargo-sample";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeCargoContributionV1 } from "./skirmish-ai-runtime-cargo-contribution";
import { normalizeRuntimeServiceAttempts } from "./skirmish-ai-runtime-service-attempt-normalization";
import {
  validateRuntimeResourceService,
  runtimeResourceCreditMatches
} from "./skirmish-ai-runtime-resource-service-validation";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";

/** Retrospective whole-pile lineage. Unknown cargo and partial allocation remain unavailable; actual credit is independent. */
export function normalizeRuntimeResourceCredits(
  capture: AiRuntimeProductionCaptureV1,
  service = normalizeRuntimeServiceAttempts(capture)
) {
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { credits: [], failures: ["production_resource_service_capture_dropped"], gaps: [] };
  }
  const validation = validateRuntimeResourceService(capture),
    failures = [...validation.failures, ...service.failures];
  const gaps = new Set([
    "production_service_useful_fulfillment_missing",
    "production_service_continuous_stability_missing",
    "production_service_complete_history_missing"
  ]);
  if (failures.length) return { credits: [], failures: [...new Set(failures)], gaps: [...gaps] };
  const attempts = new Map(service.attempts.map((attempt) => [attempt.attemptId, attempt]));
  const states = new Map<
    number,
    {
      sample: ResourceCargoSample;
      known: boolean;
      sequence: number;
      version: number;
      contributions: RuntimeCargoContributionV1[];
    }
  >();
  const offers = new Map<
    number,
    {
      fact: RuntimeResourceCreditV1["fact"];
      known: boolean;
      version: number;
      contributions: RuntimeCargoContributionV1[];
    }
  >();
  const removals = new Map<number, { fact: RuntimeResourceCreditV1["fact"]; version: number }>();
  const entries = new Map<number, RuntimeResourceCreditV1["fact"]>();
  const candidates: { fact: RuntimeResourceCreditV1["fact"]; uninterrupted: boolean }[] = [];
  const sameCargo = (left: ResourceCargoSample, right: ResourceCargoSample) =>
    left.amount === right.amount && (left.amount === 0 || left.resourceType === right.resourceType);
  const fenced = (actorId: string | null, from: number, to: number) =>
    runtimeRouteOrderFenced(capture, actorId, from, to) ||
    validation.facts.some(
      (fact) =>
        fact.sequence > from &&
        fact.sequence < to &&
        fact.spatial.kind === "resource_service" &&
        fact.spatial.source.actorId === actorId &&
        fact.spatial.phase === "cargo_changed" &&
        fact.spatial.change.reason === "restore"
    );
  const available = (fact: RuntimeResourceCreditV1["fact"]) => {
    const value = fact.spatial;
    return (
      value.kind === "resource_service" &&
      value.clockTick !== null &&
      value.sceneActive &&
      !value.snapshotRestoreInProgress &&
      value.lifetimeValid &&
      value.sourceInCaptureScene &&
      [value.source, ...(value.target ? [value.target] : [])].every(
        (actor) => actor.active && actor.alive && actor.indexed && actor.finished
      ) &&
      (!value.target || value.targetInCaptureScene === true)
    );
  };
  for (const fact of validation.facts) {
    const value = fact.spatial;
    if (value.kind !== "resource_service") continue;
    value.gaps.forEach((gap) => gaps.add(gap));
    if (value.phase === "resource_credit") {
      const offer = value.transferId === null ? undefined : offers.get(value.transferId);
      const state = value.cargoId === null ? undefined : states.get(value.cargoId);
      candidates.push({
        fact,
        uninterrupted:
          !!offer &&
          !!state &&
          offer.version === state.version &&
          available(fact) &&
          !fenced(value.source.actorId, offer.fact.sequence, fact.sequence)
      });
      continue;
    }
    if (value.cargoId === null) continue;
    const before = value.phase === "cargo_changed" ? value.before : value.cargo;
    const state = states.get(value.cargoId) ?? {
      sample: before,
      known: before.amount === 0,
      sequence: fact.sequence,
      version: 0,
      contributions: new Array<RuntimeCargoContributionV1>()
    };
    if (
      !sameCargo(state.sample, before) ||
      fenced(value.source.actorId, state.sequence, fact.sequence) ||
      !available(fact)
    ) {
      state.known = false;
      state.contributions = [];
    }
    if (value.phase === "cargo_started") {
      if (value.attemptId !== null) entries.set(value.attemptId, fact);
      states.set(value.cargoId, state);
      continue;
    }
    if (value.phase === "cargo_offered") {
      if (value.transferId !== null)
        offers.set(value.transferId, {
          fact,
          version: state.version,
          known:
            state.known &&
            available(fact) &&
            before.amount > 0 &&
            before.resourceType !== null &&
            state.contributions.every((lot) => lot.resourceType === before.resourceType) &&
            state.contributions.reduce((sum, lot) => sum + lot.amount, 0) === before.amount,
          contributions: [...state.contributions]
        });
      states.set(value.cargoId, state);
      continue;
    }
    if (value.transferId !== null) removals.set(value.transferId, { fact, version: state.version });
    if (value.change.reason === "reset" || value.change.reason === "restore") {
      state.known = value.change.reason === "reset" && value.after.amount === 0 && available(fact);
      state.contributions = [];
    } else if (value.change.reason === "added") {
      if (before.amount === 0 && available(fact)) {
        state.known = true;
        state.contributions = [];
      }
      const gathering = value.attemptId === null ? undefined : attempts.get(value.attemptId);
      const start = gathering?.started,
        terminal = gathering?.terminal;
      const entry = value.attemptId === null ? undefined : entries.get(value.attemptId);
      const delta = value.change.delta ?? 0,
        type = value.change.resourceType;
      const owned =
        gathering?.callerAttributed &&
        start?.spatial.kind === "service_attempt" &&
        start.spatial.operation === "gather" &&
        start.sequence < fact.sequence &&
        !!terminal &&
        terminal.sequence > fact.sequence &&
        !!entry &&
        entry.spatial.kind === "resource_service" &&
        entry.spatial.cargoId === value.cargoId &&
        available(entry) &&
        entry.spatial.target?.actorId === value.target?.actorId &&
        entry.spatial.target?.canonicalObjectName === value.target?.canonicalObjectName &&
        start.sequence < entry.sequence &&
        entry.sequence < fact.sequence &&
        start.spatial.source.actorId === value.source.actorId &&
        start.spatial.target.actorId === value.target?.actorId &&
        start.spatial.target.canonicalObjectName === value.target?.canonicalObjectName &&
        !fenced(value.source.actorId, start.sequence, fact.sequence) &&
        type != null &&
        value.after.resourceType === type &&
        (before.amount === 0 || before.resourceType === type);
      if (
        gathering?.nativeResultAmount !== null &&
        gathering?.nativeResultAmount !== undefined &&
        gathering.nativeResultAmount !== delta
      )
        failures.push("production_resource_gather_result_conflict");
      if (delta > 0) {
        if (!owned || !gathering || type == null || state.contributions.length >= 256) {
          state.known = false;
          state.contributions = [];
        } else if (state.known) {
          state.contributions.push({ additionSequence: fact.sequence, resourceType: type, amount: delta, gathering });
        }
      }
    } else {
      // Whole-pile consumption anchors empty cargo. Partial/changed piles receive no invented lot allocation.
      state.known = value.after.amount === 0 && available(fact);
      state.contributions = [];
    }
    state.sample = value.after;
    state.sequence = fact.sequence;
    state.version++;
    states.set(value.cargoId, state);
  }
  const credits: RuntimeResourceCreditV1[] = [];
  for (const { fact, uninterrupted } of candidates) {
    const value = fact.spatial;
    if (value.kind !== "resource_service" || value.phase !== "resource_credit") continue;
    const offer = value.transferId === null ? undefined : offers.get(value.transferId);
    const removal = value.transferId === null ? undefined : removals.get(value.transferId);
    const offered = offer?.fact.spatial,
      consumed = removal?.fact.spatial;
    const localGaps = new Set<string>();
    const delivery = value.attemptId === null ? null : (attempts.get(value.attemptId) ?? null);
    const entry = value.attemptId === null ? undefined : entries.get(value.attemptId);
    if (
      value.channel === "drop_off" &&
      delivery?.nativeResultAmount != null &&
      delivery.nativeResultAmount !== value.amount
    ) {
      failures.push("production_resource_drop_off_result_conflict");
    }
    if (
      offered?.kind === "resource_service" &&
      offered.phase === "cargo_offered" &&
      (offered.cargo.amount !== value.amount || offered.cargo.resourceType !== value.resourceType)
    ) {
      failures.push("production_resource_transfer_payload_conflict");
    }
    const ownedDelivery =
      delivery?.callerAttributed &&
      delivery.started?.spatial.kind === "service_attempt" &&
      !!entry &&
      entry.spatial.kind === "resource_service" &&
      entry.spatial.cargoId === value.cargoId &&
      available(entry) &&
      entry.spatial.target?.actorId === value.target?.actorId &&
      entry.spatial.target?.canonicalObjectName === value.target?.canonicalObjectName &&
      delivery.started.sequence < entry.sequence &&
      entry.sequence < (offer?.fact.sequence ?? 0) &&
      delivery.started.sequence < (offer?.fact.sequence ?? 0) &&
      (delivery.terminal?.sequence ?? 0) > (removal?.fact.sequence ?? Infinity) &&
      delivery.started.spatial.operation === (value.channel === "immediate" ? "gather" : "drop_off") &&
      delivery.started.spatial.source.actorId === value.source.actorId &&
      delivery.started.spatial.target.actorId === value.target?.actorId &&
      delivery.started.spatial.target.canonicalObjectName === value.target?.canonicalObjectName &&
      !fenced(value.source.actorId, delivery.started.sequence, removal?.fact.sequence ?? fact.sequence);
    const whole =
      !!offer &&
      !!removal &&
      offer.known &&
      uninterrupted &&
      offered?.kind === "resource_service" &&
      offered.phase === "cargo_offered" &&
      consumed?.kind === "resource_service" &&
      consumed.phase === "cargo_changed" &&
      consumed.change.reason === "removed" &&
      available(removal.fact) &&
      offer.version === removal.version &&
      sameCargo(offered.cargo, consumed.before) &&
      consumed.after.amount === 0 &&
      consumed.change.delta === offered.cargo.amount &&
      offer.fact.sequence < fact.sequence &&
      fact.sequence < removal.fact.sequence &&
      !fenced(value.source.actorId, offer.fact.sequence, removal.fact.sequence) &&
      !runtimeRouteOrderFenced(capture, value.target?.actorId ?? null, offer.fact.sequence, removal.fact.sequence) &&
      offer.contributions.every((lot) => !fenced(value.source.actorId, lot.additionSequence, removal.fact.sequence));
    const cargoAttributed = !!whole && !!ownedDelivery;
    const appliedAmount =
      runtimeResourceCreditMatches(value) &&
      value.clockTick !== null &&
      value.sceneActive &&
      !value.snapshotRestoreInProgress &&
      value.sourceInCaptureScene &&
      value.targetInCaptureScene
        ? value.amount
        : null;
    if (appliedAmount === null)
      localGaps.add(
        value.status === "campaign_suppressed"
          ? "production_resource_credit_campaign_suppressed"
          : "production_resource_credit_application_unavailable"
      );
    if (!offer) localGaps.add("production_resource_credit_offer_missing");
    if (!removal) localGaps.add("production_resource_credit_consumption_missing");
    if (!ownedDelivery) localGaps.add("production_resource_credit_delivery_unattributed");
    if (!cargoAttributed) localGaps.add("production_resource_credit_cargo_unattributed");
    if (value.beneficiary !== value.source.playerNumber) localGaps.add("production_resource_credit_cross_owner");
    credits.push({
      fact,
      offer: offer?.fact ?? null,
      consumption: removal?.fact ?? null,
      delivery,
      appliedAmount,
      beneficiary: value.beneficiary,
      cargoAttributed,
      contributions: cargoAttributed ? (offer?.contributions ?? []) : [],
      gaps: [...localGaps]
    });
    localGaps.forEach((gap) => gaps.add(gap));
  }
  if (!candidates.length) gaps.add("production_resource_credit_observation_missing");
  if (validation.overflow) gaps.add("production_resource_service_group_overflow");
  return {
    credits: failures.length || validation.overflow ? [] : credits,
    failures: [...new Set(failures)],
    gaps: [...gaps]
  };
}
