import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog, AiCapabilityCatalogEntry } from "../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../contracts/observation/ai-observation";
import { eligibleAiOpeningPurposes } from "./ai-opening-eligibility";

function entry(
  sourceObjectName: ObjectNames,
  movementDomains: AiCapabilityCatalogEntry["movementDomains"],
  targetDomains: AiCapabilityCatalogEntry["targetDomains"],
  produces: readonly ObjectNames[] = [],
  cargoCapacity: number | null = null
): AiCapabilityCatalogEntry {
  return {
    capabilityId: `${sourceObjectName}:test`,
    family: "test",
    sourceObjectName,
    effectiveLevel: 0,
    movementDomains,
    targetDomains,
    produces,
    constructs: [],
    researches: [],
    gathers: [],
    housingCapacity: null,
    housingCost: null,
    cargoCapacity
  };
}

function observation(withCoast: boolean): AiObservation {
  return {
    schemaVersion: 1,
    generation: 1,
    tick: 0,
    playerNumber: 1,
    faction: FactionType.Tivara,
    actors: [],
    resources: [],
    accessProducts: [],
    effects: [],
    modeGoals: [],
    researchCandidates: [],
    threatSummary: {
      observedTick: 0,
      visibleEnemyActorIds: [],
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: []
    },
    ...(withCoast
      ? {
          map: {
            bounds: { status: "known", value: { width: 8, height: 8 }, observedTick: 0 },
            staticRevision: 1,
            frontierAccessNodeIds: [],
            scoutCoverageAccessNodeIds: [],
            dynamicObstacleActorIds: [],
            regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
            accessGraph: {
              schemaVersion: 1,
              generation: 1,
              status: "ready",
              staticRevision: 1,
              dynamicRevision: 1,
              threatRevision: 1,
              builtTick: 0,
              continuationCursor: 0,
              nodes: [
                {
                  nodeId: "water:1",
                  domain: "water",
                  elevation: 0,
                  knowledge: "known_static",
                  representativePosition: { x: 1, y: 1, z: 0 },
                  tileCount: 10,
                  clearance: 1
                }
              ],
              links: [],
              transferPoints: [
                {
                  transferId: "shore:1",
                  kind: "shore",
                  fromNodeId: "ground:1",
                  toNodeId: "water:1",
                  passengerPosition: { x: 0, y: 1, z: 0 },
                  carrierPosition: { x: 1, y: 1, z: 0 },
                  clearance: 1,
                  knowledge: "known_static"
                }
              ],
              unknownNodeIds: []
            }
          }
        }
      : {})
  } as AiObservation;
}

function catalog(entries: readonly AiCapabilityCatalogEntry[]): AiCapabilityCatalog {
  return { schemaVersion: 1, generation: 1, entries, unsupported: [] };
}

describe("eligibleAiOpeningPurposes", () => {
  it("omits air, naval and expeditionary plans without a faction production path", () => {
    const purposes = eligibleAiOpeningPurposes(observation(true), catalog([]));
    expect(purposes).toContain("turtle");
    expect(purposes).toContain("harassment");
    expect(purposes).not.toContain("turtle_air");
    expect(purposes).not.toContain("air_control");
    expect(purposes).not.toContain("naval");
    expect(purposes).not.toContain("expeditionary");
  });

  it("requires a ready coastal access route for naval openings", () => {
    const production = catalog([
      entry(ObjectNames.Sandhold, [], [], [ObjectNames.VikingBoat]),
      entry(ObjectNames.VikingBoat, ["water"], ["ground", "water"])
    ]);
    expect(eligibleAiOpeningPurposes(observation(false), production)).not.toContain("naval");
    expect(eligibleAiOpeningPurposes(observation(true), production)).toContain("naval");
  });

  it("admits air and expeditionary openings only when those roles are producible", () => {
    const production = catalog([
      entry(ObjectNames.Owlery, [], [], [ObjectNames.Banshee]),
      entry(ObjectNames.Banshee, ["air"], ["ground"]),
      entry(ObjectNames.Sandhold, [], [], [ObjectNames.TivaraMacemanMale]),
      entry(ObjectNames.TivaraMacemanMale, ["ground"], ["air"]),
      entry(ObjectNames.Sandhold, [], [], [ObjectNames.VikingBoat]),
      entry(ObjectNames.VikingBoat, ["water"], ["ground"], [], 2)
    ]);
    const purposes = eligibleAiOpeningPurposes(observation(false), production);
    expect(purposes).toContain("turtle_air");
    expect(purposes).toContain("air_control");
    expect(purposes).not.toContain("expeditionary");
    expect(eligibleAiOpeningPurposes(observation(true), production)).toContain("expeditionary");
  });
});
