import type { AiDecisionReasonCode } from "./contracts/ai-decision-reason-code";
export type { AiDecisionReasonCode } from "./contracts/ai-decision-reason-code";
import type { AiDecisionOutcome } from "./contracts/ai-decision-outcome";
export type { AiDecisionOutcome } from "./contracts/ai-decision-outcome";
import type { AiDecisionTraceEntry } from "./contracts/ai-decision-trace-entry";
export type { AiDecisionTraceEntry } from "./contracts/ai-decision-trace-entry";
import type { AiDecisionTraceSnapshot } from "./contracts/ai-decision-trace-snapshot";
export type { AiDecisionTraceSnapshot } from "./contracts/ai-decision-trace-snapshot";

/**
 * Retains only a small deterministic history. It deliberately stores no Phaser
 * objects or hidden-world data, so the debug panel can project it read-only.
 */
export class AiDecisionTrace {
  private nextSequence = 0;
  private events: AiDecisionTraceEntry[] = [];

  constructor(
    private readonly playerNumber: number,
    private readonly eventLimit = 32
  ) {
    if (!Number.isInteger(eventLimit) || eventLimit < 1) {
      throw new Error("AI decision trace eventLimit must be a positive integer");
    }
  }

  record(action: string, outcome: AiDecisionOutcome, reason: AiDecisionReasonCode): AiDecisionTraceEntry {
    const sequence = this.nextSequence++;
    const event: AiDecisionTraceEntry = {
      traceId: `ai:${this.playerNumber}:${sequence}`,
      sequence,
      action,
      outcome,
      reason
    };
    this.events.push(event);
    if (this.events.length > this.eventLimit) {
      this.events.splice(0, this.events.length - this.eventLimit);
    }
    return event;
  }

  snapshot(): AiDecisionTraceSnapshot {
    return {
      playerNumber: this.playerNumber,
      eventLimit: this.eventLimit,
      nextSequence: this.nextSequence,
      events: this.events.map((event) => ({ ...event }))
    };
  }

  /** Produces a repeatable export for fixtures and debug comparisons. */
  serialize(): string {
    return JSON.stringify(this.snapshot());
  }
}
