import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";
import type { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeTacticalBoundaryV1 } from "./ai-runtime-tactical-boundary-v1";
import { captureAiRuntimeTacticalBoundary } from "./capture-ai-runtime-tactical-boundary";

/** Existing root-capture listeners retain selection-before-dispatch order and detach as one owned subscription. */
export function installAiRuntimeDecisionCapture(
  scene: ProbableWaffleScene, claims: AiRuntimeUnspentClaims,
  boundary: (player: number) => Pick<AiRuntimeProductionFactV1, "sequence" | "tick" | "playerNumber">,
  append: (fact: AiRuntimeProductionFactV1) => void, lose: (reason: string) => void, combat: boolean
): () => void {
  let active = true;
  const control = (value: AiRuntimePresetControlEvent) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "preset_control", control: value });
  };
  const decision = (value: AiDecisionDispatchEvent) => {
    if (!active) return;
    const unspentClaimsBeforeSelection = claims.snapshot(value.identity.playerNumber);
    claims.observeDecision(value);
    let tacticalBoundary: AiRuntimeTacticalBoundaryV1 | undefined;
    if (combat) {
      try { tacticalBoundary = captureAiRuntimeTacticalBoundary(scene, value); }
      catch { lose("tactical_boundary_reader_failed"); }
    }
    append({ ...boundary(value.identity.playerNumber), kind: "decision_selected", decision: value,
      ...(tacticalBoundary ? { tacticalBoundary } : {}), unspentClaimsBeforeSelection });
  };
  scene.events.on(AI_RUNTIME_PRESET_CONTROL_EVENT, control);
  scene.events.on(AI_DECISION_DISPATCH_EVENT, decision);
  return () => {
    active = false;
    scene.events.off(AI_RUNTIME_PRESET_CONTROL_EVENT, control);
    scene.events.off(AI_DECISION_DISPATCH_EVENT, decision);
  };
}
