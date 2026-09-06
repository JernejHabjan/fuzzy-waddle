import { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProfileConfigV1 } from "./ai-profile-defaults";

describe("createAiProfileConfigV1", () => {
  it.each([
    [ProbableWaffleAiDifficulty.Easy, "easy", 40, 1, 80],
    [ProbableWaffleAiDifficulty.Medium, "normal", 20, 2, 40],
    [ProbableWaffleAiDifficulty.Hard, "hard", 10, 3, 20]
  ] as const)(
    "maps lobby difficulty %s to the versioned fair profile",
    (source, label, interval, missions, reconsideration) => {
      const profile = createAiProfileConfigV1(source);
      expect(profile).toMatchObject({
        schemaVersion: 1,
        profileVersion: "skirmish-ai-v1",
        sourceDifficulty: source,
        difficulty: label,
        decisionIntervalTicks: interval,
        voluntaryOffensiveMissionLimit: missions,
        compositionReconsiderationTicks: reconsideration,
        intentionalErrors: false,
        cheats: false
      });
    }
  );

  it("rejects an unknown lobby difficulty", () => {
    expect(() => createAiProfileConfigV1(99 as ProbableWaffleAiDifficulty)).toThrow("unsupported_ai_difficulty");
  });
});
