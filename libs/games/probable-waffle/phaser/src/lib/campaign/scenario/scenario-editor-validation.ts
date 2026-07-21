import type { ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ScenarioMapManifest } from "@fuzzy-waddle/probable-waffle-campaign";

export const SCENARIO_PREFAB_IDS = {
  points: "d1000000-0000-4000-8000-000000000001",
  regions: "d1000000-0000-4000-8000-000000000002",
  routes: "d1000000-0000-4000-8000-000000000003",
  groups: "d1000000-0000-4000-8000-000000000004",
  cameraShots: "d1000000-0000-4000-8000-000000000005",
  spawnSets: "d1000000-0000-4000-8000-000000000006"
} as const;

type MarkerManifestKind = keyof typeof SCENARIO_PREFAB_IDS;

interface EditorSceneNode {
  readonly prefabId?: unknown;
  readonly label?: unknown;
  readonly components?: unknown;
  readonly list?: unknown;
  readonly scenarioId?: unknown;
  readonly [key: string]: unknown;
}

interface EditorSceneDocument {
  readonly settings?: { readonly sceneKey?: unknown };
  readonly displayList?: unknown;
  readonly prefabProperties?: unknown;
}

export interface ScenarioEditorPairIssue {
  readonly code: "missing-prefab-property" | "missing-generated-field" | "root-type-mismatch" | "missing-component";
  readonly message: string;
}

/** Extracts only explicit stable IDs; Phaser labels and internal UUIDs are deliberately ignored. */
export function extractScenarioMapManifest(
  document: EditorSceneDocument,
  mapId: ProbableWaffleMapEnum
): ScenarioMapManifest {
  const sceneKey = typeof document.settings?.sceneKey === "string" ? document.settings.sceneKey : "unknown-scene";
  const manifest: Record<MarkerManifestKind, string[]> = {
    points: [],
    regions: [],
    routes: [],
    groups: [],
    cameraShots: [],
    spawnSets: []
  };
  const actors: string[] = [];
  for (const node of flattenNodes(document.displayList)) {
    const components = Array.isArray(node.components) ? node.components : [];
    if (components.includes("EditorScenarioReference")) {
      const actorId = node["EditorScenarioReference.scenarioId"];
      if (typeof actorId === "string" && actorId.trim()) actors.push(actorId.trim());
    }
    for (const [kind, prefabId] of Object.entries(SCENARIO_PREFAB_IDS) as [MarkerManifestKind, string][]) {
      if (node.prefabId !== prefabId) continue;
      if (typeof node.scenarioId === "string" && node.scenarioId.trim()) manifest[kind].push(node.scenarioId.trim());
    }
  }
  return {
    mapId,
    sceneKey,
    actors: actors.sort(),
    points: manifest.points.sort(),
    regions: manifest.regions.sort(),
    routes: manifest.routes.sort(),
    groups: manifest.groups.sort(),
    cameraShots: manifest.cameraShots.sort(),
    spawnSets: manifest.spawnSets.sort()
  };
}

/** Verifies that generated TypeScript still exposes every property authored in its paired prefab scene. */
export function validateScenarioPrefabPair(
  sceneDocument: EditorSceneDocument,
  generatedSource: string,
  expectedRootType: "Rectangle"
): ScenarioEditorPairIssue[] {
  const issues: ScenarioEditorPairIssue[] = [];
  const properties = Array.isArray(sceneDocument.prefabProperties) ? sceneDocument.prefabProperties : [];
  for (const property of properties) {
    if (!isRecord(property) || typeof property["name"] !== "string") {
      issues.push({ code: "missing-prefab-property", message: "Prefab contains an invalid property definition" });
      continue;
    }
    const name = property["name"];
    const fieldPattern = new RegExp(`(?:public|readonly)\\s+(?:override\\s+)?${escapeRegExp(name)}(?:\\s*[:=])`);
    if (!fieldPattern.test(generatedSource)) {
      issues.push({
        code: "missing-generated-field",
        message: `Generated TypeScript is missing prefab field '${name}'`
      });
    }
  }
  if (!generatedSource.includes(`extends Phaser.GameObjects.${expectedRootType}`)) {
    issues.push({ code: "root-type-mismatch", message: `Generated TypeScript must extend ${expectedRootType}` });
  }
  return issues;
}

export function validateScenarioEditorComponentPair(
  componentDocument: unknown,
  generatedSource: string
): ScenarioEditorPairIssue[] {
  if (!isRecord(componentDocument) || !Array.isArray(componentDocument["components"])) {
    return [{ code: "missing-component", message: "Editor component document is invalid" }];
  }
  const component = componentDocument["components"].find(
    (candidate) => isRecord(candidate) && candidate["name"] === "EditorScenarioReference"
  );
  if (!isRecord(component) || !Array.isArray(component["properties"])) {
    return [{ code: "missing-component", message: "EditorScenarioReference is not declared" }];
  }
  return component["properties"].flatMap((property): ScenarioEditorPairIssue[] => {
    if (!isRecord(property) || typeof property["name"] !== "string") {
      return [{ code: "missing-prefab-property", message: "Editor component property is invalid" }];
    }
    const name = property["name"];
    return new RegExp(`public\\s+${escapeRegExp(name)}(?:\\s*[:=])`).test(generatedSource)
      ? []
      : [{ code: "missing-generated-field", message: `Generated editor component is missing '${name}'` }];
  });
}

function flattenNodes(value: unknown): EditorSceneNode[] {
  if (!Array.isArray(value)) return [];
  const result: EditorSceneNode[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const node = candidate as EditorSceneNode;
    result.push(node);
    result.push(...flattenNodes(node.list));
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
