import type {
  CampaignMissionId,
  CampaignProfile,
  CampaignProfileData,
  CampaignVictoryCommitResponse
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignResultDto, StartCampaignRunDto } from "./campaign.dto";

/** Defines the campaign profile server service interface contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface CampaignProfileServerServiceInterface {
  /**
   * operation exposed by {@link CampaignProfileServerServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  profile(userId: string): Promise<CampaignProfileData>;
  /**
   * operation exposed by {@link CampaignProfileServerServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  updateProfile(userId: string, baseProfileRevision: number, profile: CampaignProfile): Promise<CampaignProfileData>;
  /**
   * operation exposed by {@link CampaignProfileServerServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  start(userId: string, request: StartCampaignRunDto): Promise<void>;
  /**
   * operation exposed by {@link CampaignProfileServerServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  result(userId: string, result: CampaignResultDto): Promise<CampaignVictoryCommitResponse>;
  /**
   * operation exposed by {@link CampaignProfileServerServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  merge(
    userId: string,
    profile: CampaignProfile,
    completions: Array<{ missionId: CampaignMissionId; completedAt: string }>
  ): Promise<CampaignProfileData>;
}

/**
 * Defines the campaign server service interface alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignServerServiceInterface = CampaignProfileServerServiceInterface;
