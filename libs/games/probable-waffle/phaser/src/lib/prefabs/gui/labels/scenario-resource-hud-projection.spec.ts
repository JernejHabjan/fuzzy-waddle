import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createScenarioResourceHudLayout, resolveScenarioResourceHudEntries } from "./scenario-resource-hud-projection";

describe("scenario resource HUD projection", () => {
  it("preserves the complete legacy HUD when no scenario policy exists", () => {
    const entries = resolveScenarioResourceHudEntries();

    expect(entries).toEqual([
      ResourceType.Food,
      ResourceType.Wood,
      ResourceType.Stone,
      ResourceType.Minerals,
      "housing"
    ]);
    expect(createScenarioResourceHudLayout(entries, false)).toMatchObject({
      containerScale: 2,
      background: { width: 50, height: 10, scaleX: 4.62, scaleY: 2.8023638778148445 }
    });
  });

  it("preserves authored order and appends housing when requested", () => {
    const entries = resolveScenarioResourceHudEntries({
      resourceHud: {
        visibleResources: [ResourceType.Minerals, ResourceType.Food],
        showHousing: true
      }
    });

    expect(entries).toEqual([ResourceType.Minerals, ResourceType.Food, "housing"]);
    expect(createScenarioResourceHudLayout(entries, true).entries).toEqual([
      { type: ResourceType.Minerals, x: 42, y: 21 },
      { type: ResourceType.Food, x: 42, y: 42 },
      { type: "housing", x: 42, y: 63 }
    ]);
  });

  it("projects an authored empty policy without falling back to default entries", () => {
    const entries = resolveScenarioResourceHudEntries({
      resourceHud: { visibleResources: [], showHousing: false }
    });

    expect(entries).toEqual([]);
  });
});
