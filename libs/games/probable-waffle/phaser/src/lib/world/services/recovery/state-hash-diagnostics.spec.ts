import { StateHashDiagnostics } from "./state-hash-diagnostics";

describe("state-hash movement exception", () => {
  const diagnostics = new StateHashDiagnostics();
  const digest = (x: number, tail = "scenario") => [
    "actor", "unit", 100, 0, x, 10, 0, 2, "queue", "economy", "combat", "{orderType:Move}", tail
  ].join(":");

  it("ignores a tiny position-only move but never ignores a changed or extended state tail", () => {
    expect(diagnostics.isTransientMovementPositionDrift(`actor=actor local=${digest(10)} remote=${digest(11)}`))
      .not.toBeNull();
    expect(diagnostics.isTransientMovementPositionDrift(
      `actor=actor local=${digest(10)} remote=${digest(11, "changed-queue-state")}`
    )).toBeNull();
    expect(diagnostics.isTransientMovementPositionDrift(
      `actor=actor local=${digest(10)} remote=${digest(11)}:extra-authority-field`
    )).toBeNull();
  });
});
