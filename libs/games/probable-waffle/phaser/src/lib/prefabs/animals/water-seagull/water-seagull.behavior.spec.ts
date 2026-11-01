import {
  getWaterSeagullFlightDirection,
  isSharkWithinWaterSeagullReactionRadius,
  WATER_SEAGULL_REACTION_RADIUS_PX
} from "./water-seagull.behavior";

describe("water seagull behavior", () => {
  it("reacts to sharks at the inclusive configured radius only", () => {
    expect(isSharkWithinWaterSeagullReactionRadius({ x: 0, y: 0 }, { x: WATER_SEAGULL_REACTION_RADIUS_PX, y: 0 })).toBe(
      true
    );
    expect(
      isSharkWithinWaterSeagullReactionRadius({ x: 0, y: 0 }, { x: WATER_SEAGULL_REACTION_RADIUS_PX + 1, y: 0 })
    ).toBe(false);
  });

  it("flies horizontally away from the triggering shark with a deterministic overlap fallback", () => {
    expect(getWaterSeagullFlightDirection(100, 200)).toBe(-1);
    expect(getWaterSeagullFlightDirection(200, 100)).toBe(1);
    expect(getWaterSeagullFlightDirection(100, 100)).toBe(1);
  });
});
