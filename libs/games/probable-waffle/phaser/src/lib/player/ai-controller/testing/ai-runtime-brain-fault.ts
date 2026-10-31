import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";

/** Finite, player-local fault at an actual optional publication boundary; never injects a successful order. */
export interface AiRuntimeBrainFault {
  readonly kind: "throw" | "nan" | "cost" | "debug" | "mandatory";
  readonly playerNumber: 2;
  readonly fromTick: number;
  readonly throughTick: number;
}

/** Unknown keys, open-ended windows and non-finite values disable the entire preset. */
export function validAiRuntimeBrainFault(value: unknown): value is AiRuntimeBrainFault | undefined {
  if (value === undefined) return true;
  if (!isRecord(value) || !hasOnlyKeys(value, ["kind", "playerNumber", "fromTick", "throughTick"])) return false;
  const { fromTick, throughTick } = value;
  return value["playerNumber"] === 2 && typeof value["kind"] === "string" &&
    ["throw", "nan", "cost", "debug", "mandatory"].includes(value["kind"]) &&
    typeof fromTick === "number" && Number.isSafeInteger(fromTick) && fromTick >= 1 &&
    typeof throughTick === "number" && Number.isSafeInteger(throughTick) && throughTick >= fromTick && throughTick <= 1600;
}
