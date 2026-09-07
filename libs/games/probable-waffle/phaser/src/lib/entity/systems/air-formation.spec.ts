import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { allocateAirFormationDestinations, generateAirFormationCandidates } from "./air-formation";

describe("air formation", () => {
  it("assigns stable distinct destinations independently of selection order", () => {
    const anchor = { x: 5, y: 5, z: 3 };
    const ids = ["flyer-c", "flyer-a", "flyer-b"] as ActorId[];

    const forward = allocateAirFormationDestinations(anchor, ids, { width: 12, height: 12 });
    const reversed = allocateAirFormationDestinations(anchor, [...ids].reverse(), { width: 12, height: 12 });

    expect(Array.from(forward.entries())).toEqual(Array.from(reversed.entries()));
    expect(new Set(Array.from(forward.values()).map((tile) => `${tile.x},${tile.y}`)).size).toBe(3);
    expect(Array.from(forward.values()).every((tile) => tile.z === anchor.z)).toBe(true);
  });

  it("clamps edge formations and removes duplicate candidates", () => {
    const candidates = generateAirFormationCandidates({ x: 0, y: 0 }, { width: 2, height: 3 }, 20);

    expect(candidates).toHaveLength(6);
    expect(new Set(candidates.map((tile) => `${tile.x},${tile.y}`)).size).toBe(6);
    expect(candidates.every((tile) => tile.x >= 0 && tile.x < 2 && tile.y >= 0 && tile.y < 3)).toBe(true);
  });

  it("skips sequentially reserved rally slots without consulting terrain", () => {
    const anchor = { x: 4, y: 4, z: 0 };
    const first = allocateAirFormationDestinations(anchor, ["flyer-a" as ActorId], { width: 10, height: 10 });
    const firstTile = first.get("flyer-a" as ActorId)!;
    const second = allocateAirFormationDestinations(anchor, ["flyer-b" as ActorId], { width: 10, height: 10 }, [
      firstTile
    ]);

    expect(second.get("flyer-b" as ActorId)).toEqual({ x: 3, y: 3, z: 0 });
  });
});
