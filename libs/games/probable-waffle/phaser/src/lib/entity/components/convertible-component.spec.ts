import { chooseConversionCandidate, type ConversionCandidate } from "./convertible-component";

const candidate = (
  playerNumber: number,
  actorId: string,
  distance: number,
  active = true,
  killed = false
): ConversionCandidate => ({
  playerNumber,
  actorId,
  distance,
  active,
  killed,
  actor: { active } as ConversionCandidate["actor"]
});

describe("chooseConversionCandidate", () => {
  it("chooses the same winner for simultaneous candidates regardless of discovery order", () => {
    const candidates = [candidate(3, "unit-z", 1), candidate(2, "unit-b", 1), candidate(2, "unit-a", 1)];
    expect(chooseConversionCandidate(candidates)?.actorId).toBe("unit-a");
    expect(chooseConversionCandidate([...candidates].reverse())?.actorId).toBe("unit-a");
  });

  it("skips inactive and killed candidates instead of aborting the scan", () => {
    expect(
      chooseConversionCandidate([
        candidate(1, "inactive-nearest", 0, false),
        candidate(1, "killed-nearest", 0, true, true),
        candidate(2, "live", 1)
      ])?.actorId
    ).toBe("live");
  });

  it("does not let an unaddressable actor win a deterministic tie", () => {
    expect(chooseConversionCandidate([candidate(1, "", 0), candidate(1, "stable", 1)])?.actorId).toBe("stable");
  });
});
