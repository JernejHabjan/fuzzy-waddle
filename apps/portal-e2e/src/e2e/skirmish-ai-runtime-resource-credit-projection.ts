// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { ResourceCargoSample } from "@fuzzy-waddle/probable-waffle-phaser/entity/components/resource/resource-cargo-sample";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeCargoContributionV1 } from "./skirmish-ai-runtime-cargo-contribution";
import type { normalizeRuntimeServiceAttempts } from "./skirmish-ai-runtime-service-attempt-normalization";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";

/** Joins the already observed whole-pile offers/consumption to actual credit and exact service ownership. */
export function projectRuntimeResourceCredits(args: {
  readonly capture: AiRuntimeProductionCaptureV1;
  readonly candidates: readonly { fact: RuntimeResourceCreditV1["fact"]; uninterrupted: boolean }[];
  readonly offers: ReadonlyMap<
    number,
    {
      fact: RuntimeResourceCreditV1["fact"];
      known: boolean;
      version: number;
      contributions: RuntimeCargoContributionV1[];
    }
  >;
  readonly removals: ReadonlyMap<number, { fact: RuntimeResourceCreditV1["fact"]; version: number }>;
  readonly entries: ReadonlyMap<number, RuntimeResourceCreditV1["fact"]>;
  readonly attempts: ReadonlyMap<number, ReturnType<typeof normalizeRuntimeServiceAttempts>["attempts"][number]>;
  readonly sameCargo: (left: ResourceCargoSample, right: ResourceCargoSample) => boolean;
  readonly fenced: (actorId: string | null, from: number, to: number) => boolean;
  readonly available: (fact: RuntimeResourceCreditV1["fact"]) => boolean;
  readonly failures: string[];
  readonly gaps: Set<string>;
}) {
  const { capture, candidates, offers, removals, entries, attempts, sameCargo, fenced, available, failures, gaps } =
    args;
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
  return credits;
}
