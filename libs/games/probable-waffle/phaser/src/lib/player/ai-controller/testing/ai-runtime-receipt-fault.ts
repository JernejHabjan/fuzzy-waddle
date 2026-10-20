import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";

/** One finite consumer-local fault. Shared bus evidence and native application remain available independently. */
export interface AiRuntimeReceiptFault {
  readonly id: string;
  readonly playerNumber: number;
  readonly fromTick: number;
  readonly throughTick: number;
  readonly maximumCommands: number;
  readonly commandKind: "production" | "any";
  readonly holdHistory?: true;
  readonly destroyOutput?: true;
  readonly contendQueue?: true;
}

export function validAiRuntimeReceiptFault(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "playerNumber", "fromTick", "throughTick", "maximumCommands",
    "commandKind", "holdHistory", "destroyOutput", "contendQueue"])) return false;
  const { id, playerNumber, fromTick, throughTick, maximumCommands, commandKind } = value;
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]{2,63}$/.test(id) && playerNumber === 2 &&
    typeof fromTick === "number" && Number.isSafeInteger(fromTick) && fromTick >= 1 &&
    typeof throughTick === "number" && Number.isSafeInteger(throughTick) && throughTick >= fromTick && throughTick <= 4000 &&
    throughTick - fromTick <= 3000 && typeof maximumCommands === "number" && Number.isSafeInteger(maximumCommands) &&
    maximumCommands >= 1 && maximumCommands <= 128 && (commandKind === "production" || commandKind === "any") &&
    ["holdHistory", "destroyOutput", "contendQueue"].every((key) => value[key] === undefined || value[key] === true) &&
    (!(value["destroyOutput"] || value["contendQueue"]) || commandKind === "production");
}
