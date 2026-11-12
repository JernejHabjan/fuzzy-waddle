import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/fixtures/coordination/ai-test-fixtures";
import type Phaser from "phaser";
import { FactionType, ObjectNames, type ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogEntry } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { projectAvailableCatalogEntries } from "./ai-observation-catalog";

jest.mock("../../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneComponent: jest.fn()
}));

it.each([true, false])(
  "exposes locked food prerequisite prices only when faction content is allowed: %s",
  (allowed) => {
    (getSceneService as jest.Mock).mockReturnValue({
      getFactionActorIds: () => [ObjectNames.Field],
      isAvailable: () => false,
      isContentAllowed: () => allowed,
      getResearchedLevelForUnit: () => 0
    });
    const catalog = new Map<string, AiCapabilityCatalogEntry>();
    projectAvailableCatalogEntries(
      {} as Phaser.Scene,
      { factionType: FactionType.Tivara } as ProbableWafflePlayer,
      2,
      catalog
    );
    if (!allowed) expect(catalog.size).toBe(0);
    else {
      const field = requireAiTestEntry([...catalog.values()], 0);
      expect(field.sourceObjectName).toBe(ObjectNames.Field);
      expect(field.constructionProfile?.requiredObjectNames).toEqual([ObjectNames.Granary]);
      expect(field.constructionProfile?.resourceCost.wood).toBeGreaterThan(0);
    }
  }
);

it.each([true, false])("exposes a locked faction counter recipe only when content is allowed: %s", (allowed) => {
  (getSceneService as jest.Mock).mockReturnValue({
    getFactionActorIds: () => [ObjectNames.TivaraSlingshotFemale],
    isAvailable: () => false,
    isContentAllowed: () => allowed,
    getResearchedLevelForUnit: () => 1,
    getPrerequisites: () => ({ prereqs: { researchTypes: [] } })
  });
  const catalog = new Map<string, AiCapabilityCatalogEntry>();
  projectAvailableCatalogEntries(
    {} as Phaser.Scene,
    { factionType: FactionType.Tivara } as ProbableWafflePlayer,
    2,
    catalog
  );
  if (!allowed) expect(catalog.size).toBe(0);
  else {
    const counter = requireAiTestEntry([...catalog.values()], 0);
    expect(counter.targetDomains).toContain("air");
    expect(counter.constructionProfile?.requiredObjectNames).toContain(ObjectNames.Temple);
  }
});

it("does not expose a counter that still requires research", () => {
  (getSceneService as jest.Mock).mockReturnValue({
    getFactionActorIds: () => [ObjectNames.TivaraSlingshotFemale],
    isAvailable: () => false,
    isContentAllowed: () => true,
    getResearchedLevelForUnit: () => 1,
    getPrerequisites: () => ({ prereqs: { researchTypes: ["missing-research"] } })
  });
  const catalog = new Map<string, AiCapabilityCatalogEntry>();
  projectAvailableCatalogEntries(
    {} as Phaser.Scene,
    { factionType: FactionType.Tivara } as ProbableWafflePlayer,
    2,
    catalog
  );
  expect(catalog.size).toBe(0);
});
