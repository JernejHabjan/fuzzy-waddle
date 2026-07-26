import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AOTA_CAMPAIGN_MISSIONS, validateMissionScenarioReferences } from "@fuzzy-waddle/probable-waffle-campaign";
import { ProbableWaffleLevels, ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  extractScenarioMapManifest,
  SCENARIO_PREFAB_IDS,
  validateScenarioEditorComponentPair,
  validateScenarioPrefabPair
} from "./scenario-editor-validation";

describe("scenario Phaser Editor contracts", () => {
  it.each([
    ["Point", "points"],
    ["Region", "regions"],
    ["Route", "routes"],
    ["Group", "groups"],
    ["CameraShot", "cameraShots"],
    ["SpawnSet", "spawnSets"]
  ] as const)("keeps Scenario%s prefab JSON paired with generated TypeScript", (name, kind) => {
    const directory = join(__dirname, "../../prefabs/scenario");
    const document = readJson(join(directory, `Scenario${name}.scene`));
    const generatedSource = readFileSync(join(directory, `Scenario${name}.ts`), "utf8");

    expect(document["id"]).toBe(SCENARIO_PREFAB_IDS[kind]);
    expect(validateScenarioPrefabPair(document, generatedSource, "Rectangle")).toEqual([]);
  });

  it("keeps the actor user component paired with generated TypeScript", () => {
    const directory = join(__dirname, "../../world/scenes/editor-components");
    const document = readJson(join(directory, "EditorBehaviors.components"));
    const generatedSource = readFileSync(join(directory, "EditorScenarioReference.ts"), "utf8");

    expect(validateScenarioEditorComponentPair(document, generatedSource)).toEqual([]);
  });

  it("reports a generated prefab field mismatch", () => {
    expect(
      validateScenarioPrefabPair(
        { prefabProperties: [{ name: "scenarioId" }] },
        "export class Broken extends Phaser.GameObjects.Rectangle {}",
        "Rectangle"
      )
    ).toEqual([
      {
        code: "missing-generated-field",
        message: "Generated TypeScript is missing prefab field 'scenarioId'"
      }
    ]);
  });
});

describe("scenario map manifests", () => {
  it.each([
    ["MapRiverCrossing", ProbableWaffleMapEnum.RiverCrossing],
    ["MapEmberEnclave", ProbableWaffleMapEnum.EmberEnclave]
  ] as const)("loads the existing %s scene and validates its campaign mission references", (sceneName, mapId) => {
    const document = readJson(join(__dirname, `../../world/scenes/game-maps/${sceneName}.scene`));
    const manifest = extractScenarioMapManifest(document, mapId);
    const missions = AOTA_CAMPAIGN_MISSIONS.filter(
      (mission) => ProbableWaffleLevels[mapId].loader.mapSceneKey === mission.mapKey
    );

    expect(manifest.sceneKey).toBe(sceneName);
    expect(missions.length).toBeGreaterThan(0);
    for (const mission of missions) {
      expect(validateMissionScenarioReferences(mission, manifest, `${mission.id}/mission.json`)).toEqual({
        valid: true,
        issues: []
      });
    }
  });

  it.each(AOTA_CAMPAIGN_MISSIONS.filter((mission) => mission.scenarioReferences))(
    "validates declared scenario references for mission $id against its configured map source",
    (mission) => {
      const manifest = mapManifestFor(mission.mapKey);

      expect(
        validateMissionScenarioReferences(
          mission,
          manifest,
          `content/ashes-of-the-ancients/missions/${mission.id}/mission.json`
        )
      ).toEqual({ valid: true, issues: [] });
    }
  );

  // TODO(#703): Change this to `it` once every planned map marker is authored. It intentionally fails today.
  it.failing("validates every mission's planned scenario references against its configured map source", () => {
    for (const mission of AOTA_CAMPAIGN_MISSIONS) {
      const manifest = mapManifestFor(mission.mapKey);
      const missionWithPlannedReferences = {
        ...mission,
        scenarioReferences: mission.implementation.plannedScenarioReferences
      };

      expect(
        validateMissionScenarioReferences(
          missionWithPlannedReferences,
          manifest,
          `content/ashes-of-the-ancients/missions/${mission.id}/mission.json`
        )
      ).toEqual({ valid: true, issues: [] });
    }
  });

  it("extracts every stable reference kind while ignoring labels and editor UUIDs", () => {
    const actor = {
      id: "uuid-ignored",
      label: "rename-me-freely",
      components: ["EditorScenarioReference"],
      "EditorScenarioReference.scenarioId": "campaign-hero"
    };
    const document = {
      settings: { sceneKey: "SyntheticScenario" },
      displayList: [
        actor,
        { prefabId: SCENARIO_PREFAB_IDS.points, scenarioId: "landing" },
        { prefabId: SCENARIO_PREFAB_IDS.regions, scenarioId: "courtyard" },
        { prefabId: SCENARIO_PREFAB_IDS.routes, scenarioId: "escape-route" },
        { prefabId: SCENARIO_PREFAB_IDS.groups, scenarioId: "guards" },
        { prefabId: SCENARIO_PREFAB_IDS.cameraShots, scenarioId: "intro-shot" },
        { list: [{ prefabId: SCENARIO_PREFAB_IDS.spawnSets, scenarioId: "reinforcements" }] }
      ]
    };

    const beforeRename = extractScenarioMapManifest(document, ProbableWaffleMapEnum.RiverCrossing);
    actor.label = "a-different-editor-label";
    actor.id = "a-different-editor-uuid";

    expect(extractScenarioMapManifest(document, ProbableWaffleMapEnum.RiverCrossing)).toEqual(beforeRename);
    expect(beforeRename).toMatchObject({
      actors: ["campaign-hero"],
      points: ["landing"],
      regions: ["courtyard"],
      routes: ["escape-route"],
      groups: ["guards"],
      cameraShots: ["intro-shot"],
      spawnSets: ["reinforcements"]
    });
  });
});

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function mapManifestFor(mapKey: string) {
  const map = Object.values(ProbableWaffleLevels).find((candidate) => candidate.loader.mapSceneKey === mapKey);
  if (!map) throw new Error(`Unknown map key '${mapKey}'`);
  const sceneKey = map.loader.mapSceneKey;
  const document = readJson(join(__dirname, `../../world/scenes/game-maps/${sceneKey}.scene`));
  return extractScenarioMapManifest(document, map.id);
}
