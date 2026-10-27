import { expect, test } from "@playwright/test";
import { nativeDomainMissionTargetsActor } from "./skirmish-ai-native-domain-evaluation";

test("credits a paid domain effect on a candidate considered by its compatible attack mission", () => {
  const target = { actorId: "enemy-core", evidenceId: "evidence:enemy-core" };

  expect(
    nativeDomainMissionTargetsActor(
      { role: "attack", domain: "air", actorIds: ["paid-owl"], objectiveId: "hypothesis:evidence:enemy-core" },
      target,
      "air",
      "paid-owl"
    )
  ).toBe(true);
  expect(
    nativeDomainMissionTargetsActor(
      { role: "reserve", domain: "air", actorIds: ["paid-owl"], objectiveId: "enemy-core" },
      target,
      "air",
      "paid-owl"
    )
  ).toBe(false);
  expect(
    nativeDomainMissionTargetsActor(
      {
        role: "attack",
        domain: "air",
        actorIds: ["paid-owl"],
        objectiveId: "committed-core"
      },
      target,
      "air",
      "paid-owl",
      { targetActorId: "committed-core", alternatives: [{ targetActorId: "enemy-core" }] }
    )
  ).toBe(true);
  expect(
    nativeDomainMissionTargetsActor(
      { role: "attack", domain: "ground", actorIds: ["paid-owl"], objectiveId: "enemy-core" },
      target,
      "air",
      "paid-owl"
    )
  ).toBe(false);
});
