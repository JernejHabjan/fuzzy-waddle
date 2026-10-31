import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";

export interface NativeSaveNavigationSummary {
  readonly randomOperationCount: number;
  readonly randomDigest: string;
  readonly terrainDigest: string;
  readonly objectGridDigest: string;
  readonly navigationGridDigest: string;
  readonly navigationEdgeCount: number;
}

export interface NativeSaveColliderFootprint {
  readonly id: string | null;
  readonly name: string;
  readonly tiles: readonly { readonly x: number; readonly y: number }[];
}

export interface NativeSaveRandomCall {
  readonly method: string;
  readonly stack: readonly string[];
}

export interface NativeSaveNavigationDiagnostics extends NativeSaveNavigationSummary {
  readonly terrainGrid: readonly (readonly number[])[];
  readonly objectGrid: readonly (readonly (number | null)[])[];
  readonly navigationGrid: readonly (readonly number[])[];
  readonly colliderFootprints: readonly NativeSaveColliderFootprint[];
}

/** Captures the exact terrain and object-grid inputs used by native navigation setup. */
export async function captureNativeSaveNavigationDiagnostics(page: Page): Promise<NativeSaveNavigationDiagnostics> {
  return page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 })
      .__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      | {
          getSceneGameData(): { services: readonly Record<string, unknown>[] };
          children: { list: Array<{ name: string; getData(key: string): unknown }> };
        }
      | undefined;
    if (!scene) throw new Error("native_save_navigation_scene_missing");
    const services = scene.getSceneGameData().services;
    const navigation = services.find((service) => typeof service.getHeightGraphDebugSnapshot === "function") as
      | {
          tilemapGrid: number[][];
          easyStarNavigationGrid: number[][];
          objectGrid: {
            build(grid: number[][]): (number | undefined)[][];
            getTileIndexesUnderColliders(include: (actor: unknown) => boolean): { x: number; y: number }[];
          };
          getHeightGraphDebugSnapshot(): { edgesByTileKey: Map<string, unknown[]> } | undefined;
        }
      | undefined;
    const random = services.find((service) => service.constructor?.name === "RandomService") as
      | { getState(): { schemaVersion: number; generatorState: string; operationCount: number } }
      | undefined;
    if (!navigation || !random) throw new Error("native_save_navigation_services_missing");
    const terrainGrid = navigation.tilemapGrid.map((row) => [...row]);
    const objectGrid = navigation.objectGrid
      .build(navigation.tilemapGrid)
      .map((row) => row.map((value) => value ?? null));
    const navigationGrid = navigation.easyStarNavigationGrid.map((row) => [...row]);
    const colliderFootprints = scene.children.list.flatMap((actor) => {
      const actorData = actor.getData("actorData") as { components?: Map<{ name: string }, unknown> } | undefined;
      const components = actorData?.components;
      if (![...(components?.keys() ?? [])].some((type) => type.name.endsWith("ColliderComponent"))) return [];
      const idComponent = [...(components?.entries() ?? [])].find(([type]) => type.name === "IdComponent")?.[1] as
        | { id?: string }
        | undefined;
      return [
        {
          id: idComponent?.id ?? null,
          name: actor.name,
          tiles: navigation.objectGrid.getTileIndexesUnderColliders((candidate) => candidate === actor)
        }
      ];
    });
    const state = random.getState();
    const digest = (value: unknown) => {
      const text = JSON.stringify(value);
      let hash = 0x811c9dc5;
      for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
      return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
    };
    return {
      randomOperationCount: state.operationCount,
      randomDigest: digest([state.schemaVersion, state.generatorState, state.operationCount]),
      terrainDigest: digest(terrainGrid),
      objectGridDigest: digest(objectGrid),
      navigationGridDigest: digest(navigationGrid),
      navigationEdgeCount: [...(navigation.getHeightGraphDebugSnapshot()?.edgesByTileKey.values() ?? [])].reduce(
        (count, edges) => count + edges.length,
        0
      ),
      terrainGrid,
      objectGrid,
      navigationGrid,
      colliderFootprints
    };
  });
}

/** Records deterministic RNG call sites only across the actual native scene reload. */
export async function armNativeSaveRandomTrace(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 })
      .__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      | { getSceneGameData(): { services: readonly Record<string, unknown>[] } }
      | undefined;
    const random = scene?.getSceneGameData().services.find((service) => service.constructor?.name === "RandomService");
    if (!random) throw new Error("native_save_random_trace_service_missing");
    const realm = window as unknown as {
      __nativeSaveRandomTrace?: {
        armed: boolean;
        calls: NativeSaveRandomCall[];
        prototype: Record<string, (...args: unknown[]) => unknown>;
        originals: Record<string, (...args: unknown[]) => unknown>;
      };
    };
    const prototype = Object.getPrototypeOf(random) as Record<string, (...args: unknown[]) => unknown>;
    const originals: Record<string, (...args: unknown[]) => unknown> = {};
    const trace = { armed: true, calls: [] as NativeSaveRandomCall[], prototype, originals };
    for (const method of ["random", "frac", "between", "pick", "shuffle"]) {
      const original = prototype[method];
      if (!original) continue;
      originals[method] = original;
      prototype[method] = function (this: unknown, ...args: unknown[]) {
        if (trace.armed) {
          trace.calls.push({ method, stack: (new Error().stack ?? "").split("\n").slice(2, 8) });
        }
        return original.apply(this, args);
      };
    }
    realm.__nativeSaveRandomTrace = trace;
  });
}

export async function closeNativeSaveRandomTrace(page: Page): Promise<readonly NativeSaveRandomCall[]> {
  return page.evaluate(() => {
    const realm = window as unknown as {
      __nativeSaveRandomTrace?: {
        armed: boolean;
        calls: NativeSaveRandomCall[];
        prototype: Record<string, (...args: unknown[]) => unknown>;
        originals: Record<string, (...args: unknown[]) => unknown>;
      };
    };
    const trace = realm.__nativeSaveRandomTrace;
    if (!trace) throw new Error("native_save_random_trace_missing");
    trace.armed = false;
    Object.assign(trace.prototype, trace.originals);
    delete realm.__nativeSaveRandomTrace;
    return trace.calls;
  });
}
