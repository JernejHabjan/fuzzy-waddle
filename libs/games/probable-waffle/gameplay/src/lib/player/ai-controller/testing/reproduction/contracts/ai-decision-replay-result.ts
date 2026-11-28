import type { AiBrainStepResult } from "../../../brain/ai-brain";
import type { AiReplayBlocker } from "./ai-replay-blocker";

/** Replay result never labels incomplete or changed-input data as exact reproduction. */
export type AiDecisionReplayResult =
  | { readonly status: "reproduced"; readonly result: AiBrainStepResult; readonly digest: string }
  | { readonly status: "blocked"; readonly blocker: AiReplayBlocker };
