import type { QueueProgressEvent } from "../../../../../entity/components/queue/queue-progress-event";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";

/** Detached actual attempt state. The exhausted item remains physically present until shared completion removes it. */
export interface AiRuntimeQueueProgress {
  readonly attemptId: number;
  readonly phase: QueueProgressEvent["phase"];
  readonly actorId: string | null;
  readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number] | null;
  readonly laneId: string | null;
  readonly deltaMs: number;
  readonly remainingBeforeMs: number;
  readonly gaps: readonly string[];
  readonly snapshotRestoreInProgress: boolean;
}
