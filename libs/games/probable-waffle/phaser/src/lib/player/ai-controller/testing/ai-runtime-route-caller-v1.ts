import type { MovementQueryContext } from "../../../entity/systems/movement-query-context";
import type { AiRuntimeRouteOrderV1 } from "./ai-runtime-route-order-v1";

/** Exact use-site snapshot and lifetime fence; query completion still does not prove task fulfillment. */
export interface AiRuntimeRouteCallerV1 {
  readonly invocationId: number;
  readonly caller: MovementQueryContext["caller"];
  readonly stage: "initial" | "repath" | "fallback";
  readonly order: AiRuntimeRouteOrderV1 | null;
  readonly lifetimeValid: boolean;
}
