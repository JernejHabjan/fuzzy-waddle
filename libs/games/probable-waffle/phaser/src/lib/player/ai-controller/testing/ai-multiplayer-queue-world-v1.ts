import type { GameCommand, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";

/** Narrow shared-authority experiment, separate from AI strategy/production-family acceptance. No credentials or handles. */
export interface AiMultiplayerQueueWorldV1 {
  readonly state: "initializing" | "ready" | "purchasing" | "paid" | "probing" | "rejected" | "refunded" | "resuming" |
    "finishing" | "complete" | "failed";
  readonly failure: string | null;
  readonly setup: {
    readonly tick: number;
    readonly playerNumber: number;
    readonly producerActorId: string;
    readonly product: ObjectNames;
    readonly price: Readonly<Partial<Record<ResourceType, number>>>;
    readonly refundFactor: number;
    readonly durationMs: number;
    /** Both peers independently apply this definition-derived resource start before any test purchase. */
    readonly initialResources: Readonly<Record<ResourceType, number>>;
  } | null;
  readonly commands: readonly {
    readonly role: "purchase" | "probe" | "cancel" | "resume";
    readonly command: GameCommand;
  }[];
  /** Only the sender records dispatch time. A remote delivery is never labelled a cancellation request. */
  readonly requests: readonly {
    readonly role: "purchase" | "probe" | "cancel" | "resume";
    readonly requestedTick: number;
    readonly command: GameCommand;
  }[];
  readonly checkpoints: readonly {
    readonly boundary: "ready" | "paid" | "cancel_pending" | "rejected" | "refunded" | "resumed" | "complete";
    readonly snapshot: AiRuntimeProductionCaptureV1["snapshots"][number];
  }[];
  readonly capture: AiRuntimeProductionCaptureV1 | null;
}
