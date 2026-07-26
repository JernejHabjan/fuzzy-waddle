/**
 * Defines the structured campaign host save request contract for this module. Its declared surface makes
 * requester player number, kind, stable, checkpoint id explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignHostSaveRequest {
  /**
   * numeric requester player number carried by {@link CampaignHostSaveRequest}. Its units and valid range are
   * defined by {@link CampaignHostSaveRequest} and must remain consistent across producers and consumers.
   */
  readonly requesterPlayerNumber: number;
  /**
   * discriminator for {@link CampaignHostSaveRequest}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "manual" | "checkpoint";
  /**
   * stable value carried by {@link CampaignHostSaveRequest}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly stable: boolean;
  /**
   * Optional stable checkpoint id used by {@link CampaignHostSaveRequest} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly checkpointId?: string;
}

/**
 * Defines the structured campaign host save decision contract for this module. Its declared surface makes
 * accepted, coordinating host player number, reason explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignHostSaveDecision {
  /**
   * accepted value carried by {@link CampaignHostSaveDecision}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly accepted: boolean;
  /**
   * numeric coordinating host player number carried by {@link CampaignHostSaveDecision}. Its units and valid
   * range are defined by {@link CampaignHostSaveDecision} and must remain consistent across producers and
   * consumers.
   */
  readonly coordinatingHostPlayerNumber: number;
  /**
   * Optional string reason carried by {@link CampaignHostSaveDecision}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly reason?: string;
}

export abstract class CampaignHostCoordinationPort {
  abstract hostPlayerNumber(): number;
  abstract authorizeSave(request: CampaignHostSaveRequest): CampaignHostSaveDecision;
  abstract hostMigrated(playerNumber: number): void;
}

/** Defines the local campaign host coordination port contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class LocalCampaignHostCoordinationPort extends CampaignHostCoordinationPort {
  private host = 1;

  hostPlayerNumber(): number {
    return this.host;
  }

  authorizeSave(request: CampaignHostSaveRequest): CampaignHostSaveDecision {
    if (!request.stable) {
      return {
        accepted: false,
        coordinatingHostPlayerNumber: this.host,
        reason: "Campaign saves require a shared stable point"
      };
    }
    return { accepted: true, coordinatingHostPlayerNumber: this.host };
  }

  hostMigrated(playerNumber: number): void {
    if (!Number.isSafeInteger(playerNumber) || playerNumber < 1)
      throw new Error("Campaign host player number is invalid");
    this.host = playerNumber;
  }
}
