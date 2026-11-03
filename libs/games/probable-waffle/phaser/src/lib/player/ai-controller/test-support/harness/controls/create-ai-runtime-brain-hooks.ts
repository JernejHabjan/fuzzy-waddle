import { environment } from "@fuzzy-waddle/environments/environment";
import type { ProbableWaffleScene } from "../../../../../core/probable-waffle.scene";
import type { AiBrainBoundaryHooks } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain-boundary-hooks";
import { projectAiDebugSnapshot } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/debug/project-ai-debug-snapshot";
import { readAiRuntimeBrowserTestConfig } from "../../browser/ai-runtime-browser-test-config";
import type { AiRuntimeBrainFault } from "../../authority/controls/ai-runtime-brain-fault";
import type { AiManagerProposal } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/coordination/ai-manager-proposal";
import { AI_RUNTIME_PROPOSAL_ORDER_EVENT, type AiRuntimeProposalOrder } from "../../authority/controls/ai-runtime-proposal-order";

export const AI_RUNTIME_BRAIN_FAULT_EVENT = "ai-runtime-brain-fault";

/** No ambient/global hook: the controller owns this finite wrapper, disposed with its brain/scene. */
export function createAiRuntimeBrainHooks(scene: ProbableWaffleScene, playerNumber: number | undefined): AiBrainBoundaryHooks | undefined {
  if (environment.production || typeof window === "undefined") return undefined;
  const preset = readAiRuntimeBrowserTestConfig()?.presetWorld, fault = preset?.brainFault, order = preset?.proposalOrder;
  if (playerNumber !== 2 || !fault && !order) return undefined;
  let active = true, emitted = 0;
  const recordedOwners = new Set<string>();
  scene.events.once("shutdown", () => { active = false; });
  const applies = (tick: number) => active && !!fault && tick >= fault.fromTick && tick <= fault.throughTick;
  const record = (tick: number, owner: string) => {
    if (!fault) throw new Error("ai_runtime_brain_fault_not_configured");
    if (++emitted > 128) throw new Error("ai_runtime_brain_fault_evidence_overflow");
    scene.events.emit(AI_RUNTIME_BRAIN_FAULT_EVENT, { tick, playerNumber: fault.playerNumber, owner, kind: fault.kind });
  };
  const ordered = (batch: AiManagerProposal, tick: number): AiManagerProposal => {
    if (!active || !order || batch.intents.length < 2) return batch;
    const before = batch.intents.map((intent) => intent.intentId);
    const intents = order === "reverse" ? [...batch.intents].reverse() : batch.intents;
    if (!recordedOwners.has(batch.managerId)) {
      if (before.length > 128 || recordedOwners.size >= 31) throw new Error("ai_runtime_proposal_order_evidence_overflow");
      recordedOwners.add(batch.managerId);
      scene.events.emit(AI_RUNTIME_PROPOSAL_ORDER_EVENT, { playerNumber: 2, tick, managerId: batch.managerId,
        order, before, after: intents.map((intent) => intent.intentId) } satisfies AiRuntimeProposalOrder);
    }
    return { ...batch, intents };
  };
  return {
    assertAuthority: (observation) => {
      if (fault?.kind !== "mandatory" || !applies(observation.tick)) return;
      record(observation.tick, "authority");
      throw new Error("ai_runtime_mandatory_fault");
    },
    propose: (manager, observation, state) => {
      // Macro owns native economy proposals. Corrupt its actual output, never manufacture a substitute intent.
      if (!fault || !applies(observation.tick) || !manager.managerId.includes("macro") ||
          fault.kind === "debug" || fault.kind === "mandatory") return ordered(manager.propose(observation, state), observation.tick);
      if (fault.kind === "throw") {
        record(observation.tick, manager.managerId);
        throw new Error("ai_runtime_optional_fault");
      }
      const batch = manager.propose(observation, state);
      const original = batch.intents.find((intent) => fault.kind === "nan" || intent.claims.some((claim) => claim.kind === "resource"));
      if (!original) return batch;
      record(observation.tick, manager.managerId);
      return { ...batch, intents: batch.intents.map((intent) => intent !== original ? intent : fault.kind === "nan"
        ? { ...intent, utility: Number.NaN } : { ...intent, claims: intent.claims.map((claim) =>
          claim.kind === "resource" ? { ...claim, amount: -1 } : claim) }) };
    },
    projectDebug: (observation, state, decisions, batches) => {
      if (fault?.kind === "debug" && applies(observation.tick)) {
        record(observation.tick, "debug_projection");
        throw new Error("ai_runtime_debug_fault");
      }
      return projectAiDebugSnapshot(observation, state, decisions, batches);
    }
  };
}

/** Explanatory injection record only; independent native application is still required by the scenario reader. */
export type AiRuntimeBrainFaultEvent = Readonly<{
  tick: number; playerNumber: number; owner: string; kind: AiRuntimeBrainFault["kind"];
}>;
