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

/**
 * Defines the marker manifest kind alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
type MarkerManifestKind = keyof typeof SCENARIO_PREFAB_IDS;

/**
 * Defines the structured editor scene node contract for this module. Its declared surface makes prefab id,
 * label, components, list, scenario id explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
interface EditorSceneNode {
  /**
   * Optional stable prefab id used by {@link EditorSceneNode} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly prefabId?: unknown;
  /**
   * Optional human-facing label for {@link EditorSceneNode}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  readonly label?: unknown;
  /**
   * Optional components value carried by {@link EditorSceneNode}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly components?: unknown;
  /**
   * Optional list value carried by {@link EditorSceneNode}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly list?: unknown;
  /**
   * Optional stable scenario id used by {@link EditorSceneNode} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly scenarioId?: unknown;
  readonly [key: string]: unknown;
}

/**
 * Defines the structured editor scene document contract for this module. Its declared surface makes settings,
 * display list, prefab properties explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
interface EditorSceneDocument {
  /**
   * Optional keyed/nested settings structure owned by {@link EditorSceneDocument}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  readonly settings?: {
    /**
     * Optional stable scene key used by {@link EditorSceneDocument} to correlate this document with the paired
     * runtime scene; it is not a display label and may be absent in older editor exports.
     */
    readonly sceneKey?: unknown;
  };
  /**
   * Optional collection owned by {@link EditorSceneDocument}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly displayList?: unknown;
  /**
   * Optional prefab properties value carried by {@link EditorSceneDocument}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly prefabProperties?: unknown;
}

/**
 * Defines the structured scenario editor pair issue contract for this module. Its declared surface makes code,
 * message explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ScenarioEditorPairIssue {
  /**
   * code value carried by {@link ScenarioEditorPairIssue}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly code: "missing-prefab-property" | "missing-generated-field" | "root-type-mismatch" | "missing-component";
  /**
   * string message carried by {@link ScenarioEditorPairIssue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly message: string;
}

/** Documents the extract scenario map manifest member and its declared contract at this boundary. */
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

/** Documents the validate scenario prefab pair member and its declared contract at this boundary. */
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
