import { ResourceType, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { AiRuntimePendingCommandV1 } from "./ai-runtime-pending-command-v1";

const MAX_PENDING = 128;

/** Bounded diagnostic ledger; only a real dispatched outcome turns accepted intent claims into pending ownership. */
export class AiRuntimePendingCommands {
  private readonly requests = new Map<string, Extract<AiIntentCommandDispatchEvent, { kind: "requested" }> & {
    readonly requestedTick: number;
    commandId?: string;
    admission?: GameCommandOutcome;
  }>();
  private readonly pending = new Map<string, AiRuntimePendingCommandV1>();
  private readonly gaps = new Map<number, Set<string>>();

  observeDispatch(event: AiIntentCommandDispatchEvent, tick: number): void {
    const key = this.key(event.playerNumber, event.correlation.intentId, event.correlation.effectId);
    if (event.kind === "requested") {
      if (this.requests.has(key) || this.requests.size >= MAX_PENDING) {
        this.markGap(event.playerNumber, "pending_dispatch_scope_overflow_or_duplicate");
        return;
      }
      this.requests.set(key, structuredClone({ ...event, requestedTick: tick }));
      return;
    }
    const request = this.requests.get(key);
    if (!request) return;
    this.requests.delete(key);
    if (event.kind === "threw") {
      this.markGap(event.playerNumber, "pending_dispatch_application_exception");
      return;
    }
    if (event.receipt.status === "rejected") {
      if (request.commandId) this.markGap(event.playerNumber, "pending_dispatch_receipt_mismatch");
      return;
    }
    const command = event.receipt.command;
    if (request.commandId !== command.execution?.commandId ||
      command.execution?.intentId !== event.correlation.intentId ||
      command.execution?.effectId !== event.correlation.effectId ||
      command.execution?.authorityEpoch !== request.admission?.authorityEpoch ||
      command.execution?.sequence !== request.admission?.sequence ||
      command.tick !== request.admission?.tick || command.type !== request.command.type ||
      command.playerNumber !== event.playerNumber) {
      this.markGap(event.playerNumber, "pending_dispatch_receipt_mismatch");
    }
    const pending = request.commandId ? this.pending.get(request.commandId) : undefined;
    if (pending && command.tick !== pending.scheduledTick) {
      this.markGap(event.playerNumber, "pending_dispatch_schedule_mismatch");
    }
  }

  /** outcome.tick is the bus schedule for dispatch; tick here is when the observer actually received the callback. */
  observeOutcome(outcome: GameCommandOutcome, tick: number): void {
    if (outcome.kind === "dispatched") {
      const key = this.key(outcome.playerNumber, outcome.intentId, outcome.effectId);
      const request = this.requests.get(key);
      // Human/replay commands have no accepted AI claims; never manufacture a resource amount for them.
      if (!request) {
        if (outcome.intentId || outcome.effectId) this.markGap(outcome.playerNumber, "pending_dispatch_unobserved_intent");
        return;
      }
      if (request.commandId || this.pending.has(outcome.commandId) || this.pending.size >= MAX_PENDING) {
        this.markGap(outcome.playerNumber, "pending_dispatch_admission_overflow_or_duplicate");
        return;
      }
      const resources = this.claimResources(request.claims);
      if (!resources || !Number.isSafeInteger(outcome.tick) || outcome.tick < tick || tick !== request.requestedTick ||
        outcome.commitmentKey !== request.correlation.commitmentKey ||
        outcome.actorIds.length !== request.command.actorIds.length ||
        !outcome.actorIds.every((actorId) => request.command.actorIds.includes(actorId))) {
        this.markGap(outcome.playerNumber, "pending_dispatch_invalid_admission");
        return;
      }
      request.commandId = outcome.commandId;
      request.admission = structuredClone(outcome);
      this.pending.set(outcome.commandId, structuredClone({
        commandId: outcome.commandId, playerNumber: outcome.playerNumber,
        intentId: request.correlation.intentId, effectId: request.correlation.effectId,
        commitmentKey: outcome.commitmentKey,
        authorityEpoch: outcome.authorityEpoch, authoritySequence: outcome.sequence,
        requestedTick: request.requestedTick, proposedTick: request.proposedTick, scheduledTick: outcome.tick,
        command: request.command, claims: request.claims, resources, unresolvedActorIds: outcome.actorIds
      }));
      return;
    }
    const pending = this.pending.get(outcome.commandId);
    if (!pending) return;
    if (outcome.playerNumber !== pending.playerNumber || outcome.authorityEpoch !== pending.authorityEpoch ||
      outcome.sequence !== pending.authoritySequence || outcome.intentId !== pending.intentId ||
      outcome.effectId !== pending.effectId || outcome.commitmentKey !== pending.commitmentKey) {
      this.markGap(pending.playerNumber, "pending_dispatch_outcome_mismatch");
      return;
    }
    if (outcome.reason === "duplicate_command") return;
    if (outcome.reason === "lost_outcome" || outcome.reason === "outcome_backlog_overflow") {
      this.markGap(pending.playerNumber, "pending_dispatch_outcome_uncertain");
      return;
    }
    if (outcome.kind === "active") return;
    if (outcome.kind !== "rejected" && outcome.kind !== "failed" &&
      (outcome.tick < pending.scheduledTick || tick < pending.scheduledTick || outcome.tick !== tick)) {
      this.markGap(pending.playerNumber, "pending_dispatch_early_application");
      return;
    }
    const unresolvedActorIds = pending.unresolvedActorIds.filter((actorId) => !outcome.actorIds.includes(actorId));
    if (unresolvedActorIds.length) this.pending.set(outcome.commandId, { ...pending, unresolvedActorIds });
    else this.pending.delete(outcome.commandId);
  }

  snapshot(playerNumber: number) {
    const commands = [...this.pending.values()].filter((command) => command.playerNumber === playerNumber);
    const resources = this.emptyResources();
    for (const command of commands) {
      // Until every addressed actor settles, retain the whole claim; no speculative per-actor price allocation.
      for (const resource of Object.values(ResourceType)) resources[resource] += command.resources[resource];
    }
    const overflow = Object.values(resources).some((amount) => !Number.isFinite(amount));
    if (overflow) {
      this.markGap(playerNumber, "pending_dispatch_resource_overflow");
    }
    return structuredClone({ commands, resources: overflow ? null : resources,
      gaps: [...(this.gaps.get(playerNumber) ?? [])].sort() });
  }

  dispose(): void {
    this.requests.clear();
    this.pending.clear();
    this.gaps.clear();
  }

  private claimResources(claims: Extract<AiIntentCommandDispatchEvent, { kind: "requested" }>["claims"]) {
    const resources = this.emptyResources();
    const seen = new Set<string>();
    for (const claim of claims) {
      if (claim.kind !== "resource") continue;
      if (seen.has(claim.claimId) || !Object.values(ResourceType).includes(claim.resourceType) ||
        !Number.isFinite(claim.amount) || claim.amount < 0) return null;
      seen.add(claim.claimId);
      resources[claim.resourceType] += claim.amount;
      if (!Number.isFinite(resources[claim.resourceType])) return null;
    }
    return resources;
  }

  private emptyResources(): Record<ResourceType, number> {
    return { food: 0, wood: 0, stone: 0, minerals: 0 };
  }

  private key(playerNumber: number, intentId?: string, effectId?: string): string {
    return JSON.stringify([playerNumber, intentId, effectId]);
  }

  private markGap(playerNumber: number, gap: string): void {
    const gaps = this.gaps.get(playerNumber) ?? new Set<string>();
    gaps.add(gap);
    this.gaps.set(playerNumber, gaps);
  }
}
