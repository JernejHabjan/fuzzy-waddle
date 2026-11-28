import { nearestActor } from "./nearest-actor";

describe("nearestActor", () => {
  it("finds the closest eligible actor in range, including the boundary", () => {
    const actors = [
      { x: 3, y: 4, active: true },
      { x: 1, y: 0, active: false },
      { x: 6, y: 0, active: true }
    ];
    expect(nearestActor({ x: 0, y: 0 }, actors, 5, (actor) => actor.active)).toBe(actors[0]);
    expect(nearestActor({ x: 0, y: 0 }, actors, 4, (actor) => actor.active)).toBeUndefined();
  });
});
