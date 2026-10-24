import type Phaser from "phaser";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AiRuntimeScenarioBridgeV1, type AiRuntimeReproProvenanceV1 } from "./ai-runtime-scenario-bridge";

/** Explicit developer callers share the same actual scene-host gate; peer requests fail before world inspection. */
export async function captureAiRuntimeArtifact(
  game: Phaser.Game, playerNumber: number, tick: number, provenance: AiRuntimeReproProvenanceV1
) {
  const scene = game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
    ProbableWaffleScene | undefined;
  if (!scene) throw new Error("native_runtime_capture_scene_missing");
  const bridge = new AiRuntimeScenarioBridgeV1(scene, { developerTestMode: true });
  try { return await bridge.captureRuntimeArtifact(playerNumber, tick, provenance); }
  finally { bridge.dispose(); }
}
