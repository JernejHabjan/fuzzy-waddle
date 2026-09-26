import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";

const actorNames = new Set<string>(Object.values(ObjectNames));
const resourceTypes = new Set<string>(Object.values(ResourceType));

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function validPresetWorld(value: unknown): boolean {
  if (!isRecord(value) || !hasOnlyKeys(value, ["fixtureId", "provenance", "actors", "resourceGrants", "queues", "events"])) {
    return false;
  }
  if (typeof value["fixtureId"] !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(value["fixtureId"])) return false;
  const provenance = value["provenance"];
  if (
    !isRecord(provenance) ||
    !hasOnlyKeys(provenance, ["sourceRevision", "fixtureDigest"]) ||
    typeof provenance["sourceRevision"] !== "string" ||
    !/^[a-f0-9]{40}$/.test(provenance["sourceRevision"]) ||
    typeof provenance["fixtureDigest"] !== "string" ||
    !/^fnv1a32:[a-f0-9]{8}$/.test(provenance["fixtureDigest"])
  ) {
    return false;
  }
  if (!Array.isArray(value["actors"]) || value["actors"].length > 100) return false;
  const fixtureActorIds = new Set<string>();
  const actorOwners = new Map<string, number | null>();
  for (const actor of value["actors"]) {
    if (!isRecord(actor) || !hasOnlyKeys(actor, ["fixtureActorId", "actorName", "owner", "position"])) return false;
    const fixtureActorId = actor["fixtureActorId"];
    if (typeof fixtureActorId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureActorId)) return false;
    if (fixtureActorIds.has(fixtureActorId)) return false;
    fixtureActorIds.add(fixtureActorId);
    if (typeof actor["actorName"] !== "string" || !actorNames.has(actor["actorName"])) return false;
    if (actor["owner"] !== null && (!Number.isSafeInteger(actor["owner"]) || (actor["owner"] as number) < 1)) {
      return false;
    }
    actorOwners.set(fixtureActorId, actor["owner"] as number | null);
    const position = actor["position"];
    if (!isRecord(position) || !hasOnlyKeys(position, ["x", "y", "z"])) return false;
    if (![position["x"], position["y"], position["z"]].every((coordinate) => Number.isFinite(coordinate))) return false;
  }
  if (!Array.isArray(value["resourceGrants"]) || value["resourceGrants"].length > 16) return false;
  const validGrants = value["resourceGrants"].every((grant) => {
    if (!isRecord(grant) || !hasOnlyKeys(grant, ["playerNumber", "amounts"])) return false;
    if (!Number.isSafeInteger(grant["playerNumber"]) || (grant["playerNumber"] as number) < 1) return false;
    const amounts = grant["amounts"];
    if (!isRecord(amounts) || !hasOnlyKeys(amounts, [...resourceTypes])) return false;
    const values = Object.values(amounts);
    return values.length > 0 && values.every((amount) => Number.isFinite(amount) && (amount as number) > 0);
  });
  const queues = value["queues"] ?? [];
  if (!Array.isArray(queues) || queues.length > 16) return false;
  const validQueues = queues.every(
    (queue) =>
      isRecord(queue) &&
      hasOnlyKeys(queue, ["producerFixtureActorId", "actorName", "count"]) &&
      typeof queue["producerFixtureActorId"] === "string" &&
      fixtureActorIds.has(queue["producerFixtureActorId"]) &&
      actorOwners.get(queue["producerFixtureActorId"]) !== null &&
      typeof queue["actorName"] === "string" &&
      actorNames.has(queue["actorName"]) &&
      Number.isSafeInteger(queue["count"]) &&
      (queue["count"] as number) >= 1 &&
      (queue["count"] as number) <= 5
  );
  const events = value["events"] ?? [];
  if (!Array.isArray(events) || events.length > 16) return false;
  const eventIds = new Set<string>();
  const validEvents = events.every((event) => {
    if (!isRecord(event) || !hasOnlyKeys(event, ["id", "tick", "kind", "owner", "objectName"])) return false;
    if (typeof event["id"] !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(event["id"])) return false;
    if (eventIds.has(event["id"])) return false;
    eventIds.add(event["id"]);
    return (
      Number.isSafeInteger(event["tick"]) &&
      (event["tick"] as number) > 0 &&
      event["kind"] === "destroy_owned_actor" &&
      Number.isSafeInteger(event["owner"]) &&
      (event["owner"] as number) > 0 &&
      typeof event["objectName"] === "string" &&
      actorNames.has(event["objectName"])
    );
  });
  const workCount = value["actors"].length + value["resourceGrants"].length + queues.length + events.length;
  return validGrants && validQueues && validEvents && workCount > 0;
}

export function isAiRuntimeBrowserTestConfigV1(value: unknown): value is AiRuntimeBrowserTestConfigV1 {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "enabled", "seed", "startPaused", "presetWorld"])) {
    return false;
  }
  return (
    value["schemaVersion"] === 1 &&
    value["enabled"] === true &&
    value["startPaused"] === true &&
    Number.isSafeInteger(value["seed"]) &&
    (value["seed"] as number) >= 0 &&
    (value["presetWorld"] === undefined || validPresetWorld(value["presetWorld"]))
  );
}
