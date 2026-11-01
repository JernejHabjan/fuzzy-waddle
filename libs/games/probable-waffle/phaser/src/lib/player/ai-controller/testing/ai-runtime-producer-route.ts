import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeCreatedActor } from "./ai-runtime-created-actor";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";
import type { AiRuntimeNavigationBoundary } from "./ai-runtime-navigation-boundary";
import type { AiRuntimeRouteOrder } from "./ai-runtime-route-order";
import type { AiRuntimeRouteCaller } from "./ai-runtime-route-caller";

/** Native output branch and existing query observations. They never assert movement completion or useful demand fulfillment. */
export type AiRuntimeProducerRoute =
  | { readonly kind: "route_order"; readonly source: AiRuntimeCreatedActor; readonly order: AiRuntimeRouteOrder }
  | { readonly kind: "route_order_restore"; readonly source: AiRuntimeCreatedActor;
    readonly reason?: "restore_attempt" | "controller_replaced" }
  | { readonly kind: "route_rally_order"; readonly source: AiRuntimeCreatedActor;
    readonly orderId: number; readonly outputId: number }
  | { readonly kind: "output"; readonly outputId: number;
    readonly producer: AiRuntimeCreatedActor; readonly product: AiRuntimeCreatedActor;
    readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number];
    readonly rallyMode: "unset" | "movement_fallback" | "actor_action" | "tile_action" | "no_target";
    readonly target: AiRuntimeCreatedActor | null; readonly targetTile: Vector3Simple | null }
  | { readonly kind: "producer_path"; readonly queryId: number;
    readonly purpose: "producer_service" | "product_output";
    /** Exact capture-local output event identity, never a name/tile/nearest-time match. */
    readonly outputId: number | null;
    readonly method: "object_radius" | "tile_static" | "tile_dynamic";
    readonly phase: "requested" | "resolved" | "rejected" | "threw";
    /** Omitted for legacy/lost observation; null means no current order at this exact boundary. */
    readonly currentOrder?: AiRuntimeRouteOrder | null;
    /** Explicit native caller/order use; omitted for legacy, unordered helpers or bounded observation loss. */
    readonly queryCaller?: AiRuntimeRouteCaller;
    /** Actual object scene membership at this boundary, independent of the object's own scene index lookup. */
    readonly sourceInCaptureScene: boolean; readonly targetInCaptureScene: boolean | null;
    readonly source: AiRuntimeCreatedActor; readonly target: AiRuntimeCreatedActor | null;
    readonly sourceTile: Vector2Simple | null; readonly targetTile: Vector2Simple | null;
    /** Actual supplied radius; null means the native default, or an unrelated tile-query method. */
    readonly radiusTiles: number | null;
    /** Capture-local graph/request samples, never completed native revision or cache freshness. */
    readonly navigation: AiRuntimeNavigationBoundary | undefined;
    /** Exact native cache lookup or uncached overlay; omitted for early return, legacy or observation loss. */
    readonly nativeQuery?: NavigationNativeQuery;
    /** Only the actual argument count, never hidden occupancy actors or a recreated blocker grid. */
    readonly dynamicBlockerCount: number | null;
    /** Detached complete native result, including empty success; null also represents bounded loss with a gap. */
    readonly path: readonly Vector2Simple[] | null; readonly result: "path" | "no_path" | null };
