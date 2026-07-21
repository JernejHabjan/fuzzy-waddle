import type { CampaignId } from "@fuzzy-waddle/probable-waffle-protocol";
import campaignDocument from "../content/ashes-of-the-ancients/campaign.json";
import mission01Document from "../content/ashes-of-the-ancients/missions/dreams/mission.json";
import mission01DialogueDocument from "../content/ashes-of-the-ancients/missions/dreams/dialogue.json";
import mission01RewardsDocument from "../content/ashes-of-the-ancients/missions/dreams/rewards.json";
import mission02Document from "../content/ashes-of-the-ancients/missions/cyclops-and-sheep/mission.json";
import mission02DialogueDocument from "../content/ashes-of-the-ancients/missions/cyclops-and-sheep/dialogue.json";
import mission02RewardsDocument from "../content/ashes-of-the-ancients/missions/cyclops-and-sheep/rewards.json";
import mission03Document from "../content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/mission.json";
import mission03DialogueDocument from "../content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/dialogue.json";
import mission03RewardsDocument from "../content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/rewards.json";
import mission04Document from "../content/ashes-of-the-ancients/missions/slingshooters-and-wolves/mission.json";
import mission04DialogueDocument from "../content/ashes-of-the-ancients/missions/slingshooters-and-wolves/dialogue.json";
import mission04RewardsDocument from "../content/ashes-of-the-ancients/missions/slingshooters-and-wolves/rewards.json";
import mission05Document from "../content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/mission.json";
import mission05DialogueDocument from "../content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/dialogue.json";
import mission05RewardsDocument from "../content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/rewards.json";
import mission06Document from "../content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/mission.json";
import mission06DialogueDocument from "../content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/dialogue.json";
import mission06RewardsDocument from "../content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/rewards.json";
import mission07Document from "../content/ashes-of-the-ancients/missions/we-had-enough/mission.json";
import mission07DialogueDocument from "../content/ashes-of-the-ancients/missions/we-had-enough/dialogue.json";
import mission07RewardsDocument from "../content/ashes-of-the-ancients/missions/we-had-enough/rewards.json";
import mission08Document from "../content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/mission.json";
import mission08DialogueDocument from "../content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/dialogue.json";
import mission08RewardsDocument from "../content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/rewards.json";
import mission09Document from "../content/ashes-of-the-ancients/missions/the-first-and-last-dinner/mission.json";
import mission09DialogueDocument from "../content/ashes-of-the-ancients/missions/the-first-and-last-dinner/dialogue.json";
import mission09RewardsDocument from "../content/ashes-of-the-ancients/missions/the-first-and-last-dinner/rewards.json";
import mission10Document from "../content/ashes-of-the-ancients/missions/the-siege/mission.json";
import mission10DialogueDocument from "../content/ashes-of-the-ancients/missions/the-siege/dialogue.json";
import mission10RewardsDocument from "../content/ashes-of-the-ancients/missions/the-siege/rewards.json";
import mission11Document from "../content/ashes-of-the-ancients/missions/time-rush/mission.json";
import mission11DialogueDocument from "../content/ashes-of-the-ancients/missions/time-rush/dialogue.json";
import mission11RewardsDocument from "../content/ashes-of-the-ancients/missions/time-rush/rewards.json";
import mission12Document from "../content/ashes-of-the-ancients/missions/joining-crystal/mission.json";
import mission12DialogueDocument from "../content/ashes-of-the-ancients/missions/joining-crystal/dialogue.json";
import mission12RewardsDocument from "../content/ashes-of-the-ancients/missions/joining-crystal/rewards.json";
import mission13Document from "../content/ashes-of-the-ancients/missions/mobster-or-friend/mission.json";
import mission13DialogueDocument from "../content/ashes-of-the-ancients/missions/mobster-or-friend/dialogue.json";
import mission13RewardsDocument from "../content/ashes-of-the-ancients/missions/mobster-or-friend/rewards.json";
import mission14Document from "../content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/mission.json";
import mission14DialogueDocument from "../content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/dialogue.json";
import mission14RewardsDocument from "../content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/rewards.json";
import mission15Document from "../content/ashes-of-the-ancients/missions/cult-wars/mission.json";
import mission15DialogueDocument from "../content/ashes-of-the-ancients/missions/cult-wars/dialogue.json";
import mission15RewardsDocument from "../content/ashes-of-the-ancients/missions/cult-wars/rewards.json";
import mission16Document from "../content/ashes-of-the-ancients/missions/the-volcano/mission.json";
import mission16DialogueDocument from "../content/ashes-of-the-ancients/missions/the-volcano/dialogue.json";
import mission16RewardsDocument from "../content/ashes-of-the-ancients/missions/the-volcano/rewards.json";
import mission17Document from "../content/ashes-of-the-ancients/missions/the-betrayal/mission.json";
import mission17DialogueDocument from "../content/ashes-of-the-ancients/missions/the-betrayal/dialogue.json";
import mission17RewardsDocument from "../content/ashes-of-the-ancients/missions/the-betrayal/rewards.json";
import mission18Document from "../content/ashes-of-the-ancients/missions/undead-and-cursed-lands/mission.json";
import mission18DialogueDocument from "../content/ashes-of-the-ancients/missions/undead-and-cursed-lands/dialogue.json";
import mission18RewardsDocument from "../content/ashes-of-the-ancients/missions/undead-and-cursed-lands/rewards.json";
import mission19Document from "../content/ashes-of-the-ancients/missions/end-game/mission.json";
import mission19DialogueDocument from "../content/ashes-of-the-ancients/missions/end-game/dialogue.json";
import mission19RewardsDocument from "../content/ashes-of-the-ancients/missions/end-game/rewards.json";
import mission20Document from "../content/ashes-of-the-ancients/missions/resolution/mission.json";
import mission20DialogueDocument from "../content/ashes-of-the-ancients/missions/resolution/dialogue.json";
import mission20RewardsDocument from "../content/ashes-of-the-ancients/missions/resolution/rewards.json";
import { buildCampaignCatalog } from "./build-campaign-catalog";
import {
  loadCampaignDefinition,
  loadDialogueBundle,
  loadMissionContent,
  loadRewardBundle
} from "./campaign-content-loader";
import { StaticCampaignContentRegistry } from "../registry/static-campaign-content-registry";

export const ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID: CampaignId = "ashes-of-the-ancients";

export const AOTA_CAMPAIGN_DEFINITION = loadCampaignDefinition(
  campaignDocument as unknown,
  "content/ashes-of-the-ancients/campaign.json"
);

export const AOTA_CAMPAIGN_MISSIONS = [
  loadMissionContent(mission01Document as unknown, "content/ashes-of-the-ancients/missions/dreams/mission.json"),
  loadMissionContent(
    mission02Document as unknown,
    "content/ashes-of-the-ancients/missions/cyclops-and-sheep/mission.json"
  ),
  loadMissionContent(
    mission03Document as unknown,
    "content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/mission.json"
  ),
  loadMissionContent(
    mission04Document as unknown,
    "content/ashes-of-the-ancients/missions/slingshooters-and-wolves/mission.json"
  ),
  loadMissionContent(
    mission05Document as unknown,
    "content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/mission.json"
  ),
  loadMissionContent(
    mission06Document as unknown,
    "content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/mission.json"
  ),
  loadMissionContent(mission07Document as unknown, "content/ashes-of-the-ancients/missions/we-had-enough/mission.json"),
  loadMissionContent(
    mission08Document as unknown,
    "content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/mission.json"
  ),
  loadMissionContent(
    mission09Document as unknown,
    "content/ashes-of-the-ancients/missions/the-first-and-last-dinner/mission.json"
  ),
  loadMissionContent(mission10Document as unknown, "content/ashes-of-the-ancients/missions/the-siege/mission.json"),
  loadMissionContent(mission11Document as unknown, "content/ashes-of-the-ancients/missions/time-rush/mission.json"),
  loadMissionContent(
    mission12Document as unknown,
    "content/ashes-of-the-ancients/missions/joining-crystal/mission.json"
  ),
  loadMissionContent(
    mission13Document as unknown,
    "content/ashes-of-the-ancients/missions/mobster-or-friend/mission.json"
  ),
  loadMissionContent(
    mission14Document as unknown,
    "content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/mission.json"
  ),
  loadMissionContent(mission15Document as unknown, "content/ashes-of-the-ancients/missions/cult-wars/mission.json"),
  loadMissionContent(mission16Document as unknown, "content/ashes-of-the-ancients/missions/the-volcano/mission.json"),
  loadMissionContent(mission17Document as unknown, "content/ashes-of-the-ancients/missions/the-betrayal/mission.json"),
  loadMissionContent(
    mission18Document as unknown,
    "content/ashes-of-the-ancients/missions/undead-and-cursed-lands/mission.json"
  ),
  loadMissionContent(mission19Document as unknown, "content/ashes-of-the-ancients/missions/end-game/mission.json"),
  loadMissionContent(mission20Document as unknown, "content/ashes-of-the-ancients/missions/resolution/mission.json")
] as const;

export const AOTA_CAMPAIGN_DIALOGUE = [
  loadDialogueBundle(
    mission01DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/dreams/dialogue.json"
  ),
  loadDialogueBundle(
    mission02DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/cyclops-and-sheep/dialogue.json"
  ),
  loadDialogueBundle(
    mission03DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/dialogue.json"
  ),
  loadDialogueBundle(
    mission04DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/slingshooters-and-wolves/dialogue.json"
  ),
  loadDialogueBundle(
    mission05DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/dialogue.json"
  ),
  loadDialogueBundle(
    mission06DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/dialogue.json"
  ),
  loadDialogueBundle(
    mission07DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/we-had-enough/dialogue.json"
  ),
  loadDialogueBundle(
    mission08DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/dialogue.json"
  ),
  loadDialogueBundle(
    mission09DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-first-and-last-dinner/dialogue.json"
  ),
  loadDialogueBundle(
    mission10DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-siege/dialogue.json"
  ),
  loadDialogueBundle(
    mission11DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/time-rush/dialogue.json"
  ),
  loadDialogueBundle(
    mission12DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/joining-crystal/dialogue.json"
  ),
  loadDialogueBundle(
    mission13DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/mobster-or-friend/dialogue.json"
  ),
  loadDialogueBundle(
    mission14DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/dialogue.json"
  ),
  loadDialogueBundle(
    mission15DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/cult-wars/dialogue.json"
  ),
  loadDialogueBundle(
    mission16DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-volcano/dialogue.json"
  ),
  loadDialogueBundle(
    mission17DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-betrayal/dialogue.json"
  ),
  loadDialogueBundle(
    mission18DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/undead-and-cursed-lands/dialogue.json"
  ),
  loadDialogueBundle(
    mission19DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/end-game/dialogue.json"
  ),
  loadDialogueBundle(
    mission20DialogueDocument as unknown,
    "content/ashes-of-the-ancients/missions/resolution/dialogue.json"
  )
] as const;

export const AOTA_CAMPAIGN_REWARDS = [
  loadRewardBundle(mission01RewardsDocument as unknown, "content/ashes-of-the-ancients/missions/dreams/rewards.json"),
  loadRewardBundle(
    mission02RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/cyclops-and-sheep/rewards.json"
  ),
  loadRewardBundle(
    mission03RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/snow-wendigo-and-fire/rewards.json"
  ),
  loadRewardBundle(
    mission04RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/slingshooters-and-wolves/rewards.json"
  ),
  loadRewardBundle(
    mission05RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/owl-and-skaduwee-crystal/rewards.json"
  ),
  loadRewardBundle(
    mission06RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/sand-dunes-and-tivara-crystal/rewards.json"
  ),
  loadRewardBundle(
    mission07RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/we-had-enough/rewards.json"
  ),
  loadRewardBundle(
    mission08RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/sailing-towards-the-new-future/rewards.json"
  ),
  loadRewardBundle(
    mission09RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-first-and-last-dinner/rewards.json"
  ),
  loadRewardBundle(
    mission10RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-siege/rewards.json"
  ),
  loadRewardBundle(
    mission11RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/time-rush/rewards.json"
  ),
  loadRewardBundle(
    mission12RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/joining-crystal/rewards.json"
  ),
  loadRewardBundle(
    mission13RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/mobster-or-friend/rewards.json"
  ),
  loadRewardBundle(
    mission14RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-volcano-is-getting-angry/rewards.json"
  ),
  loadRewardBundle(
    mission15RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/cult-wars/rewards.json"
  ),
  loadRewardBundle(
    mission16RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-volcano/rewards.json"
  ),
  loadRewardBundle(
    mission17RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/the-betrayal/rewards.json"
  ),
  loadRewardBundle(
    mission18RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/undead-and-cursed-lands/rewards.json"
  ),
  loadRewardBundle(mission19RewardsDocument as unknown, "content/ashes-of-the-ancients/missions/end-game/rewards.json"),
  loadRewardBundle(
    mission20RewardsDocument as unknown,
    "content/ashes-of-the-ancients/missions/resolution/rewards.json"
  )
] as const;

export const AOTA_CAMPAIGN_CONTENT_REGISTRY = new StaticCampaignContentRegistry(
  [AOTA_CAMPAIGN_DEFINITION],
  AOTA_CAMPAIGN_MISSIONS,
  AOTA_CAMPAIGN_DIALOGUE,
  AOTA_CAMPAIGN_REWARDS
);

export const AOTA_CAMPAIGN_CATALOG = buildCampaignCatalog(AOTA_CAMPAIGN_DEFINITION, AOTA_CAMPAIGN_MISSIONS);
