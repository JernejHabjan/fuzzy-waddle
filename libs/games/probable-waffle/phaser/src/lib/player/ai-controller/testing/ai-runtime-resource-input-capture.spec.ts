import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { beginAiResourceInputRead, fenceAiResourceNeed } from "../observation/ai-resource-input-observation";
import { readAiResourceInputRead } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-resource-input-observation";
import type { AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import { AiRuntimeResourceInputCapture } from "./ai-runtime-resource-input-capture";

describe("exact consumed resource input boundary", () => {
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
    fenceAiResourceNeed(scene, 1, "controller_brain_replaced");
    expect(facts.at(-1)).toMatchObject({ kind: "resource_need_fence", sequence: 2, reason: "controller_brain_replaced" });
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
