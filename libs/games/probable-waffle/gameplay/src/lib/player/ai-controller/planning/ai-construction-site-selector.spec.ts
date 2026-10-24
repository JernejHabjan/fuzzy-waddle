import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { reachableAiConstructionTiles } from "./ai-producer-safety";

describe("construction travel ordering", () => {
  it("keeps current body occupancy separate from builder travel connectivity", () => {
    const base = createAiProductionPolicyFixture().observation,
      worker = createAiTestOwnedActor("builder");
    if (!base.map) throw new Error("construction_fixture_map_missing");
    const builder = {
      ...worker,
      logicalPosition: {
        status: "known" as const,
        value: { x: 0, y: 0, z: 0 },
        observedTick: 0
      }
    };
    const cells = [0, 1, 2].map((x) => ({
      tileKey: `${x},0`,
      position: { x, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: x < 2
    }));
    const observation = { ...base, map: { ...base.map, constructionCells: cells } };
    expect([...reachableAiConstructionTiles(observation, builder)]).toEqual(["0,0", "1,0", "2,0"]);
    expect(selectConstructionPosition(observation, builder, 0, 0, new Set())).toEqual({ x: 2, y: 0, z: 0 });
  });
  it("keeps the nearest legal site regardless of decision sequence, then reserves the next footprint", () => {
    const builder = {
      ...createAiTestOwnedActor("builder"),
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 0 }
    };
    const base = createAiProductionPolicyFixture().observation;
    if (!base.map) throw new Error("construction_fixture_map_missing");
    const cells = [1, 2, 50].map((x) => ({
      tileKey: `${x},0`,
      position: { x, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = { ...base, map: { ...base.map, constructionCells: cells } };
    const reserved = new Set<string>();
    expect(selectConstructionPosition(observation, builder, 2, 0, reserved)).toEqual({ x: 1, y: 0, z: 0 });
    expect(selectConstructionPosition(observation, builder, 100, 1, reserved)).toEqual({ x: 2, y: 0, z: 0 });
    expect(
      selectConstructionPosition(observation, builder, 1, 0, new Set(), 0, (cell) => cell.position.x === 50)
    ).toEqual({ x: 50, y: 0, z: 0 });
  });
});
