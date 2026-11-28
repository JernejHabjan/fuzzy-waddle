import type { AiRuntimeCreatedActor } from "../../harness/capture/ai-runtime-created-actor";
import type { AiRuntimeQueueCatalogEntry } from "../queues/ai-runtime-queue-catalog-entry";

/** Detached owned-world authority at the snapshot tick; it supplies no opponent state or navigation verdict. */
export interface AiRuntimeProductionWorld {
  readonly snapshotRestoreInProgress: boolean;
  readonly actors: readonly (AiRuntimeCreatedActor & {
    /** Actual component level, distinct from the player's researched level for future products. */
    readonly currentLevel: number;
  })[];
  readonly catalog: readonly AiRuntimeQueueCatalogEntry[];
  readonly gaps: readonly string[];
}
