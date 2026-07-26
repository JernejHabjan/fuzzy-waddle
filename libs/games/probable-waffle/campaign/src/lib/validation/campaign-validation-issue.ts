/**
 * Defines the structured campaign validation issue contract for this module. Its declared surface makes source
 * path, json path, code, message explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignValidationIssue {
  /**
   * string source path carried by {@link CampaignValidationIssue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly sourcePath: string;
  /**
   * string json path carried by {@link CampaignValidationIssue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly jsonPath: string;
  /**
   * string code carried by {@link CampaignValidationIssue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly code: string;
  /**
   * string message carried by {@link CampaignValidationIssue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly message: string;
}

/**
 * Defines the structured campaign validation result contract for this module. Its declared surface makes
 * valid, issues explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignValidationResult {
  /**
   * valid value carried by {@link CampaignValidationResult}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly valid: boolean;
  /**
   * boolean policy/value on {@link CampaignValidationResult} that explicitly controls whether the associated
   * behavior is active; do not infer it from unrelated state.
   */
  readonly issues: readonly CampaignValidationIssue[];
}
