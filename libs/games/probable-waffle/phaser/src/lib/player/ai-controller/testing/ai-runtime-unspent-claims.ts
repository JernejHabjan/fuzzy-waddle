import { ResourceType, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
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
  private readonly players = new Map<number, {
    initialized: boolean;
    gaps: Set<string>;
    entries: Map<string, {
      -readonly [Key in keyof AiRuntimeUnspentClaimsV1["entries"][number]]: AiRuntimeUnspentClaimsV1["entries"][number][Key]
    } & {
      request?: Extract<AiIntentCommandDispatchEvent, { kind: "requested" }>;
      admission?: GameCommandOutcome;
      paymentOperation?: number;
      paymentCallback?: boolean;
    }>;
  }>();

  /** Binds genuine accepted amounts to selected leases; only unadmitted/settled omitted leases can retire here. */
  observeDecision(decision: AiDecisionDispatchEvent): void {
    const owner = this.owner(decision.identity.playerNumber);
    owner.initialized = true;
    if (decision.reservations.length > MAX_ENTRIES || decision.acceptedIntents.length > MAX_ENTRIES ||
      [decision.identity.tick, decision.identity.generation, decision.identity.decisionSequence, decision.identity.authorityEpoch]
        .some((value) => !Number.isSafeInteger(value) || value < 0)) {
      owner.gaps.add("unspent_selection_invalid_or_overflow"); return;
    }
    const resourceLeases = decision.reservations.filter((lease) => lease.subjectKey?.startsWith("resource:"));
    for (const [key, entry] of owner.entries) {
      const retained = entry.intent.claims.some((claim) => resourceLeases.some((lease) => lease.claimId === claim.claimId));
      if (!retained && entry.state !== "admitted" && entry.state !== "queue_liability") owner.entries.delete(key);
    }
    for (const intent of decision.acceptedIntents) {
      const claims = intent.claims.filter((claim) => claim.kind === "resource");
      if (intent.kind !== "produce" && intent.kind !== "research") {
        if (claims.length) owner.gaps.add("unspent_non_queue_purchase_authority_missing");
        continue;
      }
      const arbitration = decision.decisions.filter((entry) => entry.outcome === "accepted" &&
        entry.reason === "accepted" && JSON.stringify(entry.intent) === JSON.stringify(intent));
      if (arbitration.length !== 1 || new Set(claims.map((claim) => claim.claimId)).size !== claims.length ||
        claims.some((claim) => !Object.values(ResourceType).includes(claim.resourceType) ||
          !Number.isFinite(claim.amount) || claim.amount < 0 || resourceLeases.filter((lease) =>
            lease.claimId === claim.claimId && lease.ownerPlanId === intent.planId &&
            lease.subjectKey === `resource:${claim.resourceType}` && lease.state.kind === "provisional" &&
            lease.createdTick === decision.identity.tick && lease.state.expiresAt.clock === "simulation" &&
            lease.state.expiresAt.unit === "tick" && lease.state.expiresAt.persistence === "save" &&
            Number.isSafeInteger(lease.state.expiresAt.dueTick) && lease.state.expiresAt.dueTick > decision.identity.tick).length !== 1)) {
        owner.gaps.add("unspent_selected_claim_invalid"); continue;
      }
      const key = intent.effectId;
      if (owner.entries.has(key) || owner.entries.size >= MAX_ENTRIES) {
        owner.gaps.add("unspent_selection_duplicate_or_overflow"); continue;
      }
      owner.entries.set(key, structuredClone({
        identity: decision.identity, intent, commandId: null, state: "selected" as const
      }));
    }
    for (const lease of resourceLeases) {
      if (lease.state.kind === "forecast" || lease.state.kind === "applied_spending" ||
        lease.state.kind === "refundable_work") continue;
      if (![...owner.entries.values()].some((entry) => entry.intent.planId === lease.ownerPlanId &&
        entry.intent.claims.some((claim) => claim.claimId === lease.claimId))) {
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
      if (!entry && !event.claims.some((claim) => claim.kind === "resource") &&
        !event.acceptedIntent?.claims.some((claim) => claim.kind === "resource")) return;
      if (!entry || entry.state !== "selected" || entry.request ||
        JSON.stringify(event.decisionIdentity) !== JSON.stringify(entry.identity) ||
        JSON.stringify(event.acceptedIntent) !== JSON.stringify(entry.intent) ||
        JSON.stringify(event.claims) !== JSON.stringify(entry.intent.claims) || event.command.actorIds.length !== 1 ||
        ((entry.intent.kind === "produce" || entry.intent.kind === "research") &&
          event.command.actorIds[0] !== entry.intent.producerId) ||
        (entry.intent.kind === "produce" ? event.command.type !== "PRODUCTION" ||
          event.command.actorName !== entry.intent.objectName : entry.intent.kind !== "research" ||
          event.command.type !== "RESEARCH" || event.command.researchType !== entry.intent.researchType)) {
        owner.gaps.add("unspent_dispatch_selection_missing_or_mismatch"); return;
      }
      entry.request = structuredClone(event);
      return;
    }
    const entry = [...owner.entries.values()].find((entry) => entry.request &&
      JSON.stringify(entry.request.correlation) === JSON.stringify(event.correlation));
    if (!entry) return;
    if (event.kind === "threw") { owner.gaps.add("unspent_dispatch_threw"); return; }
    if (event.receipt.status === "rejected") {
      if (entry.admission) owner.gaps.add("unspent_receipt_admission_mismatch");
      else entry.state = "released";
    } else if (!entry.admission || event.receipt.command.playerNumber !== event.playerNumber ||
      event.receipt.command.tick !== entry.admission.tick ||
      !(["commandId", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
        .every((key) => event.receipt.status === "dispatched" &&
          event.receipt.command.execution?.[key] === entry.admission?.[key])) {
      owner.gaps.add("unspent_receipt_admission_mismatch");
    }
    entry.request = undefined;
  }

  /** Admission preserves the amount; application requires an observed payment or physical liability transfer. */
  observeOutcome(outcome: GameCommandOutcome): void {
    const owner = this.owner(outcome.playerNumber);
    const entry = [...owner.entries.values()].find((entry) => outcome.kind === "dispatched"
      ? entry.request?.correlation.intentId === outcome.intentId && entry.request?.correlation.effectId === outcome.effectId
      : entry.commandId === outcome.commandId);
    if (!entry) return;
    if (outcome.kind === "dispatched") {
      if (!entry.request || entry.admission || entry.identity.authorityEpoch !== outcome.authorityEpoch ||
        outcome.commitmentKey !== entry.request.correlation.commitmentKey || outcome.actorIds.length !== 1 ||
        outcome.actorIds[0] !== entry.request.command.actorIds[0]) {
        owner.gaps.add("unspent_admission_mismatch"); return;
      }
      entry.commandId = outcome.commandId;
      entry.admission = structuredClone(outcome);
      entry.state = "admitted";
      return;
    }
    const admission = entry.admission;
    if (!admission || outcome.authorityEpoch !== admission.authorityEpoch || outcome.sequence !== admission.sequence ||
      outcome.intentId !== admission.intentId || outcome.effectId !== admission.effectId ||
      outcome.commitmentKey !== admission.commitmentKey) {
      owner.gaps.add("unspent_outcome_mismatch"); return;
    }
    if (outcome.actorIds.length !== 1 || outcome.actorIds[0] !== admission.actorIds[0]) {
      owner.gaps.add("unspent_outcome_actor_mismatch"); return;
    }
    if (outcome.reason === "duplicate_command") return;
    if (outcome.reason === "lost_outcome" || outcome.reason === "outcome_backlog_overflow") {
      owner.gaps.add("unspent_outcome_uncertain"); return;
    }
    if (outcome.kind === "rejected" || outcome.kind === "failed" || outcome.kind === "cancelled") entry.state = "released";
    if ((outcome.kind === "applied" || outcome.kind === "completed") && entry.state === "admitted") {
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
      if (!entry.admission || queue.lanes.flatMap((lane) => lane.items).filter((candidate) =>
        candidate.commandId === item.commandId).length !== 1 || item.identitySource !== "command" ||
        item.itemId !== `queue:${queue.actorId}:${item.commandId}` || item.effectId !== entry.admission.effectId ||
        entry.intent.kind !== "produce" || entry.intent.producerId !== queue.actorId ||
        entry.intent.objectName !== item.objectName || item.researchType !== null ||
        !Number.isFinite(item.totalTimeMs) || !Number.isFinite(item.remainingTimeMs) ||
        item.remainingTimeMs < 0 || item.remainingTimeMs > item.totalTimeMs || !this.sameClaims(entry.intent, item.charge)) {
        owner.gaps.add("unspent_queue_lineage_or_price_mismatch");
      } else entry.state = "queue_liability";
    }
  }

  /** Only an exact successful immediate operation retires cash; its intermediate callback interval stays unknown. */
  observeResource(playerNumber: number, resource: AiRuntimeQueueResourceV1): void {
    if (resource.originatingCommandContext?.execution.source !== "ai" || resource.operation !== "immediate_charge") return;
    const owner = this.owner(playerNumber);
    const entry = [...owner.entries.values()].find((entry) =>
      entry.commandId === resource.originatingCommandContext?.execution.commandId);
    if (!entry || !entry.admission || resource.payment !== "immediate" ||
      !(["commandId", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
        .every((key) => resource.originatingCommandContext?.execution[key] === entry.admission?.[key]) ||
      resource.ownerNumber !== playerNumber || resource.originatingCommandContext.playerNumber !== playerNumber ||
      resource.originatingCommandContext.actorIds.length !== 1 ||
      resource.originatingCommandContext.actorIds[0] !== resource.actorId || resource.identitySource !== "command" ||
      resource.itemId !== `queue:${resource.actorId}:${entry.commandId}` || resource.cancellationCommand !== null ||
      ((entry.intent.kind === "produce" || entry.intent.kind === "research") && entry.intent.producerId !== resource.actorId) ||
      (entry.intent.kind === "produce" ? resource.objectName !== entry.intent.objectName || resource.researchType !== null :
        entry.intent.kind !== "research" || resource.researchType !== entry.intent.researchType || resource.objectName !== null) ||
      !resource.storedPrice || !this.sameClaims(entry.intent, resource.storedPrice) ||
      !resource.emission.requested || !this.sameClaims(entry.intent, resource.emission.requested)) {
      owner.gaps.add("unspent_payment_lineage_missing_or_mismatch"); return;
    }
    const emission = resource.emission;
    if (!Number.isSafeInteger(emission.operationId) || emission.operationId <= 0 || resource.gaps.length ||
      emission.snapshotRestoreInProgress) owner.gaps.add("unspent_payment_authority_invalid");
    if (emission.phase === "started") {
      if (entry.state !== "admitted" || entry.paymentOperation !== undefined) owner.gaps.add("unspent_duplicate_payment");
      entry.paymentOperation = emission.operationId;
    } else if (emission.phase === "callback") {
      entry.paymentCallback = true;
      if (entry.paymentOperation !== emission.operationId || emission.callbackOrdinal !== 1 ||
        !emission.amounts || !this.sameClaims(entry.intent, emission.amounts)) owner.gaps.add("unspent_payment_callback_invalid");
    } else if (emission.phase === "finished") {
      if (entry.paymentOperation !== emission.operationId || !entry.paymentCallback || emission.status !== "returned" ||
        emission.callbackCount !== 1 || emission.callbackLimitExceeded || emission.nestedEmission ||
        !emission.balanceMatches || emission.snapshotRestoreInProgress || resource.gaps.length ||
        !emission.before || !emission.after || Object.values(ResourceType).some((type) =>
          !Number.isFinite(emission.before?.[type]) || !Number.isFinite(emission.after?.[type]) ||
          (emission.after?.[type] ?? -1) < 0 || emission.after?.[type] !==
            (emission.before?.[type] ?? Number.NaN) - (emission.requested?.[type] ?? 0))) {
        owner.gaps.add("unspent_payment_authority_invalid");
      } else entry.state = "paid";
      entry.paymentOperation = undefined;
      entry.paymentCallback = false;
    }
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
      for (const claim of entry.intent.claims) if (claim.kind === "resource") resources[claim.resourceType] += claim.amount;
    }
    if (Object.values(resources).some((amount) => !Number.isFinite(amount))) gaps.add("unspent_resource_overflow");
    return structuredClone({ resources: gaps.size ? null : resources,
      entries: [...owner.entries.values()].map(({ identity, intent, commandId, state }) => ({ identity, intent, commandId, state })),
      gaps: [...gaps].sort() });
  }

  dispose(): void { this.players.clear(); }

  private sameClaims(intent: AiRuntimeUnspentClaimsV1["entries"][number]["intent"], price: Partial<Record<ResourceType, number>>) {
    if (Object.keys(price).some((key) => !Object.values(ResourceType).some((type) => type === key))) return false;
    return Object.values(ResourceType).every((type) => {
      const amount = price[type] ?? 0;
      return Number.isFinite(amount) && amount >= 0 && amount === intent.claims.reduce((sum, claim) =>
        sum + (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0);
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
