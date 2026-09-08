import Phaser from "phaser";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../ai-player-handler";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { StateHashService } from "../../../world/services/recovery/state-hash.service";
import { digestAiWorldProjectionV1 } from "../../../world/services/recovery/authoritative-state-projection";
import type { AiReproBundleV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { AiIncidentCaptureStoreV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

const MAX_ADVANCE_TICKS = 20_000;

/** One safe runtime boundary captured after command application and observation commit. */
export interface AiRuntimeScenarioBoundaryV1 {
  readonly tick: number;
  readonly observationDigest: string;
  readonly worldDigest: string;
  readonly controllerState: AIBehaviorTreeStateData;
  readonly authorityEpoch: number;
  readonly outcomeCount: number;
}

/** Explicit construction options keep this bridge out of ordinary client authority and lobby surfaces. */
export interface AiRuntimeScenarioBridgeOptionsV1 {
  readonly developerTestMode: true;
  readonly maximumAdvanceTicks?: number;
}

/** Host-confidential full-world artifact; only the manifest is safe for general debug display. */
export interface AiRuntimeReproArtifactV1 {
  readonly manifest: AiReproBundleV1 & { readonly kind: "runtime" };
  readonly payload: {
    readonly controllerState: AIBehaviorTreeStateData;
    readonly observation: unknown;
    readonly authoritativeProjection: unknown;
    readonly outcomes: readonly unknown[];
  };
}

/** Exact source/content/config provenance supplied by the developer harness, never inferred from labels. */
export interface AiRuntimeReproProvenanceV1 {
  readonly sourceRevision: string;
  readonly dirtySourceDigest: string | null;
  readonly mapId: string;
  readonly mapDigest: string;
  readonly contentDigest: string;
  readonly configVersion: string;
  readonly rulesVersion: string;
  readonly scenarioId: string;
  readonly difficulty: "easy" | "normal" | "hard";
  readonly profileVersion: string;
  readonly archetypeVersion: string;
}

/**
 * Browser/Jest bridge over a real booted scene. It advances Phaser UPDATE events so
 * SimulationTickService and normal command subscribers execute in their production order.
 * It never injects commands, edits resources, exposes hidden observations or registers a live UI command.
 */
export class AiRuntimeScenarioBridgeV1 {
  private readonly maximumAdvanceTicks: number;
  private readonly incidentCaptures = new AiIncidentCaptureStoreV1();
  private disposed = false;

  constructor(
    private readonly scene: ProbableWaffleScene,
    options: AiRuntimeScenarioBridgeOptionsV1
  ) {
    if (options.developerTestMode !== true) throw new Error("ai_runtime_bridge_not_authorized");
    this.maximumAdvanceTicks = Math.min(options.maximumAdvanceTicks ?? MAX_ADVANCE_TICKS, MAX_ADVANCE_TICKS);
    if (!Number.isSafeInteger(this.maximumAdvanceTicks) || this.maximumAdvanceTicks <= 0) {
      throw new Error("invalid_ai_runtime_tick_budget");
    }
  }

  /** Advances normal fixed ticks and waits until the selected AI publishes that committed observation. */
  async advanceToCommittedObservation(playerNumber: PlayerNumber, targetTick: number): Promise<AiRuntimeScenarioBoundaryV1> {
    this.assertUsable();
    const tickService = this.requireTickService();
    if (!Number.isSafeInteger(targetTick) || targetTick < tickService.currentTick) throw new Error("invalid_target_tick");
    const required = targetTick - tickService.currentTick;
    if (required > this.maximumAdvanceTicks) throw new Error("ai_runtime_tick_budget_exceeded");
    for (let index = 0; index < required; index += 1) {
      this.scene.events.emit(Phaser.Scenes.Events.UPDATE, 0, SimulationTickService.TICK_INTERVAL_MS);
      await Promise.resolve();
    }
    const controller = this.requireController(playerNumber);
    for (let turn = 0; turn < 64; turn += 1) {
      if ((controller.getCommittedObservation()?.tick ?? -1) >= targetTick && controller.isDecisionBoundarySettled()) break;
      await Promise.resolve();
    }
    const observation = controller.getCommittedObservation();
    if (!observation || observation.tick < targetTick || !controller.isDecisionBoundarySettled()) {
      throw new Error("ai_observation_boundary_not_committed");
    }
    const stateHash = getSceneService(this.scene, StateHashService);
    if (!stateHash) throw new Error("state_hash_service_unavailable");
    const projection = stateHash.captureAuthoritativeProjection(this.scene);
    const bridge = controller.getBrainCommandBridgeSnapshot();
    return {
      tick: tickService.currentTick,
      observationDigest: digestJson(observation),
      worldDigest: digestAiWorldProjectionV1(projection),
      controllerState: structuredClone(controller.getSaveState()),
      authorityEpoch: bridge?.authority.authorityEpoch ?? 0,
      outcomeCount: bridge?.outcomes.length ?? 0
    };
  }

  /** Applies a captured controller continuation through its normal validated restore seam. */
  restoreControllerBoundary(playerNumber: PlayerNumber, state: AIBehaviorTreeStateData): void {
    this.assertUsable();
    this.requireController(playerNumber).setSaveState(structuredClone(state));
  }

  /** Captures permitted AI input plus authoritative runtime state at one completed boundary. */
  async captureRuntimeArtifact(
    playerNumber: PlayerNumber,
    targetTick: number,
    provenance: AiRuntimeReproProvenanceV1
  ): Promise<AiRuntimeReproArtifactV1> {
    const boundary = await this.advanceToCommittedObservation(playerNumber, targetTick);
    const controller = this.requireController(playerNumber);
    const observation = controller.getCommittedObservation();
    const stateHash = getSceneService(this.scene, StateHashService);
    if (!observation || !stateHash) throw new Error("runtime_capture_boundary_unavailable");
    const authoritativeProjection = stateHash.captureAuthoritativeProjection(this.scene);
    const outcomes = controller.getBrainCommandBridgeSnapshot()?.outcomes ?? [];
    const payload = {
      controllerState: boundary.controllerState,
      observation: structuredClone(observation),
      authoritativeProjection: structuredClone(authoritativeProjection),
      outcomes: structuredClone(outcomes)
    };
    const snapshotDigest = digestJson(payload);
    const inputDigest = digestJson({ observation: payload.observation, outcomes: payload.outcomes });
    const artifact: AiRuntimeReproArtifactV1 = {
      manifest: {
        schemaVersion: 1,
        kind: "runtime",
        replayInputs: {
          sourceRevision: provenance.sourceRevision,
          dirtySourceDigest: provenance.dirtySourceDigest,
          mapId: provenance.mapId,
          mapDigest: provenance.mapDigest,
          contentDigest: provenance.contentDigest,
          configVersion: provenance.configVersion,
          profileVersion: provenance.profileVersion,
          archetypeVersion: provenance.archetypeVersion,
          difficulty: provenance.difficulty,
          faction: observation.faction,
          playerNumber,
          rulesVersion: provenance.rulesVersion,
          tickInterval: SimulationTickService.TICK_INTERVAL_MS,
          authorityEpoch: boundary.authorityEpoch,
          tick: boundary.tick,
          snapshotReference: `snapshots/${provenance.scenarioId}-${boundary.tick}.json`,
          snapshotDigest,
          inputReference: `inputs/${provenance.scenarioId}-${boundary.tick}.json`,
          inputDigest,
          expectedCheckpoints: [{ tick: boundary.tick, digest: boundary.worldDigest }],
          scenarioId: provenance.scenarioId
        },
        completeness: {
          observation: "complete",
          priorState: "complete",
          outcomes: "complete",
          alternatives: "not_recorded",
          missingRanges: [],
          truncatedEventCount: 0
        },
        privacy: "host_confidential",
        display: { label: `${provenance.scenarioId} at tick ${boundary.tick}` }
      },
      payload
    };
    this.incidentCaptures.addAutomatic(provenance.scenarioId, artifact.manifest);
    return artifact;
  }

  /** Bounded host-only manifests; confidential runtime payloads remain in the explicit artifact owner. */
  getIncidentCaptureManifests() {
    return this.incidentCaptures.snapshot();
  }

  dispose(): void {
    this.disposed = true;
    this.incidentCaptures.dispose();
  }

  private requireTickService(): SimulationTickService {
    const service = getSceneService(this.scene, SimulationTickService);
    if (!service) throw new Error("simulation_tick_service_unavailable");
    return service;
  }

  private requireController(playerNumber: PlayerNumber) {
    const controller = getSceneSystem(this.scene, AiPlayerHandler)?.getAiPlayerController(playerNumber);
    if (!controller) throw new Error("ai_controller_unavailable");
    return controller;
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("ai_runtime_bridge_disposed");
  }
}

function digestJson(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
