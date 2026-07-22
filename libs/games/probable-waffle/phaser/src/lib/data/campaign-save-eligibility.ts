import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SaveGamePayload } from "./save-game-payload";
import { SimulationPauseReason } from "../world/services/simulation-tick.service";

export interface CampaignSaveEligibilityInput {
  readonly sceneActive: boolean;
  readonly sessionState: GameSessionState | undefined;
  readonly runtime: CampaignMissionRuntimeState | undefined;
  readonly pauseReasons: readonly SimulationPauseReason[];
  readonly request: Pick<SaveGamePayload, "kind" | "checkpointId">;
}

export type CampaignSaveEligibility =
  | { readonly eligible: true }
  | { readonly eligible: false; readonly reason: string };

const SERIALIZABLE_PAUSES = new Set<SimulationPauseReason>([
  SimulationPauseReason.Manual,
  SimulationPauseReason.Player,
  SimulationPauseReason.ExternalModal,
  SimulationPauseReason.CampaignCinematic
]);

/** Keeps save admission deterministic and separate from snapshot serialization. */
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
