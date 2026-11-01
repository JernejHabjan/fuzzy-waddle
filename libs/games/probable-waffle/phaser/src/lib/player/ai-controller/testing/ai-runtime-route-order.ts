import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { OrderData } from "../../../ai/OrderData";
import type { AiRuntimeCreatedActor } from "./ai-runtime-created-actor";

/** Exact capture-local OrderData identity. A current-order sample alone does not prove the query caller used it. */
export interface AiRuntimeRouteOrder {
  readonly orderId: number;
  readonly orderType: OrderType;
  readonly target: AiRuntimeCreatedActor | null;
  readonly targetTile: Vector3Simple | null;
  readonly commandContext: NonNullable<OrderData["data"]["commandContext"]> | null;
  readonly originOutputId: number | null;
  readonly admissionObserved: boolean;
}
