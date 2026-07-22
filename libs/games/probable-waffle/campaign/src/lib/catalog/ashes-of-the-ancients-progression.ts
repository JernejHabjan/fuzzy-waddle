import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignProgressionDefinitions } from "../contracts/campaign-progression-definition";
import { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";

export const AOTA_CAMPAIGN_CRYSTAL_ID = "campaign-crystal";

/** Stable placeholder hero IDs remain valid when final narrative display names are authored later. */
export const AOTA_PROGRESSION_DEFINITIONS: CampaignProgressionDefinitions = {
  currencies: [{ id: AOTA_CAMPAIGN_CRYSTAL_ID, title: "Campaign Crystal", initialBalance: 1 }],
  heroes: [
    {
      id: "tivara-hero",
      title: "Tivara Hero",
      actorName: ObjectNames.TivaraMacemanMale,
      faction: FactionType.Tivara
    },
    {
      id: "skaduwee-hero",
      title: "Skaduwee Hero",
      actorName: ObjectNames.SkaduweeWarriorMale,
      faction: FactionType.Skaduwee
    }
  ],
  unlocks: [
    {
      id: "mission-cyclops-and-sheep",
      title: "Cyclops & Sheep",
      kind: "starting-bonus",
      chapterId: "two-homelands"
    }
  ],
  upgrades: [],
  items: [],
  temporaryBoosts: []
};

export const AOTA_CAMPAIGN_PROGRESSION_REGISTRY = new CampaignProgressionRegistry(AOTA_PROGRESSION_DEFINITIONS);
