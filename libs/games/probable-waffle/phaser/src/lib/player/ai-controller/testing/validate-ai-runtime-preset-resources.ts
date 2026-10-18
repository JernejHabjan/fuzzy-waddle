import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";

const resourceTypes = new Set<string>(Object.values(ResourceType));

/** Bounded initial grants and exact balances; these declarations never count as earned income. */
export function validAiRuntimePresetResources(grants: unknown, starts: unknown): boolean {
  if (!Array.isArray(grants) || grants.length > 16) return false;
  const validGrants = grants.every((grant) => {
    if (!isRecord(grant) || !hasOnlyKeys(grant, ["playerNumber", "amounts"])) return false;
    if (!Number.isSafeInteger(grant["playerNumber"]) || (grant["playerNumber"] as number) < 1) return false;
    const amounts = grant["amounts"];
    if (!isRecord(amounts) || !hasOnlyKeys(amounts, [...resourceTypes])) return false;
    const values = Object.values(amounts);
    return values.length > 0 && values.every((amount) => Number.isFinite(amount) && (amount as number) > 0);
  });
  const resourceStarts = starts ?? [];
  if (!Array.isArray(resourceStarts) || resourceStarts.length > 16) return false;
  const startedPlayers = new Set<number>();
  const validStarts = resourceStarts.every((start) => {
    if (!isRecord(start) || !hasOnlyKeys(start, ["playerNumber", "amounts"])) return false;
    const playerNumber = start["playerNumber"];
    if (typeof playerNumber !== "number" || !Number.isSafeInteger(playerNumber) || playerNumber < 1) return false;
    if (startedPlayers.has(playerNumber)) return false;
    startedPlayers.add(playerNumber);
    const amounts = start["amounts"];
    if (!isRecord(amounts) || !hasOnlyKeys(amounts, [...resourceTypes])) return false;
    const values = Object.values(amounts);
    return (
      values.length > 0 &&
      values.every(
        (amount) => typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0 && amount <= 100_000
      )
    );
  });

  return validGrants && validStarts;
}
