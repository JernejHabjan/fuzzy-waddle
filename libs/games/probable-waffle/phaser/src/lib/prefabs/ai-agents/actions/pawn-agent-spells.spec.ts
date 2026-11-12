import { SpellTargetType } from "@fuzzy-waddle/probable-waffle-protocol";
import { autocastTargetRelation } from "./pawn-agent-spells";

describe("pawn spell autocast target metadata", () => {
  it("maps actor-target spells through their allowed relation", () => {
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Actor, targetAllies: true, targetEnemies: false, targetSelf: true
    })).toBe("ally");
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Actor, targetAllies: false, targetEnemies: true, targetSelf: false
    })).toBe("enemy");
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Actor, targetAllies: false, targetEnemies: false, targetSelf: true
    })).toBe("self");
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Actor, targetAllies: false, targetEnemies: false, targetSelf: false
    })).toBeNull();
  });

  it("preserves the dedicated target types", () => {
    expect(autocastTargetRelation({
      targetType: SpellTargetType.FriendlyUnit, targetAllies: true, targetEnemies: false, targetSelf: false
    })).toBe("ally");
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Ground, targetAllies: false, targetEnemies: true, targetSelf: false
    })).toBe("enemy");
    expect(autocastTargetRelation({
      targetType: SpellTargetType.Self, targetAllies: false, targetEnemies: false, targetSelf: true
    })).toBe("self");
  });
});
