import { EventEmitter } from "node:events";
import type { ProbableWaffleScene } from "../../../../../core/probable-waffle.scene";
import type { AiIntent } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiProposalManager, AiManagerProposal } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/coordination/ai-manager-proposal";
import { createAiProductionPolicyFixture } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/fixtures/production/ai-production-policy-fixture";
import { readAiRuntimeBrowserTestConfig } from "../../browser/ai-runtime-browser-test-config";
import { createAiRuntimeBrainHooks, AI_RUNTIME_BRAIN_FAULT_EVENT } from "./create-ai-runtime-brain-hooks";
import { AI_RUNTIME_PROPOSAL_ORDER_EVENT } from "../../authority/controls/ai-runtime-proposal-order";

jest.mock("../../browser/ai-runtime-browser-test-config", () => ({ readAiRuntimeBrowserTestConfig: jest.fn() }));
jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
beforeAll(() => {
  if (!originalWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
});
afterAll(() => {
  if (!originalWindow) Reflect.deleteProperty(globalThis, "window");
});

function intent(id: string): AiIntent {
  return { kind: "stop", intentId: `intent:${id}`, effectId: `effect:${id}`, planId: "plan:opening", demandId: null,
    lane: "essential_economy", proposedTick: 200, urgencyClass: 1, utility: 900,
    preconditions: [], claims: [], actorIds: [id], reasonCode: "native-proposer-result" };
}

it("reverses real emitted batches once per invocation and records only one bounded identity sample per manager", () => {
  const f = createAiProductionPolicyFixture(), events = new EventEmitter();
  (readAiRuntimeBrowserTestConfig as jest.Mock).mockReturnValue({ presetWorld: { proposalOrder: "reverse" } });
  const observer = jest.fn();
  events.on(AI_RUNTIME_PROPOSAL_ORDER_EVENT, observer);
  const batch: AiManagerProposal = { managerId: "macro", lane: "essential_economy", evaluated: true,
    intents: [intent("a"), intent("b")], reasons: [] };
  const manager: AiProposalManager = { managerId: "macro", propose: jest.fn(() => batch) };
  const hooks = createAiRuntimeBrainHooks({ events } as unknown as ProbableWaffleScene, 2);
  expect(hooks?.propose?.(manager, f.observation, f.state).intents).toEqual([...batch.intents].reverse());
  expect(hooks?.propose?.(manager, f.observation, f.state).intents).toEqual([...batch.intents].reverse());
  expect(observer).toHaveBeenCalledTimes(1);
  expect(batch.intents.map((entry) => entry.intentId)).toEqual(["intent:a", "intent:b"]);
  events.emit("shutdown");
  expect(hooks?.propose?.(manager, f.observation, f.state)).toBe(batch);
  expect(observer).toHaveBeenCalledTimes(1);
  expect(manager.propose).toHaveBeenCalledTimes(3);
});

it("never invents an intent when a selected NaN boundary has no real output", () => {
  const f = createAiProductionPolicyFixture(), events = new EventEmitter(), observed = jest.fn();
  (readAiRuntimeBrowserTestConfig as jest.Mock).mockReturnValue({ presetWorld: {
    brainFault: { kind: "nan", playerNumber: 2, fromTick: 200, throughTick: 800 }
  } });
  events.on(AI_RUNTIME_BRAIN_FAULT_EVENT, observed);
  const manager: AiProposalManager = { managerId: "macro", propose: () => ({
    managerId: "macro", lane: "essential_economy", evaluated: true, intents: [], reasons: []
  }) };
  const hooks = createAiRuntimeBrainHooks({ events } as unknown as ProbableWaffleScene, 2);
  expect(hooks?.propose?.(manager, f.observation, f.state).intents).toEqual([]);
  expect(observed).not.toHaveBeenCalled();
});
