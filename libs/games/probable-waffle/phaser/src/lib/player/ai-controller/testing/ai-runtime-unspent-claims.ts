import type { AiRuntimeUnspentClaimEntry } from "./ai-runtime-unspent-claim-entry";
import { observeAiRuntimeQueueClaimPayment } from "./observe-ai-runtime-queue-claim-payment";
import { ResourceType, type GameCommandOutcome, type ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeConstructionV1 } from "./ai-runtime-construction-v1";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { AiRuntimeUnspentClaimsV1 } from "./ai-runtime-unspent-claims-v1";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

const MAX_ENTRIES = 512;

/**
 * Capture-local ownership ledger for accepting resource leases. Amounts come from exact accepted claims, never
 * parsed subject keys or forecast prerequisites. Unsupported purchases and pre-capture leases fail closed.
 * Cash already spent/refundable work is not unspent cash. Pending diagnostic claims are never added a second time.
 */
export class AiRuntimeUnspentClaims {
  private readonly sites = new Map<string, ConstructCommand>();
  private readonly players = new Map<
    number,
    {
      initialized: boolean;
      gaps: Set<string>;
      entries: Map<string, AiRuntimeUnspentClaimEntry>;
    }
  >();

  /** Binds genuine accepted amounts to selected leases; only unadmitted/settled omitted leases can retire here. */
  observeDecision(decision: AiDecisionDispatchEvent): void {
    const owner = this.owner(decision.identity.playerNumber);
    owner.initialized = true;
    if (
      decision.reservations.length > MAX_ENTRIES ||
      decision.acceptedIntents.length > MAX_ENTRIES ||
      [
        decision.identity.tick,
        decision.identity.generation,
        decision.identity.decisionSequence,
        decision.identity.authorityEpoch
      ].some((value) => !Number.isSafeInteger(value) || value < 0)
    ) {
      owner.gaps.add("unspent_selection_invalid_or_overflow");
      return;
    }
    const resourceLeases = decision.reservations.filter((lease) => lease.subjectKey?.startsWith("resource:"));
    for (const [key, entry] of owner.entries) {
      const retained = entry.intent.claims.some((claim) =>
        resourceLeases.some((lease) => lease.claimId === claim.claimId)
      );
      if (!retained && entry.state !== "admitted" && entry.state !== "queue_liability") owner.entries.delete(key);
    }
    for (const intent of decision.acceptedIntents) {
      const claims = intent.claims.filter((claim) => claim.kind === "resource");
      if (intent.kind !== "produce" && intent.kind !== "research" && intent.kind !== "construct") {
        if (claims.length) owner.gaps.add("unspent_non_queue_purchase_authority_missing");
        continue;
      }
      const arbitration = decision.decisions.filter(
        (entry) =>
          entry.outcome === "accepted" &&
          entry.reason === "accepted" &&
          JSON.stringify(entry.intent) === JSON.stringify(intent)
      );
      if (
        arbitration.length !== 1 ||
        new Set(claims.map((claim) => claim.claimId)).size !== claims.length ||
        claims.some(
          (claim) =>
            !Object.values(ResourceType).includes(claim.resourceType) ||
            !Number.isFinite(claim.amount) ||
            claim.amount < 0 ||
            resourceLeases.filter(
              (lease) =>
                lease.claimId === claim.claimId &&
                lease.ownerPlanId === intent.planId &&
                lease.subjectKey === `resource:${claim.resourceType}` &&
                lease.state.kind === "provisional" &&
                lease.createdTick === decision.identity.tick &&
                lease.state.expiresAt.clock === "simulation" &&
                lease.state.expiresAt.unit === "tick" &&
                lease.state.expiresAt.persistence === "save" &&
                Number.isSafeInteger(lease.state.expiresAt.dueTick) &&
                lease.state.expiresAt.dueTick > decision.identity.tick
            ).length !== 1
        )
      ) {
        owner.gaps.add("unspent_selected_claim_invalid");
        continue;
      }
      const key = intent.effectId;
      if (owner.entries.has(key) || owner.entries.size >= MAX_ENTRIES) {
        owner.gaps.add("unspent_selection_duplicate_or_overflow");
        continue;
      }
      owner.entries.set(
        key,
        structuredClone({
          identity: decision.identity,
          intent,
          commandId: null,
          state: "selected" as const
        })
      );
    }
    for (const lease of resourceLeases) {
      if (
        lease.state.kind === "forecast" ||
        lease.state.kind === "applied_spending" ||
        lease.state.kind === "refundable_work"
      )
        continue;
      if (
        ![...owner.entries.values()].some(
          (entry) =>
            entry.intent.planId === lease.ownerPlanId &&
            entry.intent.claims.some((claim) => claim.claimId === lease.claimId)
        )
      ) {
        owner.gaps.add("unspent_pre_capture_lease_authority_missing");
      }
    }
    if (decision.reservations.some((lease) => lease.subjectKey === undefined)) {
      owner.gaps.add("unspent_migrated_lease_subject_missing");
    }
  }

  /** Exact selected proposal scopes the real request; a rejected admission releases its provisional cash. */
  observeDispatch(event: AiIntentCommandDispatchEvent): void {
    const owner = this.owner(event.playerNumber);
    if (event.kind === "requested") {
      const entry = event.acceptedIntent ? owner.entries.get(event.acceptedIntent.effectId) : undefined;
      if (
        !entry &&
        !event.claims.some((claim) => claim.kind === "resource") &&
        !event.acceptedIntent?.claims.some((claim) => claim.kind === "resource")
      )
        return;
      if (
        !entry ||
        entry.state !== "selected" ||
        entry.request ||
        JSON.stringify(event.decisionIdentity) !== JSON.stringify(entry.identity) ||
        JSON.stringify(event.acceptedIntent) !== JSON.stringify(entry.intent) ||
        JSON.stringify(event.claims) !== JSON.stringify(entry.intent.claims) ||
        (entry.intent.kind !== "construct" && event.command.actorIds.length !== 1) ||
        ((entry.intent.kind === "produce" || entry.intent.kind === "research") &&
          event.command.actorIds[0] !== entry.intent.producerId) ||
        (entry.intent.kind === "produce"
          ? event.command.type !== "PRODUCTION" || event.command.actorName !== entry.intent.objectName
          : entry.intent.kind === "research"
            ? event.command.type !== "RESEARCH" || event.command.researchType !== entry.intent.researchType
            : entry.intent.kind !== "construct" ||
              event.command.type !== "CONSTRUCT" ||
              event.command.actorName !== entry.intent.objectName ||
              event.command.siteKey !== entry.intent.siteKey ||
              JSON.stringify(event.command.actorIds) !== JSON.stringify(entry.intent.builderIds) ||
              JSON.stringify(event.command.tileVec3) !== JSON.stringify(entry.intent.logicalPosition))
      ) {
        owner.gaps.add("unspent_dispatch_selection_missing_or_mismatch");
        return;
      }
      entry.request = structuredClone(event);
      return;
    }
    const entry = [...owner.entries.values()].find(
      (entry) => entry.request && JSON.stringify(entry.request.correlation) === JSON.stringify(event.correlation)
    );
    if (!entry) return;
    if (event.kind === "threw") {
      owner.gaps.add("unspent_dispatch_threw");
      return;
    }
    if (event.receipt.status === "rejected") {
      if (entry.admission) owner.gaps.add("unspent_receipt_admission_mismatch");
      else entry.state = "released";
    } else if (
      !entry.admission ||
      event.receipt.command.playerNumber !== event.playerNumber ||
      event.receipt.command.tick !== entry.admission.tick ||
      !(["commandId", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const).every(
        (key) =>
          event.receipt.status === "dispatched" && event.receipt.command.execution?.[key] === entry.admission?.[key]
      )
    ) {
      owner.gaps.add("unspent_receipt_admission_mismatch");
    }
    entry.request = undefined;
  }

  /** Admission preserves the amount; application requires an observed payment or physical liability transfer. */
  observeOutcome(outcome: GameCommandOutcome): void {
    const owner = this.owner(outcome.playerNumber);
    if (!outcome.intentId || !outcome.effectId) {
      if ([...owner.entries.values()].some((entry) => entry.commandId === outcome.commandId)) {
        owner.gaps.add("unspent_outcome_mismatch");
      }
      return;
    }
    const entry = [...owner.entries.values()].find((entry) =>
      outcome.kind === "dispatched"
        ? entry.request?.correlation.intentId === outcome.intentId &&
          entry.request?.correlation.effectId === outcome.effectId
        : entry.commandId === outcome.commandId
    );
    if (!entry) return;
    if (outcome.kind === "dispatched") {
      if (
        !entry.request ||
        entry.admission ||
        entry.identity.authorityEpoch !== outcome.authorityEpoch ||
        outcome.commitmentKey !== entry.request.correlation.commitmentKey ||
        JSON.stringify(outcome.actorIds) !== JSON.stringify(entry.request.command.actorIds)
      ) {
        owner.gaps.add("unspent_admission_mismatch");
        return;
      }
      entry.commandId = outcome.commandId;
      entry.admission = structuredClone(outcome);
      entry.state = "admitted";
      return;
    }
    const admission = entry.admission;
    if (
      !admission ||
      outcome.authorityEpoch !== admission.authorityEpoch ||
      outcome.sequence !== admission.sequence ||
      outcome.intentId !== admission.intentId ||
      outcome.effectId !== admission.effectId ||
      outcome.commitmentKey !== admission.commitmentKey
    ) {
      owner.gaps.add("unspent_outcome_mismatch");
      return;
    }
    if (JSON.stringify(outcome.actorIds) !== JSON.stringify(admission.actorIds)) {
      owner.gaps.add("unspent_outcome_actor_mismatch");
      return;
    }
    if (outcome.reason === "duplicate_command") return;
    if (outcome.reason === "lost_outcome" || outcome.reason === "outcome_backlog_overflow") {
      owner.gaps.add("unspent_outcome_uncertain");
      return;
    }
    if (outcome.kind === "rejected" || outcome.kind === "failed" || outcome.kind === "cancelled")
      entry.state = "released";
    if (outcome.kind === "completed" && outcome.detail === "site_reconciled" && entry.intent.kind === "construct") {
      const intent = entry.intent;
      const existing = outcome.worldLinkIds.length === 1 ? this.sites.get(outcome.worldLinkIds[0] ?? "") : undefined;
      if (
        existing?.playerNumber === outcome.playerNumber &&
        existing.execution?.commandId !== outcome.commandId &&
        existing.siteKey === intent.siteKey &&
        existing.actorName === intent.objectName &&
        JSON.stringify(existing.tileVec3) === JSON.stringify(intent.logicalPosition)
      ) {
        entry.state = "released";
      } else owner.gaps.add("unspent_construction_reconciled_site_missing");
    }
    if (
      (outcome.kind === "applied" || outcome.kind === "completed") &&
      entry.state === "admitted" &&
      !(outcome.kind === "applied" && entry.intent.kind === "construct")
    ) {
      owner.gaps.add("unspent_application_payment_or_queue_missing");
    }
    if (outcome.kind === "completed" && entry.state === "queue_liability") entry.state = "released";
  }

  /** A command-backed pay-over-time item owns future charges, so its accepted cash claim is no longer added. */
  observeQueue(playerNumber: number, queue: AiRuntimeProductionQueueV1): void {
    const owner = this.owner(playerNumber);
    for (const item of queue.lanes.flatMap((lane) => lane.items)) {
      if (item.payment !== "per_successful_tick") continue;
      const entry = [...owner.entries.values()].find((entry) => entry.commandId === item.commandId);
      if (!entry || (entry.state !== "admitted" && entry.state !== "queue_liability")) continue;
      if (
        !entry.admission ||
        queue.lanes.flatMap((lane) => lane.items).filter((candidate) => candidate.commandId === item.commandId)
          .length !== 1 ||
        item.identitySource !== "command" ||
        item.itemId !== `queue:${queue.actorId}:${item.commandId}` ||
        item.effectId !== entry.admission.effectId ||
        entry.intent.kind !== "produce" ||
        entry.intent.producerId !== queue.actorId ||
        entry.intent.objectName !== item.objectName ||
        item.researchType !== null ||
        !Number.isFinite(item.totalTimeMs) ||
        !Number.isFinite(item.remainingTimeMs) ||
        item.remainingTimeMs < 0 ||
        item.remainingTimeMs > item.totalTimeMs ||
        !this.sameClaims(entry.intent, item.charge)
      ) {
        owner.gaps.add("unspent_queue_lineage_or_price_mismatch");
      } else entry.state = "queue_liability";
    }
  }

  /** Exact queue operation owns retirement; no later settled snapshot may release this cash. */
  observeResource(playerNumber: number, resource: AiRuntimeQueueResourceV1): void {
    observeAiRuntimeQueueClaimPayment(playerNumber, resource, this.owner(playerNumber), (intent, price) =>
      this.sameClaims(intent, price)
    );
  }

  /** Detached bounded ownership. Sticky authority gaps and an unfinished cash callback yield null, never zero. */
  snapshot(playerNumber: number): AiRuntimeUnspentClaimsV1 {
    const owner = this.owner(playerNumber);
    const gaps = new Set(owner.gaps);
    if (!owner.initialized) gaps.add("unspent_selected_decision_missing");
    if ([...owner.entries.values()].some((entry) => entry.paymentCallback)) gaps.add("unspent_payment_in_progress");
    const resources: Record<ResourceType, number> = { food: 0, wood: 0, stone: 0, minerals: 0 };
    for (const entry of owner.entries.values()) {
      if (entry.state !== "selected" && entry.state !== "admitted") continue;
      for (const claim of entry.intent.claims)
        if (claim.kind === "resource") resources[claim.resourceType] += claim.amount;
    }
    if (Object.values(resources).some((amount) => !Number.isFinite(amount))) gaps.add("unspent_resource_overflow");
    return structuredClone({
      resources: gaps.size ? null : resources,
      entries: [...owner.entries.values()].map(({ identity, intent, commandId, state }) => ({
        identity,
        intent,
        commandId,
        state
      })),
      gaps: [...gaps].sort()
    });
  }

  /** Placement binds the exact stamped construction to its new site before later automatic payment/work callbacks. */
  observePlacement(command: ConstructCommand, siteId: string): void {
    if (this.sites.size >= MAX_ENTRIES || this.sites.has(siteId)) {
      this.owner(command.playerNumber).gaps.add("unspent_construction_site_overflow_or_duplicate");
      return;
    }
    this.sites.set(siteId, structuredClone(command));
  }

  /** Retires construction cash only after the native owner's exact successful immediate charge. */
  observeConstruction(playerNumber: number, record: AiRuntimeConstructionV1): void {
    if (record.kind !== "resource" || record.operation !== "start_charge" || record.status !== "returned") return;
    const command = record.site.actorId ? this.sites.get(record.site.actorId) : undefined;
    if (command?.execution?.source !== "ai") return;
    const owner = this.owner(playerNumber);
    const entry = [...owner.entries.values()].find((candidate) => candidate.commandId === command.execution?.commandId);
    if (
      !entry ||
      !entry.admission ||
      entry.intent.kind !== "construct" ||
      entry.state !== "admitted" ||
      command.playerNumber !== playerNumber ||
      record.ownerArgument !== playerNumber ||
      command.actorName !== record.site.canonicalObjectName ||
      entry.intent.objectName !== command.actorName ||
      !(["commandId", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const).every(
        (key) => command.execution?.[key] === entry.admission?.[key]
      ) ||
      record.configuredCostType !== PaymentType.PayImmediately ||
      record.snapshotRestoreInProgress ||
      record.nestedEmission ||
      record.callbackCount !== 1 ||
      !record.balanceMatches ||
      !record.before ||
      !record.after ||
      !record.configuredCost ||
      !record.requested ||
      !record.callbackAmounts ||
      !this.sameClaims(entry.intent, record.configuredCost) ||
      !this.sameClaims(entry.intent, record.requested) ||
      !this.sameClaims(entry.intent, record.callbackAmounts) ||
      Object.values(ResourceType).some(
        (type) =>
          !Number.isFinite(record.before?.[type]) ||
          !Number.isFinite(record.after?.[type]) ||
          (record.after?.[type] ?? -1) < 0 ||
          record.after?.[type] !== (record.before?.[type] ?? Number.NaN) - (record.requested?.[type] ?? 0)
      )
    ) {
      owner.gaps.add("unspent_construction_payment_authority_invalid");
      return;
    }
    entry.state = "paid";
  }

  dispose(): void {
    this.players.clear();
    this.sites.clear();
  }

  private sameClaims(
    intent: AiRuntimeUnspentClaimsV1["entries"][number]["intent"],
    price: Partial<Record<ResourceType, number>>
  ) {
    if (Object.keys(price).some((key) => !Object.values(ResourceType).some((type) => type === key))) return false;
    return Object.values(ResourceType).every((type) => {
      const amount = price[type] ?? 0;
      return (
        Number.isFinite(amount) &&
        amount >= 0 &&
        amount ===
          intent.claims.reduce(
            (sum, claim) => sum + (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0),
            0
          )
      );
    });
  }

  private owner(playerNumber: number) {
    let owner = this.players.get(playerNumber);
    if (!owner) {
      owner = { initialized: false, gaps: new Set<string>(), entries: new Map() };
      this.players.set(playerNumber, owner);
    }
    return owner;
  }
}
