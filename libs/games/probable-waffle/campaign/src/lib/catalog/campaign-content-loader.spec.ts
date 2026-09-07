import { loadMissionContent } from "./campaign-content-loader";

describe("loadMissionContent scenario presentation", () => {
  const missionEnvelope = {
    schemaVersion: 1,
    id: "dreams",
    chapterId: "prologue",
    revision: 1
  } as const;

  it("accepts an explicit empty resource HUD policy", () => {
    const document = {
      ...missionEnvelope,
      scenarioPresentation: { resourceHud: { visibleResources: [], showHousing: false } }
    };

    expect(loadMissionContent(document, "mission.json")).toBe(document);
  });

  it.each([
    { resourceHud: { visibleResources: ["wood", "wood"], showHousing: false } },
    { resourceHud: { visibleResources: ["gold"], showHousing: false } },
    { resourceHud: { visibleResources: ["wood"], showHousing: "yes" } },
    { resourceHud: { visibleResources: ["wood"], showHousing: false, inferredFromBalance: true } }
  ])("rejects malformed or ambiguous policy data", (scenarioPresentation) => {
    expect(() => loadMissionContent({ ...missionEnvelope, scenarioPresentation }, "mission.json")).toThrow(
      "mission.json: invalid scenarioPresentation"
    );
  });
});
