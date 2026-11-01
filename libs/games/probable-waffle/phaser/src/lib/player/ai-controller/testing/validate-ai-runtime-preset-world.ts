import { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";

import { readAiRuntimePresetRoles } from "./read-ai-runtime-preset-roles";
import { validAiRuntimePresetResources } from "./validate-ai-runtime-preset-resources";
import { validAiRuntimePresetEvents } from "./validate-ai-runtime-preset-events";
import { validAiRuntimeProtectedRoutes } from "./validate-ai-runtime-protected-routes";
import { validAiRuntimePresetControls, validAiRuntimePresetRallies } from "./validate-ai-runtime-preset-controls";

const actorNames = new Set<string>(Object.values(ObjectNames));
const researchTypes = new Set<string>(Object.values(ResearchType));

/** Strict preset schema, preserving existing queues/orders while admitting ordinary pre-tick construction. */
export function validAiRuntimePresetWorld(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const roles = readAiRuntimePresetRoles(value);
  if (!roles || !Array.isArray(value["actors"])) return false;
  const { fixtureActorIds, actorOwners, authoredNames } = roles;
  const owners = new Set([...actorOwners.values()].filter((owner): owner is number => owner !== null));
  if (!validAiRuntimeProtectedRoutes(value["protectedRoutes"], owners)) return false;
  const resourceStarts = value["resourceStarts"] ?? [];
  if (!Array.isArray(value["resourceGrants"]) || !Array.isArray(resourceStarts) ||
      !validAiRuntimePresetResources(value["resourceGrants"], resourceStarts)) return false;
  const queues = value["queues"] ?? [];
  const unfinishedRoles = new Set(Array.isArray(value["constructionOrders"]) ? value["constructionOrders"].flatMap((order) =>
    isRecord(order) && typeof order["fixtureActorId"] === "string" ? [order["fixtureActorId"]] : []
  ) : []);
  if (!Array.isArray(queues) || queues.length > 16) return false;
  const validQueues = queues.every(
    (queue) =>
      isRecord(queue) &&
      hasOnlyKeys(queue, ["producerFixtureActorId", "actorName", "count"]) &&
      typeof queue["producerFixtureActorId"] === "string" &&
      fixtureActorIds.has(queue["producerFixtureActorId"]) &&
      !unfinishedRoles.has(queue["producerFixtureActorId"]) &&
      actorOwners.get(queue["producerFixtureActorId"]) !== null &&
      typeof queue["actorName"] === "string" &&
      actorNames.has(queue["actorName"]) &&
      Number.isSafeInteger(queue["count"]) &&
      (queue["count"] as number) >= 1 &&
      (queue["count"] as number) <= 5
  );
  const completedResearch = value["completedResearch"] ?? [];
  if (!Array.isArray(completedResearch) || completedResearch.length > 32) return false;
  const researched = new Set<string>();
  const validCompletedResearch = completedResearch.every((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ["playerNumber", "researchType"])) return false;
    const playerNumber = entry["playerNumber"];
    const type = entry["researchType"];
    if (!Number.isSafeInteger(playerNumber) || !owners.has(playerNumber as number) ||
        typeof type !== "string" || !researchTypes.has(type)) return false;
    const identity = `${playerNumber}:${type}`;
    if (researched.has(identity)) return false;
    researched.add(identity);
    return true;
  });
  const researchQueues = value["researchQueues"] ?? [];
  if (!Array.isArray(researchQueues) || researchQueues.length > 16) return false;
  const validResearchQueues = researchQueues.every((queue) => {
    if (!isRecord(queue) || !hasOnlyKeys(queue, ["producerFixtureActorId", "researchType"])) return false;
    const producerId = queue["producerFixtureActorId"];
    const type = queue["researchType"];
    if (
      typeof producerId !== "string" ||
      !fixtureActorIds.has(producerId) ||
      unfinishedRoles.has(producerId) ||
      actorOwners.get(producerId) === null ||
      typeof type !== "string" ||
      !researchTypes.has(type)
    )
      return false;
    const identity = `${actorOwners.get(producerId)}:${type}`;
    if (researched.has(identity)) return false;
    researched.add(identity);
    return true;
  });
  const initialOrders = value["initialOrders"] ?? [];
  if (!Array.isArray(initialOrders) || initialOrders.length > 32) return false;
  const constructionBuilders = new Set<string>();
  if (Array.isArray(value["constructionOrders"])) {
    for (const order of value["constructionOrders"]) {
      if (!isRecord(order) || !Array.isArray(order["builderFixtureActorIds"])) return false;
      for (const id of order["builderFixtureActorIds"]) if (typeof id === "string") constructionBuilders.add(id);
    }
  }
  const orderedWorkers = new Set<string>();
  const validOrders = initialOrders.every((order) => {
    if (!isRecord(order) || !hasOnlyKeys(order, ["workerFixtureActorId", "sourceFixtureActorId", "kind"])) return false;
    const workerId = order["workerFixtureActorId"];
    const sourceId = order["sourceFixtureActorId"];
    if (typeof workerId !== "string" || typeof sourceId !== "string" || order["kind"] !== "gather") return false;
    if (orderedWorkers.has(workerId) || constructionBuilders.has(workerId)) return false;
    orderedWorkers.add(workerId);
    return (
      actorOwners.has(workerId) &&
      actorOwners.get(workerId) !== null &&
      actorOwners.has(sourceId) &&
      (actorOwners.get(sourceId) === null || actorOwners.get(sourceId) === actorOwners.get(workerId))
    );
  });
  const events = value["events"] ?? [];
  if (!Array.isArray(events) || !validAiRuntimePresetEvents(events, actorOwners, authoredNames)) return false;
  if (!validAiRuntimePresetControls(value["controls"], actorOwners)) return false;
  if (!validAiRuntimePresetRallies(value["productionRallies"], actorOwners)) return false;
  const workCount =
    value["actors"].length +
    value["resourceGrants"].length +
    resourceStarts.length +
    queues.length +
    researchQueues.length +
    completedResearch.length +
    initialOrders.length +
    (Array.isArray(value["constructionOrders"]) ? value["constructionOrders"].length : 0) +
    events.length;
  return validQueues && validCompletedResearch && validResearchQueues && validOrders && workCount > 0;
}

