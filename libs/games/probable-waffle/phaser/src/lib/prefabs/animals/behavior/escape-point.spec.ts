import { escapePoint } from "./escape-point";

describe("escapePoint", () => {
  it("moves directly away from a vertically aligned threat", () => {
    expect(escapePoint({ x: 10, y: 20 }, { x: 10, y: 10 }, 30)).toEqual({ x: 10, y: 50 });
  });

  it("uses a stable direction when the threat overlaps", () => {
    expect(escapePoint({ x: 10, y: 20 }, { x: 10, y: 20 }, 30)).toEqual({ x: 40, y: 20 });
  });
});
