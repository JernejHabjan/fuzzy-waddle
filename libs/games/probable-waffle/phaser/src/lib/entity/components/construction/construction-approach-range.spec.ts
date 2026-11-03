import { constructionApproachRange } from "./construction-approach-range";

describe("constructionApproachRange", () => {
  it.each([
    { radius: 0, expected: 1 },
    { radius: 1, expected: 2 },
    { radius: 2, expected: 3 }
  ])("keeps an approach tile outside a square footprint of radius $radius", ({ radius, expected }) => {
    const footprint = Array.from({ length: radius * 2 + 1 }, (_, x) =>
      Array.from({ length: radius * 2 + 1 }, (_, y) => ({ x: x - radius, y: y - radius }))
    ).flat();

    expect(constructionApproachRange(footprint, { x: 0, y: 0 })).toBe(expected);
  });

  it("uses a safe fallback if observed footprint data is unavailable", () => {
    expect(constructionApproachRange([], { x: 4, y: 7 })).toBe(1);
    expect(constructionApproachRange([{ x: 4, y: 7 }], undefined)).toBe(1);
  });
});
