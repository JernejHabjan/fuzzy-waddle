import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";
import type { AiRuntimeNavigationBoundaryV1 } from "./ai-runtime-navigation-boundary-v1";

/** Native output branch and existing query observations. They never assert movement completion or useful demand fulfillment. */
export type AiRuntimeProducerRouteV1 =
  | { readonly kind: "output"; readonly outputId: number;
    readonly producer: AiRuntimeCreatedActorV1; readonly product: AiRuntimeCreatedActorV1;
    readonly item: AiRuntimeProductionQueueV1["lanes"][number]["items"][number];
    readonly rallyMode: "unset" | "movement_fallback" | "actor_action" | "tile_action" | "no_target";
    readonly target: AiRuntimeCreatedActorV1 | null; readonly targetTile: Vector3Simple | null }
  | { readonly kind: "producer_path"; readonly queryId: number;
    readonly purpose: "producer_service" | "product_output";
    /** Exact capture-local output event identity, never a name/tile/nearest-time match. */
    readonly outputId: number | null;
    readonly method: "object_radius" | "tile_static" | "tile_dynamic";
    readonly phase: "requested" | "resolved" | "rejected" | "threw";
    /** Actual object scene membership at this boundary, independent of the object's own scene index lookup. */
    readonly sourceInCaptureScene: boolean; readonly targetInCaptureScene: boolean | null;
    readonly source: AiRuntimeCreatedActorV1; readonly target: AiRuntimeCreatedActorV1 | null;
    readonly sourceTile: Vector2Simple | null; readonly targetTile: Vector2Simple | null;
    /** Actual supplied radius; null means the native default, or an unrelated tile-query method. */
    readonly radiusTiles: number | null;
    /** Capture-local graph/request samples, never completed native revision or cache freshness. */
    readonly navigation: AiRuntimeNavigationBoundaryV1 | undefined;
    /** Exact native cache lookup or uncached overlay; omitted for early return, legacy or observation loss. */
    readonly nativeQuery?: NavigationNativeQuery;
    /** Only the actual argument count, never hidden occupancy actors or a recreated blocker grid. */
    readonly dynamicBlockerCount: number | null;
    /** Detached complete native result, including empty success; null also represents bounded loss with a gap. */
    readonly path: readonly Vector2Simple[] | null; readonly result: "path" | "no_path" | null };
