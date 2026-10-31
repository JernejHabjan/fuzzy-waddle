import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type Phaser from "phaser";
import { FactionType, ObjectNames, type ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogEntryV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { projectAvailableCatalogEntries } from "./ai-observation-catalog";

jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(), getSceneComponent: jest.fn()
}));

it.each([true, false])("exposes locked food prerequisite prices only when faction content is allowed: %s", (allowed) => {
  (getSceneService as jest.Mock).mockReturnValue({
    getFactionActorIds: () => [ObjectNames.Field], isAvailable: () => false, isContentAllowed: () => allowed,
    getResearchedLevelForUnit: () => 0
  });
  const catalog = new Map<string, AiCapabilityCatalogEntryV1>();
  projectAvailableCatalogEntries({} as Phaser.Scene, { factionType: FactionType.Tivara } as ProbableWafflePlayer, 2, catalog);
  if (!allowed) expect(catalog.size).toBe(0);
  else {
    const field = requireAiTestEntry([...catalog.values()], 0);
    expect(field.sourceObjectName).toBe(ObjectNames.Field);
    expect(field.constructionProfile?.requiredObjectNames).toEqual([ObjectNames.Granary]);
    expect(field.constructionProfile?.resourceCost.wood).toBeGreaterThan(0);
  }
});
