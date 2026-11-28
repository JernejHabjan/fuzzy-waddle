import {
  isConstructionFootprintValidForRule,
  isConstructionTileEligibleForRule,
  type ConstructionTerrainProbe
} from "../construction-placement-validator";

describe("construction-placement-validator", () => {
  const probe = (landKeys: string[], waterKeys: string[]): ConstructionTerrainProbe => ({
    isGroundNavigable: (t) => landKeys.includes(`${t.x},${t.y}`),
    isWaterNavigable: (t) => waterKeys.includes(`${t.x},${t.y}`)
  });

  it("requires all tiles to be ground-navigable for the default ground rule", () => {
    const p = probe(["0,0", "1,0"], ["2,0"]);
    expect(isConstructionFootprintValidForRule([{ x: 0, y: 0 }, { x: 1, y: 0 }], "ground", p)).toBe(true);
    expect(isConstructionFootprintValidForRule([{ x: 0, y: 0 }, { x: 2, y: 0 }], "ground", p)).toBe(false);
  });

  it("allows coastal buildings when footprint spans at least one land tile and one water tile", () => {
    const p = probe(["0,0", "1,0"], ["0,1", "1,1"]);
    const straddling = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ];
    expect(isConstructionFootprintValidForRule(straddling, "coastal", p)).toBe(true);
  });

  it("rejects coastal buildings placed purely on land, purely on water, or overlapping blocked tiles", () => {
    const p = probe(["0,0", "1,0"], ["0,1", "1,1"]);
    expect(isConstructionFootprintValidForRule([{ x: 0, y: 0 }, { x: 1, y: 0 }], "coastal", p)).toBe(false);
    expect(isConstructionFootprintValidForRule([{ x: 0, y: 1 }, { x: 1, y: 1 }], "coastal", p)).toBe(false);
    expect(
      isConstructionFootprintValidForRule([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 9, y: 9 }], "coastal", p)
    ).toBe(false);
  });

  it("marks both land and water tiles as eligible for coastal single-tile preview", () => {
    const p = probe(["0,0"], ["0,1"]);
    expect(isConstructionTileEligibleForRule({ x: 0, y: 0 }, "coastal", p)).toBe(true);
    expect(isConstructionTileEligibleForRule({ x: 0, y: 1 }, "coastal", p)).toBe(true);
    expect(isConstructionTileEligibleForRule({ x: 5, y: 5 }, "coastal", p)).toBe(false);
  });
});
