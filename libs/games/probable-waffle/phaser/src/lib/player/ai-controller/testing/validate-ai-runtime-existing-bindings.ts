import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";

const names = new Set<string>(Object.values(ObjectNames));

export function validAiRuntimeExistingBindings(
  value: unknown,
  ids: Set<string>,
  owners: Map<string, number | null>,
  authoredNames: Map<string, string>
): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 16) return false;
  for (const binding of value) {
    if (!isRecord(binding) || !hasOnlyKeys(binding, ["fixtureActorId", "actorName", "owner", "position"])) return false;
    const { fixtureActorId, actorName, owner, position } = binding;
    if (typeof fixtureActorId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureActorId)) return false;
    if (ids.has(fixtureActorId) || typeof actorName !== "string" || !names.has(actorName)) return false;
    if (owner !== null && (typeof owner !== "number" || !Number.isSafeInteger(owner) || owner < 1)) return false;
    if (owner === null && position === undefined) return false;
    if (position !== undefined && (!isRecord(position) || !hasOnlyKeys(position, ["x", "y", "z"]) ||
      ![position["x"], position["y"], position["z"]].every((coordinate) =>
        typeof coordinate === "number" && Number.isFinite(coordinate) && Math.abs(coordinate) <= 65536
      ))) return false;
    ids.add(fixtureActorId);
    owners.set(fixtureActorId, owner);
    authoredNames.set(fixtureActorId, actorName);
  }
  return true;
}
