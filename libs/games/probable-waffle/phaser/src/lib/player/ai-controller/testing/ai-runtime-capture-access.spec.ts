import { AiRuntimeScenarioBridgeV1, type AiRuntimeReproProvenanceV1 } from "./ai-runtime-scenario-bridge";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

it("denies confidential native capture before a non-host can advance or inspect the world", async () => {
  const inspect = jest.fn(() => { throw new Error("unauthorized world inspected"); });
  const scene = { isHost: false, getSceneGameData: inspect } as unknown as ProbableWaffleScene;
  const bridge = new AiRuntimeScenarioBridgeV1(scene, { developerTestMode: true });
  try {
    await expect(bridge.captureRuntimeArtifact(3, 0, {} as AiRuntimeReproProvenanceV1))
      .rejects.toThrow("runtime_capture_access_denied");
    expect(inspect).not.toHaveBeenCalled();
  } finally { bridge.dispose(); }
});
