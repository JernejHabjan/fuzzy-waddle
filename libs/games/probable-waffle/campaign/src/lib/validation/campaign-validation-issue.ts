export interface CampaignValidationIssue {
  readonly sourcePath: string;
  readonly jsonPath: string;
  readonly code: string;
  readonly message: string;
}

export interface CampaignValidationResult {
  readonly valid: boolean;
  readonly issues: readonly CampaignValidationIssue[];
}
