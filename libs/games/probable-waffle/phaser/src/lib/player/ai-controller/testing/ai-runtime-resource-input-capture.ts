import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { installAiResourceInputObserver } from "../observation/ai-resource-input-observation";
import { rememberAiResourceInputRead } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-resource-input-observation";
import type { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";

/** Bind the actual resource/obligation read to the ordered root journal, independently of later decision/save views. */
export class AiRuntimeResourceInputCapture {
  private readonly release: () => void;

  constructor(scene: ProbableWaffleScene, coverage: AiRuntimeResourceCoverageCapture, reconcile: () => void,
    frontier: () => number, boundary: (playerNumber: number) => { tick: number; sequence: number; playerNumber: number },
    append: (fact: AiRuntimeProductionFactV1) => void) {
    this.release = installAiResourceInputObserver(scene, {
      fence: (playerNumber, reason) => {
        if (playerNumber === undefined) { coverage.lose("resource_need_player_missing"); return; }
        try { append({ ...boundary(playerNumber), kind: "resource_need_fence", reason }); }
        catch { coverage.lose("resource_need_fence_append_failed"); }
      },
      begin: (player) => {
        try {
          reconcile();
          const playerNumber = player.playerNumber;
          if (playerNumber === undefined || !scene.players.includes(player)) {
            coverage.lose("resource_input_player_missing"); return undefined;
          }
          const installed = coverage.read();
          const beforeSequence = frontier();
          return (observation) => {
            try {
              reconcile();
              const terminal = coverage.read();
              if (frontier() !== beforeSequence || installed.lossEpoch !== terminal.lossEpoch || terminal.lost) {
                coverage.lose("resource_input_read_interfered"); return;
              }
              const read = { captureEpoch: installed.captureEpoch, lossEpoch: installed.lossEpoch,
                sequence: beforeSequence + 1, playerNumber, generation: observation.generation };
              append({ ...boundary(playerNumber), kind: "resource_input_read", read, resources: observation.resources });
              if (frontier() !== read.sequence || coverage.read().lost) return;
              rememberAiResourceInputRead(observation, read);
            } catch { coverage.lose("resource_input_append_failed"); }
          };
        } catch { coverage.lose("resource_input_reader_failed"); return undefined; }
      }
    });
  }

  dispose(): void { this.release(); }
}
