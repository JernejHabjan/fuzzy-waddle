import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { PlayerAiController } from "./player-ai-controller";

/** Actual controller configuration boundary only; no scene is constructed or represented as runtime match evidence. */
function resolve(difficulty: number): AiProfileConfigV1 | undefined {
  const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
  Reflect.set(controller, "player", { playerNumber: 2, playerController: {
    data: { playerDefinition: { factionType: FactionType.Tivara, difficulty } }
  } });
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
