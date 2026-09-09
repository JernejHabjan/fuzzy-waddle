import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProfileConfigV1 } from "./ai-profile-defaults";
import { selectAiOpeningArchetypeV1 } from "./ai-opening-archetypes-v1";

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

  it("D-02/D-03 selects a persisted fair personality from difficulty and stable seed only", () => {
    const easy = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Easy);
    const hard = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Hard);
    const first = selectAiOpeningArchetypeV1({
      faction: FactionType.Tivara,
      playerNumber: 1,
      profile: easy,
      seed: 759
    });
    const restored = selectAiOpeningArchetypeV1({
      faction: FactionType.Tivara,
      playerNumber: 1,
      profile: easy,
      seed: 759
    });
    const hardArchetype = selectAiOpeningArchetypeV1({
      faction: FactionType.Tivara,
      playerNumber: 1,
      profile: hard,
      seed: 759
    });
    expect(first).toEqual(restored);
    expect(["turtle", "balanced"]).toContain(first.purpose);
    expect(["rush", "macro", "tech", "air_control", "naval", "expeditionary"]).toContain(hardArchetype.purpose);
  });
});
