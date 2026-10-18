import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SaveGamePayload } from "./save-game-payload";
import { SimulationPauseReason } from "../world/services/simulation-tick.service";

/**
 * Defines the structured campaign save eligibility input contract for this module. Its declared surface makes
 * scene active, session state, runtime, pause reasons, request explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignSaveEligibilityInput {
  /**
   * scene active value carried by {@link CampaignSaveEligibilityInput}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly sceneActive: boolean;
  /**
   * discriminator for {@link CampaignSaveEligibilityInput}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly sessionState: GameSessionState | undefined;
  /**
   * temporal value for {@link CampaignSaveEligibilityInput}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  readonly runtime: CampaignMissionRuntimeState | undefined;
  /**
   * collection value on {@link CampaignSaveEligibilityInput}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly pauseReasons: readonly SimulationPauseReason[];
  /**
   * request value carried by {@link CampaignSaveEligibilityInput}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly request: Pick<SaveGamePayload, "kind" | "checkpointId">;
}

/**
 * Defines the closed campaign save eligibility value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignSaveEligibility =
  | { readonly eligible: true }
  | { readonly eligible: false; readonly reason: string };

const SERIALIZABLE_PAUSES = new Set<SimulationPauseReason>([
  SimulationPauseReason.Manual,
  SimulationPauseReason.Player,
  SimulationPauseReason.ExternalModal,
  SimulationPauseReason.CampaignCinematic
]);

/** Documents the evaluate campaign save eligibility member and its declared contract at this boundary. */
export function evaluateCampaignSaveEligibility(input: CampaignSaveEligibilityInput): CampaignSaveEligibility {
  if (!input.sceneActive || input.sessionState !== GameSessionState.InProgress) {
    return { eligible: false, reason: "Saving is available only during an active mission." };
  }
  const unsafePause = input.pauseReasons.find((reason) => !SERIALIZABLE_PAUSES.has(reason));
  if (unsafePause) {
    return { eligible: false, reason: `Saving is unavailable while recovery is in progress (${unsafePause}).` };
  }
  if (input.request.kind === "autosave" && !input.request.checkpointId && input.pauseReasons.length > 0) {
    return { eligible: false, reason: "Automatic saving waits until simulation resumes." };
  }
  const runtime = input.runtime;
  if (!runtime) return { eligible: true };
  if (runtime.status !== "running") {
    return { eligible: false, reason: "The mission is being finalized and cannot be saved." };
  }
  if (runtime.integrity.diagnostic) {
    return { eligible: false, reason: "The campaign runtime must recover before it can be saved." };
  }
  const activeCinematic = runtime.activeCinematicId ? runtime.cinematics[runtime.activeCinematicId] : undefined;
  if (activeCinematic?.stage === "finalizing") {
    return { eligible: false, reason: "Saving is unavailable while a cinematic is being finalized." };
  }
  if (input.request.checkpointId && runtime.pendingEvents.length > 0) {
    return { eligible: false, reason: "The checkpoint will save after pending campaign actions settle." };
  }
  return { eligible: true };
}
