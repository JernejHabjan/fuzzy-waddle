import { asCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import { ScenarioRegionMembershipTracker, ScenarioRegionRuntime } from "./scenario-region";

describe("ScenarioRegionRuntime", () => {
  const rectangle = new ScenarioRegionRuntime({
    id: asCampaignContentId<"scenario-region">("western-yard"),
    shape: "rectangle",
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ],
    elevationPolicy: "same-level",
    elevation: 2
  });

  it("uses deterministic rectangle boundaries and logical elevation", () => {
    expect(rectangle.contains({ x: 0, y: 0, z: 2 })).toBe(true);
    expect(rectangle.contains({ x: 9.999, y: 9.999, z: 2 })).toBe(true);
    expect(rectangle.contains({ x: 10, y: 5, z: 2 })).toBe(false);
    expect(rectangle.contains({ x: 5, y: 10, z: 2 })).toBe(false);
    expect(rectangle.contains({ x: 5, y: 5, z: 1 })).toBe(false);
  });

  it("includes polygon edges and applies inclusive elevation ranges", () => {
    const polygon = new ScenarioRegionRuntime({
      id: asCampaignContentId<"scenario-region">("triangle"),
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 0, y: 8 }
      ],
      elevationPolicy: "range",
      minimumElevation: 1,
      maximumElevation: 3
    });

    expect(polygon.contains({ x: 4, y: 0, z: 1 })).toBe(true);
    expect(polygon.contains({ x: 2, y: 2, z: 3 })).toBe(true);
    expect(polygon.contains({ x: 7, y: 7, z: 2 })).toBe(false);
    expect(polygon.contains({ x: 2, y: 2, z: 4 })).toBe(false);
  });
});

describe("ScenarioRegionMembershipTracker", () => {
  it("emits stable enter and leave edges exactly once", () => {
    const first = region("z-region", 0, 10);
    const second = region("a-region", 5, 15);
    const tracker = new ScenarioRegionMembershipTracker();

    expect(tracker.update("hero", { x: 7, y: 5, z: 0 }, [first, second])).toEqual([
      { subjectId: "hero", regionId: "a-region", kind: "entered" },
      { subjectId: "hero", regionId: "z-region", kind: "entered" }
    ]);
    expect(tracker.update("hero", { x: 7, y: 5, z: 0 }, [second, first])).toEqual([]);
    expect(tracker.update("hero", { x: 12, y: 5, z: 0 }, [first, second])).toEqual([
      { subjectId: "hero", regionId: "z-region", kind: "left" }
    ]);
  });
});

function region(id: string, minimumX: number, maximumX: number): ScenarioRegionRuntime {
  return new ScenarioRegionRuntime({
    id: asCampaignContentId<"scenario-region">(id),
    shape: "rectangle",
    points: [
      { x: minimumX, y: 0 },
      { x: maximumX, y: 0 },
      { x: maximumX, y: 10 },
      { x: minimumX, y: 10 }
    ],
    elevationPolicy: "any"
  });
}
