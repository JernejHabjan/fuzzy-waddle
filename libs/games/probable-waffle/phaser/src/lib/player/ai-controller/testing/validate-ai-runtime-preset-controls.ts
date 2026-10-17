import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** Strict bounded controller input parser. Rejects undeclared actors, cross-owner rally targets and invented actions. */
export function validAiRuntimePresetControls(value: unknown, owners: ReadonlyMap<string, number | null>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 32) return false;
  const ids = new Set<string>();
  const names = new Set<string>(Object.values(ObjectNames));
  const record = (entry: unknown): entry is Record<string, unknown> =>
    !!entry && typeof entry === "object" && !Array.isArray(entry);
  const only = (entry: Record<string, unknown>, keys: string[]) =>
    Object.keys(entry).every((key) => keys.includes(key));
  return value.every((entry) => {
    if (!record(entry) || !only(entry, ["id", "requestTick", "applicationTick", "producerFixtureActorId", "action"]))
      return false;
    const { id, requestTick, applicationTick, producerFixtureActorId, action } = entry;
    if (
      typeof id !== "string" ||
      !/^[a-z0-9][a-z0-9-]{2,63}$/.test(id) ||
      ids.has(id) ||
      typeof requestTick !== "number" ||
      !Number.isSafeInteger(requestTick) ||
      requestTick < 0 ||
      typeof applicationTick !== "number" ||
      !Number.isSafeInteger(applicationTick) ||
      applicationTick < requestTick ||
      applicationTick > 100_000 ||
      typeof producerFixtureActorId !== "string" ||
      !owners.has(producerFixtureActorId) ||
      owners.get(producerFixtureActorId) === null ||
      !record(action)
    )
      return false;
    ids.add(id);
    if (action["kind"] === "rally") {
      const target = action["targetFixtureActorId"];
      return (
        only(action, ["kind", "targetFixtureActorId"]) &&
        typeof target === "string" &&
        target !== producerFixtureActorId &&
        owners.has(target) &&
        owners.get(target) === owners.get(producerFixtureActorId)
      );
    }
    if (action["kind"] === "produce")
      return (
        only(action, ["kind", "actorName"]) && typeof action["actorName"] === "string" && names.has(action["actorName"])
      );
    return (
      action["kind"] === "cancel_production" &&
      only(action, ["kind", "setupQueueIndex"]) &&
      typeof action["setupQueueIndex"] === "number" &&
      Number.isSafeInteger(action["setupQueueIndex"]) &&
      action["setupQueueIndex"] >= 0 &&
      action["setupQueueIndex"] < 80
    );
  });
}

/** One destination per owned producer family; cross-owner or ambiguous policies cannot silently win by array order. */
export function validAiRuntimePresetRallies(value: unknown, owners: ReadonlyMap<string, number | null>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 16) return false;
  const names = new Set<string>(Object.values(ObjectNames)),
    keys = new Set<string>();
  return value.every((rule: unknown) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) return false;
    const fields = Object.keys(rule);
    if (
      fields.some((key) => !["owner", "producerObjectName", "targetFixtureActorId"].includes(key)) ||
      !("owner" in rule) ||
      !("producerObjectName" in rule) ||
      !("targetFixtureActorId" in rule)
    )
      return false;
    if (
      typeof rule.owner !== "number" ||
      !Number.isSafeInteger(rule.owner) ||
      rule.owner < 1 ||
      typeof rule.producerObjectName !== "string" ||
      !names.has(rule.producerObjectName) ||
      typeof rule.targetFixtureActorId !== "string" ||
      !owners.has(rule.targetFixtureActorId) ||
      owners.get(rule.targetFixtureActorId) !== rule.owner
    )
      return false;
    const key = `${rule.owner}:${rule.producerObjectName}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}
