/** Stable reasons used by the Stage 1 controller trace and debug overview. */
export type AiDecisionReasonCode =
  | "already_gathering"
  | "command_dispatched"
  | "enemy_not_weaker"
  | "enemy_weaker"
  | "missing_actor_id"
  | "missing_command_bus"
  | "missing_target_id"
  | "no_active_gatherers"
  | "no_idle_workers"
  | "no_legal_research"
  | "non_host"
  | "research_started";

export type AiDecisionOutcome = "dispatched" | "failed" | "succeeded";

/** A bounded, presentation-safe record of one completed legacy AI decision. */
export interface AiDecisionTraceEntry {
  readonly traceId: string;
  readonly sequence: number;
  readonly action: string;
  readonly outcome: AiDecisionOutcome;
  readonly reason: AiDecisionReasonCode;
}

/** Read-only snapshot consumed by the existing debug panel. */
export interface AiDecisionTraceSnapshot {
  readonly playerNumber: number;
  readonly eventLimit: number;
  readonly nextSequence: number;
  readonly events: readonly AiDecisionTraceEntry[];
}

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
