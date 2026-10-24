import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeQueueCatalogEntryV1 } from "./ai-runtime-queue-catalog-entry-v1";

/** Detached owned-world authority at the snapshot tick; it supplies no opponent state or navigation verdict. */
export interface AiRuntimeProductionWorldV1 {
  readonly snapshotRestoreInProgress: boolean;
  readonly actors: readonly (AiRuntimeCreatedActorV1 & {
    /** Actual component level, distinct from the player's researched level for future products. */
    readonly currentLevel: number;
  })[];
  readonly catalog: readonly AiRuntimeQueueCatalogEntryV1[];
  readonly gaps: readonly string[];
}
