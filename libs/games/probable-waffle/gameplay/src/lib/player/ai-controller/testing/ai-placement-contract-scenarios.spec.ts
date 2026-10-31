import { selectConstructionPosition } from "../planning/ai-construction-site-selector";
import { aiEconomySiteSafety } from "../planning/ai-economy-site-safety";
import { combatActor } from "../planning/ai-tactics-test-fixtures";
import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";
import { createAiTestOwnedActor } from "./ai-test-fixtures";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

const builder = {
  ...createAiTestOwnedActor("field-builder"),
  logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 200 }
};

function cell(x: number, y = 0) {
  return {
    tileKey: `${x},${y}`,
    position: { x, y, z: 0 },
    groundPassable: true,
    waterPassable: false,
    elevation: 0,
    observedBlocked: false
  };
}

describe("economic placement scenario contracts", () => {
  it("PLACE-01 reserves distinct aligned economic sites while preserving central reserved space", () => {
    const f = createAiProductionPolicyFixture();
    if (!f.observation.map) throw new Error("missing_map");
    const observation = {
      ...f.observation,
      actors: [builder],
      map: {
        ...f.observation.map,
        constructionCells: Array.from({ length: 5 }, (_, x) =>
          Array.from({ length: 5 }, (_, y) => cell(x - 2, y - 2))
        ).flat()
      }
    };
    const reserved = new Set(["1,0", "1,1"]);
    const positions = [0, 1].map((ordinal) =>
      selectConstructionPosition(
        observation,
        builder,
        1,
        ordinal,
        reserved,
        0,
        (candidate) => candidate.position.x === -2
      )
    );
    expect(positions.every((position) => position?.x === -2)).toBe(true);
    expect(new Set(positions.map((position) => `${position?.x},${position?.y}`)).size).toBe(2);
    expect([...reserved]).toContain("1,0");
    expect(positions).not.toContainEqual({ x: 1, y: 0, z: 0 });
  });

  it("PLACE-02 uses the nearer economic site when safe and an inner alternative when that site is exposed", () => {
    const f = createAiProductionPolicyFixture();
    if (!f.observation.map) throw new Error("missing_map");
    const safe = {
      ...f.observation,
      tick: 100,
      actors: [builder],
      map: { ...f.observation.map, constructionCells: [cell(2), cell(-5)] }
    };
    const choose = (world: AiObservationV1) =>
      selectConstructionPosition(world, builder, 1, 0, new Set(), 0, (candidate) =>
        aiEconomySiteSafety(world).positionSafe(candidate.position)
      );
    expect(choose(safe)).toEqual({ x: 2, y: 0, z: 0 });
    const hostile = { ...combatActor("visible-raider", "enemy", 7), observedTick: 100 };
    const exposed = {
      ...safe,
      actors: [builder, hostile],
      threatSummary: {
        observedTick: 100,
        visibleEnemyActorIds: [hostile.actorId],
        rememberedEnemyActorIds: [],
        observedCapabilityFamilies: ["attack"]
      }
    };
    expect(choose(exposed)).toEqual({ x: -5, y: 0, z: 0 });
  });
});
