import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { actor, built, catalog, fromNodeId, observation, toNodeId } from "./ai-transport-manager-test-fixture";
import { proposeAiIslandEstablishment } from "./ai-island-establishment";
import { AiTransportManager } from "./ai-transport-manager";
import { assertAiBrainStateV1 } from "../contracts/validate-ai-contracts-v1";

function setup() {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainStateV1({ profile, playerNumber: 1, faction: FactionType.Tivara, tick: 0, archetypeId: "balanced" });
  const state = { ...initial, economyProduction: { ...initial.economyProduction,
    forecasts: [{ resourceType: ResourceType.Wood, amount: 200, horizonTick: 600, confidencePermille: 1000 }] } };
  const nativeCatalog: AiCapabilityCatalogV1 = { ...catalog, entries: [...catalog.entries,
    { ...catalog.entries[0]!, capabilityId: "worker", sourceObjectName: ObjectNames.TivaraWorker,
      movementDomains: ["ground"], cargoCapacity: null, constructs: [ObjectNames.WorkMill], gathers: [ResourceType.Wood] },
    { ...catalog.entries[0]!, capabilityId: "mill", sourceObjectName: ObjectNames.WorkMill, movementDomains: [],
      cargoCapacity: null, acceptsResources: [ResourceType.Wood], constructionProfile: { resourceCost: { wood: 50 },
        footprintRadiusTiles: 1, visionRange: 6, navigableHeight: null, enterHeight: null, exitHeight: null } }] };
  const workers = ["builder", "optional-a", "optional-b"].map((id) => ({ ...actor(id, ObjectNames.TivaraWorker, fromNodeId, 0),
    activeOrder: { status: "known" as const, value: null, observedTick: 20 } }));
  const protection: AiObservedActorV1 = { ...actor("guard", ObjectNames.TivaraMacemanMale, fromNodeId, 0),
    housingCost: { status: "known", value: 1, observedTick: 20 }, capabilities: [{ id: "melee", family: "combat", level: 1,
      domains: ["ground"], targetDomains: ["ground"], capacity: { status: "known", value: 0, observedTick: 20 } }] };
  const source: AiObservedActorV1 = { ...actor("island-source", ObjectNames.Tree1, toNodeId, 4), relation: "neutral",
    visibility: "visible", owner: null, resourceState: { status: "known", observedTick: 20,
      value: { resourceType: ResourceType.Wood, available: { status: "known", value: 2000, observedTick: 20 },
        carried: { status: "known", value: 0, observedTick: 20 }, growthReadyTick: { status: "unknown", reason: "not_supported" },
        serviceCapacity: { status: "known", value: 4, observedTick: 20 } } } };
  const boat: AiObservedActorV1 = { ...actor("boat", ObjectNames.CommonBoat, built.waterNodeByTileKey.get("1,0")!, 1),
    containerState: { status: "known", observedTick: 20, value: { capacity: 4, passengerIds: [], pendingPassengerIds: [],
      mobileDomains: ["water"] } } };
  return { state, nativeCatalog, workers, protection, source, boat };
}

it("H-23 creates a real island establishment request with indispensable builder/protection and optional workers", () => {
  const { state, nativeCatalog, workers, protection, source, boat } = setup();
  const input = observation([...workers, protection, source, boat], 20), before = JSON.stringify({ state, input });
  const result = proposeAiIslandEstablishment(input, state, nativeCatalog), plan = result?.statePatch?.transportAppend?.[0];
  expect(plan?.lifecycle?.missionKind).toBe("island_establishment");
  expect(plan?.lifecycle?.route.kind).toBe("water_transport");
  expect(plan?.lifecycle?.manifest.filter((entry) => entry.indispensable).map((entry) => entry.role).sort())
    .toEqual(["builder", "protection"]);
  expect(plan?.lifecycle?.manifest.filter((entry) => !entry.indispensable)).toHaveLength(2);
  expect(result?.intents).toEqual([]);
  expect(() => assertAiBrainStateV1({ ...state, transport: plan ? [plan] : [] })).not.toThrow();
  if (!plan?.lifecycle?.establishment) throw new Error("required_establishment_purpose_missing");
  const invalid = { ...plan, lifecycle: { ...plan.lifecycle, establishment: { ...plan.lifecycle.establishment,
    resourceCost: { wood: Number.NaN } } } };
  expect(() => assertAiBrainStateV1({ ...state, transport: [invalid] })).toThrow("invalid_ai_island_establishment_purpose");
  expect(new AiTransportManager(() => nativeCatalog).propose(input, state).statePatch?.transport)
    .toEqual(result?.statePatch?.transportAppend);
  expect(JSON.stringify({ state, input })).toBe(before);
  expect(proposeAiIslandEstablishment(input, { ...state, transport: plan ? [plan] : [] }, nativeCatalog)).toBeUndefined();
});

it("does not invent offshore knowledge, take healthy busy builders or leave useful mainland income", () => {
  const { state, nativeCatalog, workers, protection, source, boat } = setup();
  for (const actors of [
    [...workers, protection, boat], [protection, source, boat],
    [...workers, protection, source, boat, { ...source, actorId: "mainland-tree", accessNodeId: workers[0]!.accessNodeId }]
  ]) expect(proposeAiIslandEstablishment(observation(actors, 20), state, nativeCatalog)).toBeUndefined();
  expect(proposeAiIslandEstablishment(observation([...workers, protection, source], 20), state, nativeCatalog)).toBeUndefined();
});
