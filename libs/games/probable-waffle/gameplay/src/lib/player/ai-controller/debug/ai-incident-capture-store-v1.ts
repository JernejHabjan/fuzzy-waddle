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

  constructor(
    private readonly policy: Pick<
      AiReproCapturePolicyV1,
      "maxRetainedIncidentBundles" | "sessionQuotaBytes"
    > = AI_REPRO_CAPTURE_POLICY_V1
  ) {}

  addAutomatic(
    causalEpisodeId: string,
    bundle: AiReproBundleV1
  ): "captured" | "episode_already_captured" | "quota_exceeded" {
    if (this.capturedEpisodes.has(causalEpisodeId)) return "episode_already_captured";
    const byteLength = new TextEncoder().encode(JSON.stringify(bundle)).byteLength;
    const retainedBytes = this.entries.reduce((total, entry) => total + entry.byteLength, 0);
    if (byteLength + retainedBytes > this.policy.sessionQuotaBytes) return "quota_exceeded";
    this.capturedEpisodes.add(causalEpisodeId);
    this.entries.push({ causalEpisodeId, bundle: structuredClone(bundle), byteLength });
    while (this.entries.length > this.policy.maxRetainedIncidentBundles) this.entries.shift();
    return "captured";
  }

  snapshot(): readonly AiIncidentCaptureEntryV1[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  dispose(): void {
    this.entries.length = 0;
    this.capturedEpisodes.clear();
  }
}
