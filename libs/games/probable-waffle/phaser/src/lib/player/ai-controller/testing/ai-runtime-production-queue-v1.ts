import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Detached physical lanes from the owned QueueComponent; backlog capacity is never parallel throughput. */
export interface AiRuntimeProductionQueueV1 {
  readonly actorId: string;
  readonly objectName: string;
  readonly lanes: readonly {
    readonly laneId: string;
    readonly capacity: number;
    readonly items: readonly {
      /** Command-backed identity survives save; uncommanded identity is capture-local and never an array position. */
      readonly itemId: string;
      readonly identitySource: "command" | "capture_local";
      readonly commandId: string | null;
      readonly effectId: string | null;
      readonly objectName: ObjectNames | null;
      readonly researchType: ResearchType | null;
      readonly totalTimeMs: number;
      readonly remainingTimeMs: number;
      /** The stored queue cost, not a guessed price from current progress. Research is paid immediately. */
      readonly payment: "immediate" | "per_successful_tick" | "unknown";
      readonly charge: Readonly<Partial<Record<ResourceType, number>>>;
    }[];
  }[];
}
