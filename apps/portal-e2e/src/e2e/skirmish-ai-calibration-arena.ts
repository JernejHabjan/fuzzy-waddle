import type { Page } from "@playwright/test";
import type Phaser from "phaser";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiBrainStateV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/ai-brain-state-v1";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";
import type { AiCalibrationJob } from "./skirmish-ai-calibration-job";

/** Read native services and advance whole frames with both actual controllers settled; retain only bounded metrics. */
export async function runCalibrationArena(page: Page, job: AiCalibrationJob) {
  return page.evaluate(async (job) => {
    type Controller = { player: { playerNumber?: number }; getBrainState?(): AiBrainStateV1;
      isDecisionBoundarySettled?(): boolean; stepInFlight?: boolean; telemetry?: { snapshot(): { frame: number } } };
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: { game: Phaser.Game };
      __nativeCalibrationLegacy?: { game: Phaser.Game } };
    const game = (job.revision === "candidate" ? realm.__fuzzyWaddleAiRuntimeBrowserTestV1 : realm.__nativeCalibrationLegacy)?.game;
    const scene = game?.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [], systems: readonly object[] =
      scene?.getSceneGameData().systems ?? [];
    const clock = services.find((entry): entry is { currentTick: number; pauseTick(reason: "manual"): void;
      resumeTick(reason: "manual"): void; setSimulationTimeScale(scale: number): void } => "pauseTick" in entry && "tick$" in entry);
    const handler = systems.find((entry): entry is { aiPlayerControllers: Controller[] } => "getAiPlayerController" in entry);
    const score = systems.find((entry): entry is { getScoreData(): Map<number, { gameResult: string;
      metrics: Record<string, number> }> } => "getScoreData" in entry && "calculateFinalScore" in entry);
    const hash = services.find((entry): entry is { captureAuthoritativeProjection?(scene: Phaser.Scene): {
      systems: Record<string, unknown> }; computeHashSnapshot?(scene: Phaser.Scene, diagnostics: boolean): { hash: string } } =>
      "captureAuthoritativeProjection" in entry || "computeHashSnapshot" in entry);
    const index = services.find((entry): entry is { getOwnedActors(player: number): Phaser.GameObjects.GameObject[] } =>
      "getOwnedActors" in entry && "getActorById" in entry);
    if (!game || !scene || !clock || !handler || !score || !hash || !index || clock.currentTick !== 0 ||
        handler.aiPlayerControllers.length !== 2) throw new Error("calibration_native_zero_tick_two_ai_boundary_missing");
    const controllers = handler.aiPlayerControllers;
    if (new Set(controllers.map((controller) => controller.player.playerNumber)).size !== 2 ||
        controllers.some((controller) => ![1, 2].includes(controller.player.playerNumber ?? -1)))
      throw new Error("calibration_duplicate_native_controller");
    const digest = (value: unknown) => {
      const text = JSON.stringify(value); let result = 0x811c9dc5;
      for (let i = 0; i < text.length; i++) result = Math.imul(result ^ text.charCodeAt(i), 0x01000193);
      return `fnv1a32:${(result >>> 0).toString(16).padStart(8, "0")}`;
    };
    const initialBanks = scene.players.map((player) => ({ player: player.playerNumber, resources: { ...player.getResources() } }));
    const projection = hash.captureAuthoritativeProjection?.(scene);
    let initialPhysicalDigest: string;
    if (projection) {
      const { aiControllers: _controllers, commandAuthority: _authority, ...systems } = projection.systems;
      initialPhysicalDigest = digest({ ...projection, systems });
    } else {
      if (!hash.computeHashSnapshot) throw new Error("calibration_pinned_native_hash_missing");
      initialPhysicalDigest = digest({ legacy: hash.computeHashSnapshot(scene, false).hash, initialBanks });
    }
    const failures = new Set<string>(), decisionCounts: Record<number, number> = { 1: 0, 2: 0 };
    const profiles: { target: string | null; targetArchetype: string | null; opponent: string | null;
      opponentArchetype: string | null } = { target: null, targetArchetype: null, opponent: null, opponentArchetype: null };
    const selected = (capture: AiRuntimeDecisionRepro) => {
      const number = capture.payload.observation.playerNumber;
      if (![1, 2].includes(number)) { failures.add("unexpected_ai_player"); return; }
      decisionCounts[number] = (decisionCounts[number] ?? 0) + 1;
      if (!capture.payload.expectedResult) failures.add("native_selected_result_missing");
      if (capture.profile.cheats || capture.profile.intentionalErrors) failures.add("unfair_native_profile");
      const archetype = capture.payload.priorState.opening.archetypeId;
      if (number === job.targetPlayerNumber) { profiles.target = capture.profile.difficulty; profiles.targetArchetype = archetype; }
      else { profiles.opponent = capture.profile.difficulty; profiles.opponentArchetype = archetype; }
    };
    scene.events.on("ai-runtime-decision-repro", selected);
    const nativePlayerSample = (controller: Controller) => {
      const number = controller.player.playerNumber, brain = controller.getBrainState?.();
      const player = scene.players.find((player) => player.playerNumber === number);
      if (Object.values(player?.getResources() ?? {}).some((value) => !Number.isFinite(value) || value < 0))
        failures.add("invalid_native_resource_balance");
      const actors = index.getOwnedActors(number ?? -1);
      const items = actors.flatMap((actor) => {
        const components = actor.getData("actorData")?.components as Map<unknown, object> | undefined;
        return [...(components?.values() ?? [])].flatMap((entry) => "allItems" in entry ?
          (entry as { allItems: { productionData?: unknown; researchData?: unknown }[] }).allItems : []);
      });
      return { number, bank: { ...player?.getResources() }, housing: { ...player?.playerState.data.housing },
        metrics: { ...score.getScoreData()?.get(number ?? -1)?.metrics }, ownedActors: actors.length,
        trainingItems: items.filter((item) => item.productionData).length,
        researchItems: items.filter((item) => item.researchData).length,
        reservations: brain?.reservations.length ?? null, pendingCommands: brain?.authority.pendingCommandIds.length ?? null,
        recovery: brain?.recovery.records.length ?? null,
        retryDebt: brain?.recovery.records.reduce((sum, row) => sum + row.attempt, 0) ?? null,
        noProgress: brain?.recovery.records.filter((row) =>
          row.lastProgressTick <= row.enteredTick && row.attempt > 0).length ?? null,
        stance: brain?.strategy.stance ?? null, strategyReason: brain?.strategy.assessment?.reason ?? null,
        commitmentDeadline: brain?.strategy.commitmentDeadline ?? null,
        missions: brain?.squads.length ?? null, workers: brain?.economyProduction.workforce?.workers ?? null,
        foodRunwayTicks: brain?.economyProduction.workforce?.foodRunwayTicks ?? null,
        counterEvidence: brain?.economyProduction.adaptation.evidence.length ?? null,
        transitionReason: brain?.economyProduction.adaptation.lastTransitionReason ?? null,
        selectedResearch: brain?.economyProduction.adaptation.selectedResearchType ?? null };
    };
    const timeline: { tick: number; players: ReturnType<typeof nativePlayerSample>[] }[] = [];
    const commandAuthority = services.find((entry): entry is { commandOutcome$?: { subscribe(listener: (outcome: {
      kind: string; reason: string }) => void): { unsubscribe(): void } } } => "command$" in entry && "dispatch" in entry);
    if (job.revision === "candidate" && !commandAuthority?.commandOutcome$)
      throw new Error("calibration_native_command_outcome_stream_missing");
    const outcomeCounts: Record<string, number> = {};
    const outcomeSubscription = commandAuthority?.commandOutcome$?.subscribe((outcome) => {
      const reason = `${outcome.kind}:${outcome.reason}`;
      const key = Object.hasOwn(outcomeCounts, reason) || Object.keys(outcomeCounts).length < 32 ? reason : "other";
      outcomeCounts[key] = (outcomeCounts[key] ?? 0) + 1;
    });
    const sampleInterval = Math.ceil(job.maximumTick / 31);
    let nextSample = 0, frameTime = game.loop.now, framesWithoutTick = 0;
    const settled = () => controllers.every((controller) => controller.isDecisionBoundarySettled?.() ?? !controller.stepInFlight);
    game.loop.sleep(); clock.setSimulationTimeScale(1); clock.resumeTick("manual");
    try {
      while (clock.currentTick < job.maximumTick) {
        const result = score.getScoreData()?.get(job.targetPlayerNumber)?.gameResult;
        if (["win", "loss", "tie"].includes(result ?? "")) break;
        const before = clock.currentTick;
        frameTime += 50; game.headlessStep(frameTime, 50);
        for (let wait = 0; wait < 200; wait++) {
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          if (settled()) break;
          if (wait === 199) throw new Error("calibration_native_async_boundary_stalled");
        }
        if (clock.currentTick > before + 1) throw new Error("calibration_native_frame_overshot");
        framesWithoutTick = clock.currentTick === before ? framesWithoutTick + 1 : 0;
        if (framesWithoutTick > 100) throw new Error("calibration_native_clock_stalled");
        if (clock.currentTick >= nextSample && timeline.length < 32) {
          timeline.push({ tick: clock.currentTick, players: controllers.map(nativePlayerSample) });
          nextSample += sampleInterval;
        }
      }
      const row = score.getScoreData()?.get(job.targetPlayerNumber), result = row?.gameResult ?? null;
      const terminal = ["win", "loss", "tie"].includes(result ?? "");
      const finalPlayers = controllers.map(nativePlayerSample);
      if (job.revision === "candidate" && ((decisionCounts[1] ?? 0) < 1 || (decisionCounts[2] ?? 0) < 1 ||
          profiles.target !== job.difficulty.toLowerCase() || profiles.opponent !== "normal" ||
          !profiles.opponentArchetype?.endsWith(`:${job.opponentArchetype}`))) failures.add("selected_native_policy_or_opponent_missing");
      return { job, tick: clock.currentTick, result, status: job.phase === "soak" ?
        clock.currentTick === job.maximumTick ? "soak_completed" : "short_terminal" : terminal ? "completed" : "timeout",
        initialPhysicalDigest, initialBanks, targetProfile: profiles.target, targetArchetype: profiles.targetArchetype,
        opponentProfile: profiles.opponent, opponentArchetype: profiles.opponentArchetype,
        decisions: job.revision === "candidate" ? (decisionCounts[1] ?? 0) + (decisionCounts[2] ?? 0) :
          controllers.reduce((sum, controller) => sum + (controller.telemetry?.snapshot().frame ?? 0), 0),
        metrics: { ...row?.metrics }, finalPlayers, outcomeCounts: job.revision === "candidate" ? outcomeCounts : null,
        timeline, failures: [...failures] };
    } finally {
      clock.pauseTick("manual");
      scene.events.off("ai-runtime-decision-repro", selected);
      outcomeSubscription?.unsubscribe();
    }
  }, job);
}
