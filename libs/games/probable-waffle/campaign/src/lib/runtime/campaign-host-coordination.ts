export interface CampaignHostSaveRequest {
  readonly requesterPlayerNumber: number;
  readonly kind: "manual" | "checkpoint";
  readonly stable: boolean;
  readonly checkpointId?: string;
}

export interface CampaignHostSaveDecision {
  readonly accepted: boolean;
  readonly coordinatingHostPlayerNumber: number;
  readonly reason?: string;
}

export abstract class CampaignHostCoordinationPort {
  abstract hostPlayerNumber(): number;
  abstract authorizeSave(request: CampaignHostSaveRequest): CampaignHostSaveDecision;
  abstract hostMigrated(playerNumber: number): void;
}

/** Single-player uses the same host contract as future co-op without a network dependency. */
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
    if (!Number.isSafeInteger(playerNumber) || playerNumber < 1) throw new Error("Campaign host player number is invalid");
    this.host = playerNumber;
  }
}
