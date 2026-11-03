import { requiresScheduledAiRuntimePresetSetup } from "./ai-runtime-preset-setup-requirement";

describe("runtime preset setup scheduling", () => {
  it("defers health starts until native health components have initialized", () => {
    expect(requiresScheduledAiRuntimePresetSetup({})).toBe(false);
    expect(requiresScheduledAiRuntimePresetSetup({
      healthStarts: [{ fixtureActorId: "ranged-probe", healthPermille: 400, armourPermille: 0 }]
    })).toBe(true);
  });

  it("applies pre-existing research at the paused pre-tick setup boundary", () => {
    expect(requiresScheduledAiRuntimePresetSetup({
      completedResearch: [{ playerNumber: 2, researchType: "healingLightSpell" as never }]
    })).toBe(true);
  });
});
