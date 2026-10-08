import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProducerRouteV1 } from "./ai-runtime-producer-route-v1";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";
import type { AiRuntimeConstructionCatalogV1 } from "./ai-runtime-construction-catalog-v1";
import type { AiRuntimeNavigationBoundaryV1 } from "./ai-runtime-navigation-boundary-v1";
import type { AiRuntimeMovementV1 } from "./ai-runtime-movement-v1";
import type { AiRuntimeServiceAttemptV1 } from "./ai-runtime-service-attempt-v1";
import type { AiRuntimeResourceServiceV1 } from "./ai-runtime-resource-service-v1";

/** Detached native spatial observations. No verdict supplies a general producer-reachable or safe-site boolean. */
export type AiRuntimeProductionSpatialV1 = {
  readonly clockTick: number | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly sceneActive: boolean;
  readonly gaps: readonly string[];
} & (
  | AiRuntimeProducerRouteV1
  | AiRuntimeMovementV1
  | AiRuntimeServiceAttemptV1
  | AiRuntimeResourceServiceV1
  | { readonly kind: "placement"; readonly command: ConstructCommand; readonly site: AiRuntimeCreatedActorV1;
    readonly footprint: readonly Vector2Simple[] | null; readonly legal: boolean;
    /** Legacy captures omit pricing; omission cannot be filled from a later definition or checkpoint. */
    readonly catalog?: AiRuntimeConstructionCatalogV1 }
  | { readonly kind: "spawn"; readonly producer: AiRuntimeCreatedActorV1;
    readonly item: AiRuntimeProductionQueueV1["lanes"][number]["items"][number]; readonly waterUnit: boolean;
    readonly tile: Vector2Simple | null; readonly position: Vector3Simple | null }
  | { readonly kind: "builder_path"; readonly queryId: number; readonly phase: "requested" | "resolved" | "rejected" | "threw";
    /** Legacy captures omit this; later observations cannot backfill either query boundary. */
    readonly navigation?: AiRuntimeNavigationBoundaryV1;
    /** Exact synchronous native lookup, detached at terminal. Legacy/no-query/ambiguous ownership remains omitted. */
    readonly nativeQuery?: NavigationNativeQuery;
    readonly source: AiRuntimeCreatedActorV1; readonly target: AiRuntimeCreatedActorV1;
    readonly sourceTile: Vector2Simple | null; readonly targetTile: Vector2Simple | null;
    /** Actual shared caller radius; null means the native default was used. */
    readonly radiusTiles: number | null;
    /** Complete returned path including empty success; null means no path or bounded capture loss. */
    readonly path: readonly Vector2Simple[] | null; readonly result: "path" | "no_path" | null }
);
