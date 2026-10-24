import { Subscription } from "rxjs";
import type { GameCommand, GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";

/** An explicitly requested localhost experiment; absent in ordinary diagnostics and production gameplay. */
export function multiplayerAuthorityProbeRequested(): boolean {
  try {
    return typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
      window.sessionStorage.getItem("fuzzy-waddle:ai-multiplayer-authority-probe-v1") === "1";
  } catch { return false; }
}

/** Retains at most16 genuine admitted AI envelopes. It never authors a strategic command, receipt, charge or epoch. */
export class AiMultiplayerAuthorityProbe {
  private readonly subscriptions = new Subscription();
  private readonly admitted = new Map<string, { command: GameCommand; applications: number }>();
  private pinned: { command: GameCommand; applications: number } | null = null;
  private originalReceipt: GameCommandOutcome | null = null;
  private readonly outcomes: GameCommandOutcome[] = [];
  private disposed = false;
  private overflow = false;

  constructor(private readonly bus: CommandBusService) {
    this.subscriptions.add(bus.command$.subscribe((command) => {
      const execution = command.execution;
      if (execution?.source !== "ai" || !execution.intentId || !execution.effectId) return;
      const entry = this.admitted.get(execution.commandId);
      if (entry) { entry.applications++; return; }
      if (this.pinned) return;
      if (this.admitted.size >= 16) {
        const oldest = this.admitted.keys().next().value;
        if (oldest !== undefined) this.admitted.delete(oldest);
      }
      this.admitted.set(execution.commandId, { command: structuredClone(command), applications: 1 });
    }));
    this.subscriptions.add(bus.commandOutcome$.subscribe((outcome) => {
      if (outcome.commandId !== this.pinned?.command.execution?.commandId) return;
      if (this.outcomes.length >= 32) { this.overflow = true; return; }
      this.outcomes.push(structuredClone(outcome));
    }));
  }

  /** Pin actual outstanding applied work with a native world link, not merely a dispatched proposal. */
  pin(): void {
    if (this.disposed) throw new Error("authority_probe_disposed");
    if (this.pinned) return;
    const authority = this.bus.getAuthorityState();
    const active = new Set(Object.values(authority.activeCommitmentsByPlayer ?? {}).flatMap(Object.values));
    const selected = [...this.admitted].find(([id]) => active.has(id) && authority.outcomes.some((outcome) =>
      outcome.commandId === id && ["applied", "active"].includes(outcome.kind) && outcome.worldLinkIds.length > 0));
    if (!selected) throw new Error("authority_probe_actual_linked_ai_work_missing");
    this.pinned = selected[1];
    this.originalReceipt = structuredClone(authority.outcomes.find((outcome) => outcome.commandId === selected[0] &&
      ["applied", "active"].includes(outcome.kind) && outcome.worldLinkIds.length > 0) ?? null);
    this.admitted.clear();
    this.admitted.set(selected[0], this.pinned);
  }

  snapshot() {
    const pinned = this.pinned, original = pinned?.command.execution;
    const authority = this.bus.getAuthorityState();
    return { authorityEpoch: authority.authorityEpoch,
      original: original ? structuredClone(original) : null,
      originalReceipt: this.originalReceipt ? structuredClone(this.originalReceipt) : null,
      processedWatermark: pinned ? authority.processedSequenceWatermarkByPlayer?.[pinned.command.playerNumber] ?? null : null,
      nextSequence: pinned ? authority.nextSequenceByPlayer[pinned.command.playerNumber] ?? null : null,
      applications: this.pinned?.applications ?? 0,
      active: !!original && !!pinned &&
        authority.activeCommitmentsByPlayer?.[pinned.command.playerNumber]?.[original.commitmentKey] === original.commandId,
      outcomes: structuredClone(this.outcomes), disposed: this.disposed,
      failure: this.overflow ? "authority_probe_outcome_overflow" : null };
  }

  /** Redelivers the retained original through the existing replay/application fence, without restamping any identity. */
  redeliver(): void {
    if (this.disposed || !this.pinned) throw new Error("authority_probe_original_missing");
    const command = structuredClone(this.pinned.command);
    this.bus.playReplayBatch({ tick: command.tick, playerNumber: command.playerNumber, commands: [command] });
  }

  /** Exercise the original persisted native receipt, retaining its actual epoch, sequence, tick and world links. */
  redeliverReceipt(): void {
    if (this.disposed || !this.originalReceipt) throw new Error("authority_probe_original_receipt_missing");
    this.bus.reportPersistedOutcome(structuredClone(this.originalReceipt));
  }

  /** Retain BEFORE shutdown; invoking later exercises the disposed production bus, not a guard on this test owner. */
  retainReplayCallback(): () => boolean {
    if (this.disposed || !this.pinned) throw new Error("authority_probe_original_missing");
    const command = structuredClone(this.pinned.command), bus = this.bus;
    return () => {
      const before = JSON.stringify(bus.getAuthorityState());
      bus.playReplayBatch({ tick: command.tick, playerNumber: command.playerNumber, commands: [command] });
      return before === JSON.stringify(bus.getAuthorityState());
    };
  }

  destroy(): void {
    this.disposed = true;
    this.subscriptions.unsubscribe();
    this.admitted.clear();
    this.pinned = null;
    this.originalReceipt = null;
    this.outcomes.length = 0;
  }
}
