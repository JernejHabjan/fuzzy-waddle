import {
  ProbableWaffleAiDifficulty, ProbableWaffleGameInstanceType, ProbableWafflePlayerType,
  type ProbableWaffleGameInstance
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
import type { AiRuntimeBrowserTestHostV1 } from "./ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

/** Before native bootstrap, both original legal slots become AI-owned; no actor, price or starting bank is rewritten. */
export function prepareAiRuntimeCalibrationPlayers(instance: ProbableWaffleGameInstance, config: AiRuntimeBrowserTestConfigV1) {
  const calibration = config.calibration;
  if (!calibration) return;
  const metadata = instance.gameInstanceMetadata.data;
  if (metadata.type !== ProbableWaffleGameInstanceType.Skirmish || metadata.startOptions.loadFromSave ||
      instance.players.length !== 2 || !instance.getPlayerByNumber(1) || !instance.getPlayerByNumber(2) || config.presetWorld)
    throw new Error("calibration_requires_fresh_ordinary_two_player_skirmish");
  const definitions = instance.players.map((player) => {
    const definition = player.playerController.data.playerDefinition;
    if (!definition || definition.factionType === undefined) throw new Error("calibration_native_faction_missing");
    return { player, definition };
  });
  for (const { player, definition } of definitions) {
    definition.playerType = ProbableWafflePlayerType.AI;
    definition.difficulty = player.playerNumber === calibration.targetPlayerNumber ?
      { Easy: ProbableWaffleAiDifficulty.Easy, Normal: ProbableWaffleAiDifficulty.Medium, Hard: ProbableWaffleAiDifficulty.Hard }
        [calibration.difficulty] : ProbableWaffleAiDifficulty.Medium;
  }
}

/** The fixed opponent uses an existing supported opening through normal brain initialization, never a saved-state edit. */
export function readAiRuntimeCalibrationOpening(scene: ProbableWaffleScene, playerNumber: number, faction: number) {
  if (typeof window === "undefined") return undefined;
  const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 })
    .__fuzzyWaddleAiRuntimeBrowserTestV1;
  const calibration = host?.config.calibration;
  if (!calibration || host?.game !== scene.game || playerNumber === calibration.targetPlayerNumber ||
      ![1, 2].includes(playerNumber)) return undefined;
  return `opening:${faction}:${calibration.opponentArchetype}`;
}
