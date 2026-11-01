import type { MovementQueryContext } from "../../../entity/systems/movement-query-context";
import type { AiRuntimeRouteOrder } from "./ai-runtime-route-order";

/** Exact use-site snapshot and lifetime fence; query completion still does not prove task fulfillment. */
export interface AiRuntimeRouteCaller {
  readonly invocationId: number;
  readonly caller: MovementQueryContext["caller"];
  readonly stage: "initial" | "repath" | "fallback";
  readonly order: AiRuntimeRouteOrder | null;
  readonly lifetimeValid: boolean;
}
