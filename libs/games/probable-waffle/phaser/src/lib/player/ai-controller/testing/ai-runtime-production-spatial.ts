import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProducerRoute } from "./ai-runtime-producer-route";
import type { AiRuntimeCreatedActor } from "./ai-runtime-created-actor";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";
import type { AiRuntimeConstructionCatalog } from "./ai-runtime-construction-catalog";
import type { AiRuntimeNavigationBoundary } from "./ai-runtime-navigation-boundary";
import type { AiRuntimeMovement } from "./ai-runtime-movement";
import type { AiRuntimeServiceAttempt } from "./ai-runtime-service-attempt";
import type { AiRuntimeResourceService } from "./ai-runtime-resource-service";
import type { AiRuntimePlacementClearance } from "./ai-runtime-placement-clearance";

/** Detached native spatial observations. No verdict supplies a general producer-reachable or safe-site boolean. */
export type AiRuntimeProductionSpatial = {
  readonly clockTick: number | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly sceneActive: boolean;
  readonly gaps: readonly string[];
} & (
  | AiRuntimeProducerRoute
  | AiRuntimeMovement
  | AiRuntimeServiceAttempt
  | AiRuntimeResourceService
  | {
      readonly kind: "placement";
      readonly command: ConstructCommand;
      readonly site: AiRuntimeCreatedActor;
      readonly footprint: readonly Vector2Simple[] | null;
      readonly legal: boolean;
      /** Legacy captures omit pricing; omission cannot be filled from a later definition or checkpoint. */
      readonly catalog?: AiRuntimeConstructionCatalog;
      /** Optional fresh static geometry at this exact footprint boundary; no transit/spawn/usefulness claim. */
      readonly clearance?: AiRuntimePlacementClearance;
    }
  | {
      readonly kind: "spawn";
      readonly producer: AiRuntimeCreatedActor;
      readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number];
      readonly waterUnit: boolean;
      readonly tile: Vector2Simple | null;
      readonly position: Vector3Simple | null;
    }
  | {
      readonly kind: "builder_path";
      readonly queryId: number;
      readonly phase: "requested" | "resolved" | "rejected" | "threw";
      /** Legacy captures omit this; later observations cannot backfill either query boundary. */
      readonly navigation?: AiRuntimeNavigationBoundary;
      /** Exact synchronous native lookup, detached at terminal. Legacy/no-query/ambiguous ownership remains omitted. */
      readonly nativeQuery?: NavigationNativeQuery;
      readonly source: AiRuntimeCreatedActor;
      readonly target: AiRuntimeCreatedActor;
      readonly sourceTile: Vector2Simple | null;
      readonly targetTile: Vector2Simple | null;
      /** Actual shared caller radius; null means the native default was used. */
      readonly radiusTiles: number | null;
      /** Complete returned path including empty success; null means no path or bounded capture loss. */
      readonly path: readonly Vector2Simple[] | null;
      readonly result: "path" | "no_path" | null;
      /** Bounded height-graph diagnostic sampled only for a native no-path result. */
      readonly sourceNavigable?: boolean | null;
      readonly targetNavigable?: boolean | null;
      readonly heightGraphReachable?: boolean | null;
    }
);
