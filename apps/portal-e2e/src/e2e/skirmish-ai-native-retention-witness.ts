import type { Page } from "@playwright/test";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { CommandBusService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/multiplayer/command-bus.service";
import type { SimulationTickService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/simulation-tick.service";

/** Count genuine native admissions/completions, including synchronous completion before a later command observer runs. */
export async function installNativeRetentionWitness(page: Page, humanPlayerNumber: number) {
  await page.evaluate((playerNumber) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game">;
      __nativeRetentionWitness?: { arm(target: number): void; resume(): void; read(): {
        admitted: number; completed: number; failed: number; duplicateCompletions: number;
        firstId: string | null; lastId: string | null; lastSequence: number; tick: number; playerNumber: number;
        admittedDigest: string } } };
    if (realm.__nativeRetentionWitness) throw new Error("native_retention_witness_already_installed");
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const bus = services.find((entry): entry is CommandBusService => "dispatch" in entry && "getAuthorityState" in entry);
    const clock = services.find((entry): entry is SimulationTickService => "currentTick" in entry && "pauseTick" in entry);
    if (!scene || !bus || !clock) throw new Error("native_retention_witness_services_missing");
    const admitted = new Set<string>(), completed = new Set<string>(), failed = new Set<string>();
    const admittedDigest = () => {
      const text = JSON.stringify([...admitted]);
      let hash = 0x811c9dc5;
      for (let position = 0; position < text.length; position++) hash = Math.imul(hash ^ text.charCodeAt(position), 0x01000193);
      return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
    };
    let target = Infinity, duplicateCompletions = 0, firstId: string | null = null, lastId: string | null = null, lastSequence = -1;
    const commandSubscription = bus.command$.subscribe((command) => {
      if (command.type !== "SET_RALLY_POINT" || command.playerNumber !== playerNumber || command.execution?.source !== "human") return;
      if (admitted.size >= 4096) throw new Error("native_retention_admission_witness_overflow");
      const id = command.execution.commandId;
      admitted.add(id); firstId ??= id; lastId = id; lastSequence = command.execution.sequence;
    });
    const outcomeSubscription = bus.commandOutcome$.subscribe((outcome) => {
      if (outcome.playerNumber !== playerNumber) return;
      if (outcome.kind === "completed" && outcome.reason === "applied" && outcome.worldLinkIds.includes("rally-point")) {
        if (completed.size >= 4096) throw new Error("native_retention_completion_witness_overflow");
        if (completed.has(outcome.commandId)) duplicateCompletions++;
        completed.add(outcome.commandId);
        if (completed.size >= target) clock.pauseTick("manual");
      } else if (["failed", "rejected"].includes(outcome.kind)) {
        if (failed.size >= 4096) throw new Error("native_retention_rejection_witness_overflow");
        failed.add(outcome.commandId);
      }
    });
    realm.__nativeRetentionWitness = {
      arm: (next) => {
        if (!Number.isSafeInteger(next) || next < 1 || next > 4096 || next <= completed.size)
          throw new Error("native_retention_witness_target_invalid");
        target = next;
      },
      resume: () => { clock.resumeTick("manual"); scene.game.loop.wake(); },
      read: () => ({ admitted: admitted.size, completed: [...admitted].filter((id) => completed.has(id)).length,
        failed: [...admitted].filter((id) => failed.has(id)).length, duplicateCompletions, firstId, lastId, lastSequence,
        tick: clock.currentTick, playerNumber, admittedDigest: admittedDigest() })
    };
    scene.events.once("shutdown", () => {
      commandSubscription.unsubscribe(); outcomeSubscription.unsubscribe();
      admitted.clear(); completed.clear(); failed.clear(); delete realm.__nativeRetentionWitness;
    });
  }, humanPlayerNumber);
}

export async function nativeRetentionWitnessAction(page: Page, target?: number, resume = false) {
  return page.evaluate(({ target, resume }) => {
    const witness = (window as unknown as { __nativeRetentionWitness?: { arm(target: number): void; resume(): void; read(): {
      admitted: number; completed: number; failed: number; duplicateCompletions: number;
      firstId: string | null; lastId: string | null; lastSequence: number; tick: number; playerNumber: number;
      admittedDigest: string } } }).__nativeRetentionWitness;
    if (!witness) throw new Error("native_retention_witness_missing");
    if (target !== undefined) witness.arm(target);
    if (resume) witness.resume();
    return witness.read();
  }, { target, resume });
}
