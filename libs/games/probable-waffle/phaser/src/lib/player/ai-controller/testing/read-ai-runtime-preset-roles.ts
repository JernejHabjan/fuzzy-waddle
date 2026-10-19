import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { validAiRuntimeExistingBindings } from "./validate-ai-runtime-existing-bindings";
import { validAiRuntimeConstructionOrders } from "./validate-ai-runtime-construction-orders";
import { validAiRuntimeSourceStocks } from "./ai-runtime-source-stocks";
import { validAiRuntimeHealthStarts } from "./ai-runtime-health-starts";
import { validAiRuntimeTerrainPatches } from "./ai-runtime-terrain-patches";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";

const actorNames = new Set<string>(Object.values(ObjectNames));

/** Validated preset identity/owner tables; later native controls never infer a missing role. */
export function readAiRuntimePresetRoles(value: unknown) {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "fixtureId",
      "requireFactionRoster",
      "terrainPatches",
      "terrainPreserveFootprints",
      "provenance",
      "actors",
      "existingActorBindings",
      "resourceGrants",
      "sourceStocks",
      "healthStarts",
      "constructionOrders",
      "protectedRoutes",
      "resourceStarts",
      "queues",
      "researchQueues",
      "initialOrders",
      "controls",
      "productionRallies",
      "events"
    ])
  ) {
    return null;
  }
  if (typeof value["fixtureId"] !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(value["fixtureId"])) return null;
  if (value["requireFactionRoster"] !== undefined && value["requireFactionRoster"] !== true) return null;
  if (!validAiRuntimeTerrainPatches(value["terrainPatches"])) return null;
  if (value["terrainPreserveFootprints"] !== undefined &&
      (value["terrainPreserveFootprints"] !== true || !Array.isArray(value["terrainPatches"]))) return null;
  const provenance = value["provenance"];
  if (
    !isRecord(provenance) ||
    !hasOnlyKeys(provenance, ["sourceRevision", "fixtureDigest"]) ||
    typeof provenance["sourceRevision"] !== "string" ||
    !/^[a-f0-9]{40}$/.test(provenance["sourceRevision"]) ||
    typeof provenance["fixtureDigest"] !== "string" ||
    !/^fnv1a32:[a-f0-9]{8}$/.test(provenance["fixtureDigest"])
  ) {
    return null;
  }
  if (!Array.isArray(value["actors"]) || value["actors"].length > 100) return null;
  const fixtureActorIds = new Set<string>();
  const actorOwners = new Map<string, number | null>();
  const authoredNames = new Map<string, string>();
  for (const actor of value["actors"]) {
    if (!isRecord(actor) || !hasOnlyKeys(actor, ["fixtureActorId", "actorName", "owner", "position"])) return null;
    const fixtureActorId = actor["fixtureActorId"];
    if (typeof fixtureActorId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureActorId)) return null;
    if (fixtureActorIds.has(fixtureActorId)) return null;
    fixtureActorIds.add(fixtureActorId);
    if (typeof actor["actorName"] !== "string" || !actorNames.has(actor["actorName"])) return null;
    if (actor["owner"] !== null && (!Number.isSafeInteger(actor["owner"]) || (actor["owner"] as number) < 1)) {
      return null;
    }
    actorOwners.set(fixtureActorId, actor["owner"] as number | null);
    authoredNames.set(fixtureActorId, actor["actorName"]);
    const position = actor["position"];
    if (!isRecord(position) || !hasOnlyKeys(position, ["x", "y", "z"])) return null;
    if (![position["x"], position["y"], position["z"]].every((coordinate) => Number.isFinite(coordinate))) return null;
  }
  if (!validAiRuntimeExistingBindings(value["existingActorBindings"], fixtureActorIds, actorOwners, authoredNames))
    return null;
  if (!validAiRuntimeSourceStocks(value["sourceStocks"], fixtureActorIds)) return null;
  if (!validAiRuntimeHealthStarts(value["healthStarts"], fixtureActorIds)) return null;
  if (!validAiRuntimeConstructionOrders(value["constructionOrders"], fixtureActorIds, actorOwners, authoredNames)) return null;
  return { fixtureActorIds, actorOwners, authoredNames };
}
