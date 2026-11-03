import { SpellTargetType } from "@fuzzy-waddle/probable-waffle-protocol";
import { castTargetObjectId } from "./ai-intent-dispatcher";

describe("AI cast command targeting", () => {
  it("uses actor identity only for actor-target spells", () => {
    expect(castTargetObjectId({ targetType: SpellTargetType.Actor }, "wounded-ally")).toBe("wounded-ally");
    expect(castTargetObjectId({ targetType: SpellTargetType.Actor }, null)).toBeUndefined();
    expect(castTargetObjectId({ targetType: SpellTargetType.Ground }, "wounded-ally")).toBeUndefined();
    expect(castTargetObjectId({ targetType: SpellTargetType.Ground }, undefined)).toBeUndefined();
  });
});
