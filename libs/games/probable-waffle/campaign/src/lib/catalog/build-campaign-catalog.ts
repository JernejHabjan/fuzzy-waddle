import {
  CampaignAvailability,
  type CampaignCatalog,
  type CampaignChapterDefinition,
  CampaignContentType,
  type CampaignMissionDefinition,
  type CampaignMissionId
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";

/** Projects the declarative content authority into the legacy Angular catalogue contract. */
export function buildCampaignCatalog(
  campaign: CampaignDefinition,
  missionContent: readonly CampaignMissionContent[]
): CampaignCatalog {
  const missionsById = new Map<CampaignMissionId, CampaignMissionContent>();
  for (const mission of missionContent) {
    if (missionsById.has(mission.id)) throw new Error(`Duplicate campaign mission '${mission.id}'`);
    missionsById.set(mission.id, mission);
  }

  const chapters: CampaignChapterDefinition[] = campaign.chapters.map((chapter) => ({
    id: chapter.id,
    order: chapter.order,
    title: chapter.title,
    subtitle: chapter.subtitle,
    summary: chapter.summary,
    layout: chapter.layout,
    artwork: chapter.artwork,
    missionArtwork: chapter.missionArtwork,
    missions: chapter.missionIds.map((missionId) => toLegacyMission(chapter.id, missionId, missionsById))
  }));

  return { version: campaign.catalogueVersion, chapters };
}

function toLegacyMission(
  chapterId: CampaignChapterDefinition["id"],
  missionId: CampaignMissionId,
  missionsById: ReadonlyMap<CampaignMissionId, CampaignMissionContent>
): CampaignMissionDefinition {
  const mission = missionsById.get(missionId);
  if (!mission) throw new Error(`Campaign chapter '${chapterId}' references unknown mission '${missionId}'`);
  if (mission.chapterId !== chapterId) {
    throw new Error(`Campaign mission '${missionId}' belongs to '${mission.chapterId}', not '${chapterId}'`);
  }
  return {
    id: mission.id,
    chapterId: mission.chapterId,
    order: mission.catalogue.order,
    title: mission.catalogue.title,
    faction: mission.catalogue.faction,
    contentType: CampaignContentType.Mission,
    availability: mission.contentStatus === "skeleton" ? CampaignAvailability.Planned : CampaignAvailability.Playable,
    contentStatus: mission.contentStatus,
    prerequisites: [...mission.prerequisites],
    environment: mission.catalogue.environment,
    briefing: mission.catalogue.briefing,
    objectives: [...mission.catalogue.objectiveSummaries],
    mapKey: mission.mapKey
  };
}
