import { buildsWithoutAssignedWorkers, constructionVitalityIncrement } from "./construction-site-component";

describe("buildsWithoutAssignedWorkers", () => {
  it("admits an immediate automatic zero-builder site", () => {
    expect(
      buildsWithoutAssignedWorkers({
        startImmediately: true,
        progressMadeAutomatically: 1000,
        maxAssignedBuilders: 0
      })
    ).toBe(true);
  });

  it.each([
    { startImmediately: false, progressMadeAutomatically: 1000, maxAssignedBuilders: 0 },
    { startImmediately: true, progressMadeAutomatically: 0, maxAssignedBuilders: 0 },
    { startImmediately: true, progressMadeAutomatically: 1000, maxAssignedBuilders: 1 }
  ])("keeps builder-backed or non-starting sites on the assignment path", (definition) => {
    expect(buildsWithoutAssignedWorkers(definition)).toBe(false);
  });
});

describe("constructionVitalityIncrement", () => {
  it("keeps zero-duration full-health construction finite", () => {
    expect(constructionVitalityIncrement(0, 0, 1000)).toBe(0);
  });

  it("finishes missing vitality for an instant construction", () => {
    expect(constructionVitalityIncrement(75, 0, 1000)).toBe(75);
  });

  it("scales ordinary construction vitality by progress", () => {
    expect(constructionVitalityIncrement(80, 400, 100)).toBe(20);
  });
});
