/** Storage envelope only. Scenario-specific physical evidence is validated by its existing reader/oracle. */
export interface RuntimeArtifactDocument {
  [field: string]: unknown;
  schemaVersion?: number;
  sourceRevision?: string;
  fixtureDigest?: string;
  dirtySourceDigest?: string | null;
  status?: string;
  runtime?: RuntimeArtifactDocument;
  scenarios?: { [field: string]: unknown; variants: unknown[] }[];
  workCounts?: { scenarios: number; decisions: number; ticks: number };
  artifactEncoding?: string;
  artifactVariantFiles?: string[];
  artifactVariantSummaries?: { checkpoints: Record<string, unknown>[] }[];
  artifactVariants?: unknown[];
  __artifactSourcePath?: string;
}
