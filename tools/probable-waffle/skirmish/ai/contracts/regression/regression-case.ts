/** One diagnostic variant or a complete explicitly selected scenario family. */
export interface RegressionCase {
  caseId: string;
  scenarioId: string;
  variantId?: string;
  repetition?: number;
  family?: boolean;
  variants?: { variantId: string; repetitions: number }[];
  estimatedWallMs: number;
  fixtureReference?: string;
  covers: string;
  evidence?: {
    reportId: string;
    status: string;
    scenarioId: string;
    variantId: string;
    sourceRevision: string;
    dirtySourceDigest: string | null;
    fixtureDigest: string;
  }[];
}
