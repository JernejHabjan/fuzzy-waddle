import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

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
    if (!binding || typeof binding !== "object" || Array.isArray(binding)) return false;
    if (Object.keys(binding).some((key) => !["fixtureActorId", "actorName", "owner"].includes(key))) return false;
    const { fixtureActorId, actorName, owner } = binding;
    if (typeof fixtureActorId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureActorId)) return false;
    if (ids.has(fixtureActorId) || typeof actorName !== "string" || !names.has(actorName)) return false;
    if (typeof owner !== "number" || !Number.isSafeInteger(owner) || owner < 1) return false;
    ids.add(fixtureActorId);
    owners.set(fixtureActorId, owner);
    authoredNames.set(fixtureActorId, actorName);
  }
  return true;
}
