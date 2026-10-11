import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { beginAiResourceDecision, beginAiResourceInputRead, fenceAiResourceNeed } from "../observation/ai-resource-input-observation";
import { readAiResourceInputRead } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-resource-input-observation";
import type { AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import { AiRuntimeResourceInputCapture } from "./ai-runtime-resource-input-capture";
import { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";

describe("exact consumed resource input boundary", () => {
  it("snapshots claims once at read begin and never substitutes claims selected before read finish", () => {
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    Object.defineProperty(player, "playerNumber", { value: 2 });
    const scene = { players: [player] } as ProbableWaffleScene, facts: AiRuntimeProductionFactV1[] = [];
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 100, captureSequence: facts.length }));
    const claims = new AiRuntimeUnspentClaims(), { decision } = unspentClaimFixture();
    claims.observeDecision({ ...decision, acceptedIntents: [], decisions: [], reservations: [] });
    const snapshot = jest.fn((number: number) => claims.snapshot(number));
    const capture = new AiRuntimeResourceInputCapture(scene, coverage, () => undefined, () => facts.length,
      (playerNumber) => ({ tick: 100, sequence: 0, playerNumber }),
      (fact) => facts.push({ ...fact, sequence: facts.length + 1 }), snapshot);
    const finish = beginAiResourceInputRead(scene, player);
    claims.observeDecision(decision);
    const observation = { generation: 7, resources: [] } as unknown as AiObservationV1;
    finish?.(observation);
    expect(snapshot).toHaveBeenCalledTimes(1);
    expect(facts[0]).toMatchObject({ kind: "resource_input_read", unspentClaimsAtRead: { resources: { food: 0 }, gaps: [] } });
    expect(claims.snapshot(2).resources?.food).toBe(35);
    expect(readAiResourceInputRead(observation)?.sequence).toBe(1);
    capture.dispose();
  });

  it("loses history on a failed claims snapshot without throwing into the native input caller", () => {
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    Object.defineProperty(player, "playerNumber", { value: 2 });
    const scene = { players: [player] } as ProbableWaffleScene;
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: 0 })), append = jest.fn();
    const capture = new AiRuntimeResourceInputCapture(scene, coverage, () => undefined, () => 0,
      (playerNumber) => ({ tick: 0, sequence: 0, playerNumber }), append,
      () => { throw new Error("snapshot"); });
    expect(beginAiResourceInputRead(scene, player)).toBeUndefined();
    expect(coverage.read().losses).toContain("resource_input_reader_failed");
    expect(append).not.toHaveBeenCalled(); capture.dispose();
  });
  it("carries only the actual observed identity and closes at a pre-mutation controller fence", () => {
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    Object.defineProperty(player, "playerNumber", { value: 1 });
    const scene = { players: [player] } as ProbableWaffleScene;
    const facts: AiRuntimeProductionFactV1[] = [];
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
    const capture = new AiRuntimeResourceInputCapture(scene, coverage, () => undefined, () => facts.length,
      (playerNumber) => ({ tick: 0, sequence: 0, playerNumber }),
      (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
    const observation = { generation: 7, resources: [] } as unknown as AiObservationV1;
    beginAiResourceInputRead(scene, player)?.(observation);
    expect(readAiResourceInputRead(observation)).toMatchObject({ sequence: 1, generation: 7, playerNumber: 1 });
    expect(readAiResourceInputRead(structuredClone(observation))).toBeUndefined();
    beginAiResourceDecision(scene, 1, observation);
    expect(facts.at(-1)).toMatchObject({ kind: "resource_need_fence", reason: "controller_decision_started",
      incomingRead: readAiResourceInputRead(observation) });
    beginAiResourceDecision(scene, 1, structuredClone(observation));
    expect(facts.at(-1)).not.toHaveProperty("incomingRead");
    fenceAiResourceNeed(scene, 1, "controller_brain_replaced");
    expect(facts.at(-1)).toMatchObject({ kind: "resource_need_fence", sequence: 4, reason: "controller_brain_replaced" });
    const finish = beginAiResourceInputRead(scene, player);
    fenceAiResourceNeed(scene, 1, "controller_disabled");
    const later = { ...observation, generation: 8 };
    finish?.(later);
    expect(readAiResourceInputRead(later)).toBeUndefined();
    expect(coverage.read().losses).toContain("resource_input_read_interfered");
    capture.dispose();
    expect(beginAiResourceInputRead(scene, player)).toBeUndefined();
  });
});
