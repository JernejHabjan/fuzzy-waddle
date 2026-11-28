import { AI_RUNTIME_PROPOSAL_ORDER_EVENT, type AiRuntimeProposalOrder } from "../controls/ai-runtime-proposal-order";
import { AI_RUNTIME_RECOVERY_SETUP_EVENT, type AiRuntimeRecoverySetup } from "../../harness/controls/ai-runtime-recovery-setup";
import { AI_RUNTIME_BRAIN_FAULT_EVENT, type AiRuntimeBrainFaultEvent } from "../../harness/controls/create-ai-runtime-brain-hooks";
import type { ProbableWaffleScene } from "../../../../../core/probable-waffle.scene";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../../../commands/ai-decision-dispatch-event";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "../../presets/controls/ai-runtime-preset-control-event";
import type { AiRuntimeUnspentClaims } from "../claims/ai-runtime-unspent-claims";
import type { AiRuntimeProductionFact } from "../../production/lifecycle/ai-runtime-production-fact";
import type { AiRuntimeTacticalBoundary } from "../../combat/ai-runtime-tactical-boundary";
import { captureAiRuntimeTacticalBoundary } from "../../combat/capture-ai-runtime-tactical-boundary";
import { AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, type AiRuntimeAuthorityDelivery } from "../controls/ai-runtime-authority-delivery";

/** Existing root-capture listeners retain selection-before-dispatch order and detach as one owned subscription. */
export function installAiRuntimeDecisionCapture(
  scene: ProbableWaffleScene, claims: AiRuntimeUnspentClaims,
  boundary: (player: number) => Pick<AiRuntimeProductionFact, "sequence" | "tick" | "playerNumber">,
  append: (fact: AiRuntimeProductionFact) => void, lose: (reason: string) => void, combat: boolean
): () => void {
  let active = true;
  const control = (value: AiRuntimePresetControlEvent) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "preset_control", control: value });
  };
  const delivery = (value: AiRuntimeAuthorityDelivery) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "authority_delivery", delivery: value });
  };
  const brainFault = (value: AiRuntimeBrainFaultEvent) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "brain_fault", fault: value });
  };
  const recoverySetup = (value: AiRuntimeRecoverySetup) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "recovery_setup", recovery: value });
  };
  const proposalOrder = (value: AiRuntimeProposalOrder) => {
    if (active) append({ ...boundary(value.playerNumber), kind: "proposal_order", order: value });
  };
  const decision = (value: AiDecisionDispatchEvent) => {
    if (!active) return;
    const unspentClaimsBeforeSelection = claims.snapshot(value.identity.playerNumber);
    claims.observeDecision(value);
    let tacticalBoundary: AiRuntimeTacticalBoundary | undefined;
    if (combat) {
      try { tacticalBoundary = captureAiRuntimeTacticalBoundary(scene, value); }
      catch (error: unknown) {
        const detail = error instanceof Error ? `${error.name}:${error.message}` : typeof error;
        lose(`tactical_boundary_reader_failed:${detail.replace(/[\r\n\t]/g, " ").slice(0, 160)}`);
      }
    }
    append({ ...boundary(value.identity.playerNumber), kind: "decision_selected", decision: value,
      ...(tacticalBoundary ? { tacticalBoundary } : {}), unspentClaimsBeforeSelection });
  };
  scene.events.on(AI_RUNTIME_PRESET_CONTROL_EVENT, control);
  scene.events.on(AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, delivery);
  scene.events.on(AI_DECISION_DISPATCH_EVENT, decision);
  scene.events.on(AI_RUNTIME_BRAIN_FAULT_EVENT, brainFault);
  scene.events.on(AI_RUNTIME_RECOVERY_SETUP_EVENT, recoverySetup);
  scene.events.on(AI_RUNTIME_PROPOSAL_ORDER_EVENT, proposalOrder);
  return () => {
    active = false;
    scene.events.off(AI_RUNTIME_PRESET_CONTROL_EVENT, control);
    scene.events.off(AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, delivery);
    scene.events.off(AI_DECISION_DISPATCH_EVENT, decision);
    scene.events.off(AI_RUNTIME_BRAIN_FAULT_EVENT, brainFault);
    scene.events.off(AI_RUNTIME_RECOVERY_SETUP_EVENT, recoverySetup);
    scene.events.off(AI_RUNTIME_PROPOSAL_ORDER_EVENT, proposalOrder);
  };
}
