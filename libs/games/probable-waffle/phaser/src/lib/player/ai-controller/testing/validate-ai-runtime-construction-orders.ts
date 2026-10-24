import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { isRecord as record } from "./ai-runtime-fixture-values";

/** Bound role declarations extend the same preset identity/owner tables used by losses and controls. */
export function validAiRuntimeConstructionOrders(
  value: unknown,
  ids: Set<string>,
  owners: Map<string, number | null>,
  names: Map<string, string>
): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 8) return false;
  const actorNames = new Set<string>(Object.values(ObjectNames));
  const initialRoles = new Set(ids);
  const assignedBuilders = new Set<string>();
  for (const order of value) {
    if (!record(order)) return false;
    if (Object.keys(order).some((key) => !["fixtureActorId", "actorName", "builderFixtureActorIds", "position"].includes(key))) {
      return false;
    }
    const { fixtureActorId, actorName, builderFixtureActorIds, position } = order;
    if (typeof fixtureActorId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureActorId) || ids.has(fixtureActorId) ||
        typeof actorName !== "string" || !actorNames.has(actorName) || !Array.isArray(builderFixtureActorIds) ||
        builderFixtureActorIds.length < 1 || builderFixtureActorIds.length > 8 ||
        new Set(builderFixtureActorIds).size !== builderFixtureActorIds.length ||
        builderFixtureActorIds.some((id: unknown) => typeof id !== "string" || !initialRoles.has(id) ||
          owners.get(id) === null || assignedBuilders.has(id)) ||
        !record(position) || Object.keys(position).some((key) => !["x", "y", "z"].includes(key)) ||
        typeof position.x !== "number" || typeof position.y !== "number" || typeof position.z !== "number" ||
        !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z) ||
        Math.abs(position.x) > 65536 || position.y < 0 || position.y > 65536 || Math.abs(position.z) > 4096) {
      return false;
    }
    const builders = builderFixtureActorIds.filter((id: unknown): id is string => typeof id === "string");
    const first = builders[0];
    if (typeof first !== "string") return false;
    const owner = owners.get(first);
    if (owner === undefined || owner === null || builders.some((id) => owners.get(id) !== owner)) return false;
    ids.add(fixtureActorId);
    owners.set(fixtureActorId, owner);
    names.set(fixtureActorId, actorName);
    for (const id of builders) assignedBuilders.add(id);
  }
  return true;
}
