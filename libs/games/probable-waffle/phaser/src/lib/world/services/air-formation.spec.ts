import { getAirFormationCandidateForActor, getAirFormationCandidates } from "./air-formation";

describe("getAirFormationCandidates", () => {
  const bounds = { minX: 0, maxX: 4, minY: 0, maxY: 4 };

  it("starts at the anchor and expands in deterministic square rings", () => {
    expect(getAirFormationCandidates({ x: 2, y: 2 }, bounds, 1)).toEqual([
      { x: 2, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 }
    ]);
  });

  it("clamps edge candidates and removes duplicates created by clamping", () => {
    const candidates = getAirFormationCandidates({ x: 0, y: 0 }, bounds, 2);

    expect(candidates).toEqual(expect.arrayContaining([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]));
    expect(new Set(candidates.map((candidate) => `${candidate.x},${candidate.y}`)).size).toBe(candidates.length);
    expect(candidates.every((candidate) => candidate.x >= 0 && candidate.x <= 4 && candidate.y >= 0 && candidate.y <= 4)).toBe(true);
  });

  it("assigns the same unique slots when command selection order changes", () => {
    const candidates = getAirFormationCandidates({ x: 2, y: 2 }, bounds, 1);

    const ordered = ["flyer-b", "flyer-a"].map((id) =>
      getAirFormationCandidateForActor(id, ["flyer-b", "flyer-a"], candidates)
    );
    const reversed = ["flyer-b", "flyer-a"].map((id) =>
      getAirFormationCandidateForActor(id, ["flyer-a", "flyer-b"], candidates)
    );

    expect(ordered).toEqual(reversed);
    expect(ordered[0]).not.toEqual(ordered[1]);
  });
});
