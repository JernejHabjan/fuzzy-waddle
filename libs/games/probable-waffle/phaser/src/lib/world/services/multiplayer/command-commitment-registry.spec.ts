import { CommandCommitmentRegistry } from "./command-commitment-registry";
import type { GameCommandAuthorityState } from "@fuzzy-waddle/probable-waffle-protocol";
const legacy = {
  schemaVersion: 1,
  authorityEpoch: 0,
  nextSequenceByPlayer: {},
  processedCommandIds: [],
  outcomes: []
} satisfies GameCommandAuthorityState;
describe("legacy commitment ownership", () => {
  it("restores pending keys even when their dispatched outcome aged out of the bounded history", () => {
    const registry = new CommandCommitmentRegistry();
    registry.restore({ ...legacy, activeCommitments: { "2:opaque:key": "2:0:8:instance" } });
    expect(registry.get(2, "2:opaque:key")).toBe("2:0:8:instance");
    expect(registry.get(3, "2:opaque:key")).toBeUndefined();
  });
  it("uses exact outcome identity for an archive with a custom command ID", () => {
    const registry = new CommandCommitmentRegistry();
    registry.restore({
      ...legacy,
      activeCommitments: { task: "custom" },
      outcomes: [
        {
          schemaVersion: 1,
          commandId: "custom",
          commitmentKey: "task",
          playerNumber: 3,
          kind: "dispatched",
          reason: "accepted_for_dispatch",
          tick: 0,
          authorityEpoch: 0,
          sequence: 8,
          actorIds: [],
          worldLinkIds: []
        }
      ]
    });
    expect(registry.get(3, "task")).toBe("custom");
  });
  it("fails closed when a legacy key has no recoverable owner", () => {
    const registry = new CommandCommitmentRegistry();
    expect(() => registry.restore({ ...legacy, activeCommitments: { task: "unknown" } })).toThrow("no player identity");
  });
  it("prefers the explicit player field and survives JSON keys that resemble object prototypes", () => {
    const registry = new CommandCommitmentRegistry();
    registry.set(3, "__proto__", "3:0:0:test");
    registry.set(2, "__proto__", "2:0:0:test");
    const saved: GameCommandAuthorityState = JSON.parse(
      JSON.stringify({
        ...legacy,
        activeCommitments: { ignored: "unknown" },
        activeCommitmentsByPlayer: registry.snapshot()
      })
    );
    registry.restore(saved);
    expect(registry.get(2, "__proto__")).toBe("2:0:0:test");
    expect(registry.get(3, "__proto__")).toBe("3:0:0:test");
    expect(registry.get(2, "ignored")).toBeUndefined();
  });
});
