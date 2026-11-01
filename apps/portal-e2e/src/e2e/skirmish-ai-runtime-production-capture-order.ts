// prettier-ignore
import { AI_RUNTIME_MAX_FACTS } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/append-ai-runtime-production-fact";
// prettier-ignore
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-snapshot";

/** Preserves whole-capture order and overflow failures before exposing any normalized subset. */
export function runtimeProductionCaptureFailures(capture: AiRuntimeProductionSnapshot): string[] {
  const failures: string[] = [];
  if (
    capture.droppedFactCount ||
    capture.droppedSnapshotCount ||
    capture.facts.length > AI_RUNTIME_MAX_FACTS ||
    capture.snapshots.length > 256
  ) {
    failures.push("production_ai_capture_dropped");
  }
  if (
    capture.facts.some((fact, index) => {
      const previous = capture.facts[index - 1];
      return (
        fact.playerNumber !== capture.playerNumber ||
        !Number.isSafeInteger(fact.tick) ||
        fact.tick < capture.startedTick ||
        !Number.isSafeInteger(fact.sequence) ||
        fact.sequence <= 0 ||
        (index > 0 && (!previous || fact.sequence <= previous.sequence || fact.tick < previous.tick))
      );
    })
  ) {
    failures.push("production_ai_capture_order");
  }
  return failures;
}
