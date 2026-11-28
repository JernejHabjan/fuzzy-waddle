import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { TechTreeService } from "../tech-tree.service";

describe("TechTree OR-prerequisites", () => {
  it("unlocks Field when either TivaraGranary or SkaduweeGranary is unlocked", () => {
    const service = new TechTreeService();
    expect(service.getPrerequisites(1, ObjectNames.Field).prereqs.objectNames.length).toBeGreaterThan(0);

    service.unlock(1, ObjectNames.TivaraGranary);
    expect(service.getPrerequisites(1, ObjectNames.Field).prereqs.objectNames).toEqual([]);

    const service2 = new TechTreeService();
    service2.unlock(2, ObjectNames.SkaduweeGranary);
    expect(service2.getPrerequisites(2, ObjectNames.Field).prereqs.objectNames).toEqual([]);
  });

  it("unlocks CommonBoat and VikingBoat when either TivaraDock or SkaduweeDock is unlocked", () => {
    const tivaraTree = new TechTreeService();
    tivaraTree.unlock(1, ObjectNames.TivaraDock);
    expect(tivaraTree.getPrerequisites(1, ObjectNames.CommonBoat).prereqs.objectNames).toEqual([]);
    expect(tivaraTree.getPrerequisites(1, ObjectNames.VikingBoat).prereqs.objectNames).toEqual([]);

    const skaduweeTree = new TechTreeService();
    skaduweeTree.unlock(2, ObjectNames.SkaduweeDock);
    expect(skaduweeTree.getPrerequisites(2, ObjectNames.CommonBoat).prereqs.objectNames).toEqual([]);
    expect(skaduweeTree.getPrerequisites(2, ObjectNames.VikingBoat).prereqs.objectNames).toEqual([]);
  });

  it("unlocks siege units when either TivaraSiegeWorkshop or SkaduweeSiegeWorkshop is unlocked", () => {
    const service = new TechTreeService();
    service.unlock(1, ObjectNames.TivaraSiegeWorkshop);
    expect(service.getPrerequisites(1, ObjectNames.Catapult).prereqs.objectNames).toEqual([]);
    expect(service.getPrerequisites(1, ObjectNames.Ballista).prereqs.objectNames).toEqual([]);
    expect(service.getPrerequisites(1, ObjectNames.Cannon).prereqs.objectNames).toEqual([]);
  });
});
