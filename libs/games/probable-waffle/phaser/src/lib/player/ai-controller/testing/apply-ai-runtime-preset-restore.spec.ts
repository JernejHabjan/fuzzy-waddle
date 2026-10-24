import { applyAiRuntimePresetWorldV1 } from "./apply-ai-runtime-preset-world-v1";
import { installAiRuntimeProductionCapture } from "./install-ai-runtime-production-capture";
import { readAiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import type { SceneActorCreator } from "../../../world/services/scene-actor-creator";

jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));
jest.mock("./install-ai-runtime-production-capture", () => ({ installAiRuntimeProductionCapture: jest.fn() }));
jest.mock("./ai-runtime-browser-test-config", () => ({
  readAiRuntimeBrowserTestConfigV1: jest.fn(() => { throw new Error("saved world must not reread preset setup"); }),
  recordAiRuntimePresetApplicationV1: jest.fn()
}));

it("observes the restored world without reseeding actors, balances, queues, faults or scripted events", () => {
  const scene = { baseGameData: { gameInstance: { gameInstanceMetadata: { data: {
    startOptions: { loadFromSave: true }
  } } } } } as unknown as GameProbableWaffleScene;
  applyAiRuntimePresetWorldV1(scene, {} as SceneActorCreator);
  expect(installAiRuntimeProductionCapture).toHaveBeenCalledWith(scene);
  expect(readAiRuntimeBrowserTestConfigV1).not.toHaveBeenCalled();
});
