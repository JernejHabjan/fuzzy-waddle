import type { GameCommand, ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { QueueResourceEmissionRecord } from "../../../data/queue-resource-emission-record";
import type { QueueResourceEmissionScope } from "../../../data/queue-resource-emission-scope";

/** Detached item lineage at each actual callback. Missing provenance stays explicit even with a matching cash delta. */
export interface AiRuntimeQueueResourceV1 {
  readonly actorId: string | null;
  readonly ownerNumber: number | null;
  readonly itemId: string | null;
  readonly identitySource: "command" | "capture_local";
  readonly operation: QueueResourceEmissionScope["operation"];
  readonly objectName: ObjectNames | null;
  readonly researchType: ResearchType | null;
  readonly totalTimeMs: number | null;
  readonly remainingTimeMs: number | null;
  readonly payment: "immediate" | "per_successful_tick" | "unknown";
  /** Stored production or definition-backed research price, kept separate from the emitted/refunded vector. */
  readonly storedPrice: Readonly<Partial<Record<ResourceType, number>>> | null;
  readonly refundFactor: number | null;
  readonly originatingCommandContext: NonNullable<UnifiedQueueItem["commandContext"]> | null;
  readonly cancellationCommand: GameCommand | null;
  readonly emission: QueueResourceEmissionRecord;
  readonly gaps: readonly string[];
}
