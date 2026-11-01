import {
  FactionType,
  ProbableWaffleAiDifficulty,
  type ProbableWafflePlayer
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { PlayerAiController } from "./player-ai-controller";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";

/** Actual controller configuration boundary only; no scene is constructed or represented as runtime match evidence. */
function resolve(difficulty: number): AiProfileConfigV1 | undefined {
  const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
  Reflect.set(controller, "player", {
    playerNumber: 2,
    playerController: {
      data: { playerDefinition: { factionType: FactionType.Tivara, difficulty } }
    }
  });
  return (controller as unknown as { resolveProfile(): AiProfileConfigV1 | undefined }).resolveProfile();
}

describe("D-01 controller profile configuration boundary", () => {
  it.each([
    [ProbableWaffleAiDifficulty.Easy, "easy", 40],
    [ProbableWaffleAiDifficulty.Medium, "normal", 20],
    [ProbableWaffleAiDifficulty.Hard, "hard", 10]
  ])("resolves lobby value %s without a Normal fallback", (difficulty, label, interval) => {
    expect(resolve(Number(difficulty))).toMatchObject({ difficulty: label, decisionIntervalTicks: interval });
  });

  it("fails before scheduling or dispatch when the configuration is invalid", () => {
    expect(() => resolve(99)).toThrow("unsupported_ai_difficulty");
  });
});

// These fail before constructing observation services, subscribing or scheduling commands.
it.each([
  [undefined, FactionType.Tivara, "ai_player_identity_unavailable"],
  [NaN, FactionType.Tivara, "ai_player_identity_unavailable"],
  [-1, FactionType.Tivara, "ai_player_identity_unavailable"],
  [1, undefined, "ai_player_faction_unavailable"],
  [1, 99, "ai_player_faction_unavailable"]
])("rejects player %s and faction %s before runtime setup", (playerNumber, factionType, error) => {
  const player = {
    playerNumber,
    playerController: {
      data: { playerDefinition: { factionType, difficulty: ProbableWaffleAiDifficulty.Medium } }
    }
  } as unknown as ProbableWafflePlayer;
  expect(() => new PlayerAiController({} as ProbableWaffleScene, player)).toThrow(error);
});
