import { applyAiRuntimePresetWorld } from "./apply-ai-runtime-preset-world";
import { installAiRuntimeProductionCapture } from "../../production/capture/install-ai-runtime-production-capture";
import { applyAiRuntimeTerrainPatches } from "../../navigation/controls/ai-runtime-terrain-patches";
import { readAiRuntimeBrowserTestConfig } from "../../browser/ai-runtime-browser-test-config";
import { NavigationService } from "../../../../../world/services/navigation.service";
import type GameProbableWaffleScene from "../../../../../world/scenes/GameProbableWaffleScene";
import type { SceneActorCreator } from "../../../../../world/services/scene-actor-creator";

jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));
jest.mock("../../production/capture/install-ai-runtime-production-capture", () => ({ installAiRuntimeProductionCapture: jest.fn() }));
jest.mock("../../browser/ai-runtime-browser-test-config", () => ({
  readAiRuntimeBrowserTestConfig: jest.fn(() => ({
    presetWorld: { terrainPatches: [{ x: 24, y: 19, terrain: "grass", blocked: true }] }
  })),
  recordAiRuntimePresetApplication: jest.fn()
}));
jest.mock("../../navigation/controls/ai-runtime-terrain-patches", () => ({ applyAiRuntimeTerrainPatches: jest.fn() }));

it("restores only authored map terrain without replaying fixture actors, resources, queues, faults or events", () => {
  const scene = {
    tilemap: { id: "native-tilemap" },
    events: { emit: jest.fn() },
    baseGameData: { gameInstance: { gameInstanceMetadata: { data: { startOptions: { loadFromSave: true } } } } }
  } as unknown as GameProbableWaffleScene;
  const creator = { createFinishedActor: jest.fn() } as unknown as SceneActorCreator;
  applyAiRuntimePresetWorld(scene, creator);
  expect(installAiRuntimeProductionCapture).toHaveBeenCalledWith(scene);
  expect(readAiRuntimeBrowserTestConfig).toHaveBeenCalledTimes(1);
  expect(applyAiRuntimeTerrainPatches).toHaveBeenCalledWith(scene.tilemap, {
    terrainPatches: [{ x: 24, y: 19, terrain: "grass", blocked: true }]
  });
  expect(scene.events.emit).toHaveBeenCalledWith(NavigationService.UpdateNavigationEvent);
  expect(creator.createFinishedActor).not.toHaveBeenCalled();
});
