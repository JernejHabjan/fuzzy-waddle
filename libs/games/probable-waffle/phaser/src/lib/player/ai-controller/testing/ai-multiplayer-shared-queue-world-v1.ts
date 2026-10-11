import type { GameCommand, ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";

/** Detached human authority worlds. Neither branch supplies committed AI strategy or full production-family evidence. */
export interface AiMultiplayerSharedQueueWorldV1 {
  readonly branch: "shared_contention" | "cancel_research";
  readonly state: "initializing" | "ready" | "purchasing" | "paid" | "probing" | "rejected" | "refunded" |
    "running" | "stabilizing" | "complete" | "failed";
  readonly failure: string | null;
  readonly setup: {
    readonly tick: number;
    readonly playerNumber: number;
    readonly producerActorId: string;
    readonly producerObjectName: string;
    readonly train: {
      readonly product: ObjectNames;
      /** Runtime alias variants selected by SceneActorCreator are valid results of the same purchase. */
      readonly spawnObjectNames: readonly ObjectNames[];
      readonly price: Readonly<Partial<Record<ResourceType, number>>>;
      readonly durationMs: number;
      readonly refundFactor: number;
    };
    /** Both technologies come from this actual producer, the player's faction roster and shared preflight. */
    readonly research: {
      readonly type: ResearchType;
      readonly price: Readonly<Partial<Record<ResourceType, number>>>;
      readonly durationMs: number;
      readonly refundFactor: number;
    };
    readonly replacement: {
      readonly type: ResearchType;
      readonly price: Readonly<Partial<Record<ResourceType, number>>>;
      readonly durationMs: number;
      readonly refundFactor: number;
    };
    /** Lower refund bound only for setup; emitted refund is always checked against actual remaining time. */
    readonly refundBudget: Readonly<Record<ResourceType, number>>;
    readonly initialResources: Readonly<Record<ResourceType, number>>;
  } | null;
  readonly commands: readonly {
    readonly role: "train" | "research" | "purchase" | "probe" | "cancel" | "resume";
    readonly command: GameCommand;
  }[];
  /** Sender-only actual simulation request time, never inferred from remote delivery. */
  readonly requests: readonly {
    readonly role: AiMultiplayerSharedQueueWorldV1["commands"][number]["role"];
    readonly requestedTick: number;
    readonly command: GameCommand;
  }[];
  readonly checkpoints: readonly {
    readonly boundary: "ready" | "paid" | "contending" | "cancel_pending" | "rejected" | "refunded" |
      "resumed" | "completed" | "stable";
    readonly snapshot: AiRuntimeProductionCaptureV1["snapshots"][number];
  }[];
  readonly capture: AiRuntimeProductionCaptureV1 | null;
}
