import { CampaignFaction, type ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import { validateMissionScenarioReferences, type ScenarioMapManifest } from "./validate-mission-scenario-references";

describe("validateMissionScenarioReferences", () => {
  const map: ScenarioMapManifest = {
    mapId: 3 as ProbableWaffleMapEnum,
    sceneKey: "MapEmberEnclave",
    actors: ["hero"],
    points: ["arrival"],
    regions: ["village"],
    routes: ["escape-route"],
    groups: ["villagers"],
    cameraShots: ["opening-shot"],
    spawnSets: ["raiders"]
  };

  it("resolves every stable mission reference kind", () => {
    expect(validateMissionScenarioReferences(mission(), map, "missions/dreams/mission.json")).toEqual({
      valid: true,
      issues: []
    });
  });

  it("reports an actionable source path, JSON path, map scene, kind, and ID when a reference is deleted", () => {
    const result = validateMissionScenarioReferences(
      mission(),
      { ...map, regions: [] },
      "missions/dreams/mission.json"
    );

    expect(result.issues).toContainEqual({
      sourcePath: "missions/dreams/mission.json",
      jsonPath: "$.scenarioReferences.regions[0]",
      code: "missing-scenario-reference",
      message: "Map scene MapEmberEnclave is missing required regions scenario ID 'village'"
    });
  });

  it("rejects IDs that are ambiguous across namespaces", () => {
    const result = validateMissionScenarioReferences(
      mission(),
      { ...map, points: ["hero"] },
      "missions/dreams/mission.json"
    );

    expect(result.issues).toContainEqual({
      sourcePath: "MapEmberEnclave",
      jsonPath: "$.points[0]",
      code: "ambiguous-scenario-reference",
      message: "Scenario ID 'hero' is declared as both actors and points in MapEmberEnclave"
    });
  });

  it("rejects authored IDs that do not follow the stable naming contract", () => {
    const result = validateMissionScenarioReferences(
      mission(),
      { ...map, actors: ["Editor Hero"] },
      "missions/dreams/mission.json"
    );

    expect(result.issues).toContainEqual({
      sourcePath: "MapEmberEnclave",
      jsonPath: "$.actors[0]",
      code: "invalid-scenario-reference",
      message: "Scenario actors ID 'Editor Hero' in MapEmberEnclave must use lowercase kebab-case"
    });
  });
});

function mission(): CampaignMissionContent {
  return {
    schemaVersion: 1,
    id: "dreams",
    chapterId: "prologue",
    revision: 1,
    mapId: 3 as ProbableWaffleMapEnum,
    prerequisites: [],
    catalogue: {
      order: 1,
      title: "Dreams",
      faction: CampaignFaction.Tivara,
      environment: "Ember Enclave",
      briefing: "Test",
      objectiveSummaries: []
    },
    participants: [],
    progressionAllowance: { loadoutSlotCount: 0 },
    initialState: { activePhaseIds: [], facts: [], counters: [], timers: [] },
    phases: [],
    objectives: [],
    checkpoints: [],
    scenarioReferences: {
      actors: [asCampaignContentId("hero")],
      points: [asCampaignContentId("arrival")],
      regions: [asCampaignContentId("village")],
      routes: [asCampaignContentId("escape-route")],
      groups: [asCampaignContentId("villagers")],
      cameraShots: [asCampaignContentId("opening-shot")],
      spawnSets: [asCampaignContentId("raiders")]
    },
    difficulty: { story: {}, normal: {}, hard: {} },
    contentStatus: "playable"
  };
}
