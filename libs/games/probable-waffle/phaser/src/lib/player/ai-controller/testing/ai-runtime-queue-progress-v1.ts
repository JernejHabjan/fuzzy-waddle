import type { QueueProgressEvent } from "../../../entity/components/queue/queue-progress-event";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

/** Detached actual attempt state. The exhausted item remains physically present until shared completion removes it. */
export interface AiRuntimeQueueProgressV1 {
  readonly attemptId: number;
  readonly phase: QueueProgressEvent["phase"];
  readonly actorId: string | null;
  readonly item: AiRuntimeProductionQueueV1["lanes"][number]["items"][number] | null;
  readonly laneId: string | null;
  readonly deltaMs: number;
  readonly remainingBeforeMs: number;
  readonly gaps: readonly string[];
  readonly snapshotRestoreInProgress: boolean;
}
