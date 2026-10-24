import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";

const actorNames = new Set<string>(Object.values(ObjectNames));

/** Finite native loss/cancellation schedule; cancellation always pins an original declared role. */
export function validAiRuntimePresetEvents(
  events: unknown, owners: ReadonlyMap<string, number | null>, names: ReadonlyMap<string, string>
): boolean {
  if (!Array.isArray(events) || events.length > 16) return false;
  const eventIds = new Set<string>();
  const validEvents = events.every((event) => {
    if (!isRecord(event) || !hasOnlyKeys(event,
      ["id", "tick", "kind", "owner", "objectName", "fixtureActorId", "damage", "membership"]))
      return false;
    if (typeof event["id"] !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(event["id"])) return false;
    if (eventIds.has(event["id"])) return false;
    eventIds.add(event["id"]);
    const target = event["fixtureActorId"];
    if (event["membership"] !== undefined && (event["membership"] !== "optional_passenger" ||
      event["kind"] !== "destroy_owned_actor" || event["owner"] !== 2 || target !== undefined)) return false;
    if (event["kind"] === "destroy_ai_site" && target !== undefined) return false;
    if (event["kind"] === "damage_owned_actor" ? typeof target !== "string" ||
      typeof event["damage"] !== "number" || !Number.isSafeInteger(event["damage"]) ||
      event["damage"] <= 0 || event["damage"] > 100000 : event["damage"] !== undefined) return false;
    if (
      target !== undefined &&
      (typeof target !== "string" ||
        !names.has(target) ||
        owners.get(target) !== event["owner"] ||
        names.get(target) !== event["objectName"])
    )
      return false;
    return (
      Number.isSafeInteger(event["tick"]) &&
      (event["tick"] as number) > 0 &&
      (event["kind"] === "destroy_owned_actor" ||
        event["kind"] === "destroy_ai_site" ||
        event["kind"] === "damage_owned_actor" ||
        (event["kind"] === "cancel_unfinished_site" && typeof target === "string")) &&
      Number.isSafeInteger(event["owner"]) &&
      (event["owner"] as number) > 0 &&
      typeof event["objectName"] === "string" &&
      actorNames.has(event["objectName"])
    );
  });

  return validEvents;
}
