import {
  AI_REPRO_CAPTURE_POLICY_V1,
  type AiReproBundleV1,
  type AiReproCapturePolicyV1
} from "../contracts/ai-repro-bundle-v1";

/** One bounded capture entry; unresolved authoritative commands are intentionally owned elsewhere. */
export interface AiIncidentCaptureEntryV1 {
  readonly causalEpisodeId: string;
  readonly bundle: AiReproBundleV1;
  readonly byteLength: number;
}

/** Session-local diagnostic quota with one automatic capture per causal episode. */
export class AiIncidentCaptureStoreV1 {
  private readonly entries: AiIncidentCaptureEntryV1[] = [];
  private readonly capturedEpisodes = new Set<string>();
  private sessionBytes = 0;
  private disposed = false;

  constructor(
    private readonly policy: Pick<
      AiReproCapturePolicyV1,
      "maxRetainedIncidentBundles" | "sessionQuotaBytes"
    > = AI_REPRO_CAPTURE_POLICY_V1
  ) {
    if (!Number.isSafeInteger(policy.sessionQuotaBytes) || policy.sessionQuotaBytes <= 0 ||
      policy.maxRetainedIncidentBundles !== 5) throw new Error("invalid_incident_capture_policy");
  }

  addAutomatic(
    causalEpisodeId: string,
    bundle: AiReproBundleV1
  ): "captured" | "episode_already_captured" | "quota_exceeded" {
    if (this.disposed) throw new Error("incident_capture_store_disposed");
    if (this.capturedEpisodes.has(causalEpisodeId)) return "episode_already_captured";
    const byteLength = new TextEncoder().encode(JSON.stringify(bundle)).byteLength;
    const chargedBytes = byteLength + new TextEncoder().encode(causalEpisodeId).byteLength;
    if (chargedBytes + this.sessionBytes > this.policy.sessionQuotaBytes) return "quota_exceeded";
    this.sessionBytes += chargedBytes;
    this.capturedEpisodes.add(causalEpisodeId);
    this.entries.push({ causalEpisodeId, bundle: structuredClone(bundle), byteLength });
    while (this.entries.length > this.policy.maxRetainedIncidentBundles) this.entries.shift();
    return "captured";
  }

  snapshot(): readonly AiIncidentCaptureEntryV1[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  /** Cumulative quota includes evicted episodes; eviction cannot buy another automatic capture. */
  metrics() {
    return { sessionBytes: this.sessionBytes, quotaBytes: this.policy.sessionQuotaBytes,
      retainedBytes: this.entries.reduce((sum, entry) => sum + entry.byteLength, 0),
      retainedCount: this.entries.length, episodeCount: this.capturedEpisodes.size, disposed: this.disposed };
  }

  dispose(): void {
    this.entries.length = 0;
    this.capturedEpisodes.clear();
    this.sessionBytes = 0;
    this.disposed = true;
  }
}
