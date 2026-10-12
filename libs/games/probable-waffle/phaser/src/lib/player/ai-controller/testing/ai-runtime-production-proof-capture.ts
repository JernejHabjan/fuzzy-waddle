import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { AiRuntimeProductionFrontiers } from "./ai-runtime-production-frontiers";
import { captureAiRuntimeProductionFrontier } from "./capture-ai-runtime-production-frontier";
import { captureAiRuntimeProductionSetup } from "./capture-ai-runtime-production-setup";
import type { AiRuntimeProductionSetupV1 } from "./ai-runtime-production-setup-v1";
import { AiRuntimeExposureBinding } from "./ai-runtime-exposure-binding";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";

/** Opt-in authority history owned by the existing capture; no timer, saved field, planner input or separate fact buffer. */
export class AiRuntimeProductionProofCapture {
  private readonly frontiers = new Map<number, AiRuntimeProductionFrontiers>();
  private readonly tracked = new Map<number, Set<string>>();
  private setup?: AiRuntimeProductionSetupV1;
  private readonly setupGaps: string[] = [];
  private detach?: () => void;
  private readonly exposure = new Map<number, AiRuntimeExposureBinding>();

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly identify: (actorId: string, item: UnifiedQueueItem) => string,
    private readonly afterSequence: () => number
  ) {}

  arm(playerNumber: number, latestTick: number): void {
    if (
      !this.scene.players.some((player) => player.playerNumber === playerNumber) ||
      (this.frontiers.size >= 16 && !this.frontiers.has(playerNumber))
    ) {
      throw new Error("production_frontier_player_scope_invalid");
    }
    const clock = getSceneService(this.scene, SimulationTickService);
    let history = this.frontiers.get(playerNumber);
    if (!history) {
      history = new AiRuntimeProductionFrontiers();
      this.frontiers.set(playerNumber, history);
    }
    history.arm(latestTick, clock?.currentTick ?? -1);
    if (!clock?.observeClosedFrontiers) history.lose("production_frontier_clock_unsupported");
    else if (!this.detach)
      this.detach = clock.observeClosedFrontiers(
        (tick) => {
          if (getSceneService(this.scene, SimulationTickService) !== clock)
            throw new Error("production_frontier_clock_replaced");
          for (const [player, entry] of this.frontiers) {
            if (entry.active)
              entry.close(tick, () => ({
                ...captureAiRuntimeProductionFrontier(
                  this.scene,
                  player,
                  this.tracked.get(player) ?? new Set(),
                  this.identify,
                  this.afterSequence()
                ),
                exposure: this.exposure.get(player)?.read()
              }));
          }
        },
        (reason) => this.frontiers.forEach((entry) => entry.lose(reason))
      );
    if (!this.setup && !this.setupGaps.length) {
      try {
        this.setup = captureAiRuntimeProductionSetup(this.scene);
      } catch {
        this.setupGaps.push("production_setup_authority_unavailable");
      }
    }
    const ids = this.tracked.get(playerNumber) ?? new Set<string>();
    for (const actor of getSceneService(this.scene, ActorIndexSystem)?.getOwnedActors(playerNumber) ?? []) {
      if (getActorComponent(actor, QueueComponent) || getActorComponent(actor, AttackComponent)) {
        const id = getActorComponent(actor, IdComponent)?.id;
        if (id) ids.add(id);
      }
    }
    this.tracked.set(playerNumber, ids);
  }

  observe(fact: AiRuntimeProductionFactV1): void {
    if (fact.kind === "actor_unregistered") this.exposure.forEach((binding) => binding.invalidate(fact.actorId));
    const ids = this.tracked.get(fact.playerNumber);
    if (fact.kind === "actor_registered" && fact.actor.actorId) ids?.add(fact.actor.actorId);
    if (fact.kind === "spatial_authority" && fact.spatial.kind === "placement" && fact.spatial.site.actorId) {
      ids?.add(fact.spatial.site.actorId);
    }
    if (fact.kind === "decision_selected") {
      if (
        this.frontiers.has(fact.playerNumber) &&
        fact.decision.input?.observation?.tick === fact.tick &&
        fact.decision.input.producerExposure?.tick === fact.tick &&
        !fact.decision.input.producerExposure.gaps.length
      ) {
        try {
          this.exposure.set(fact.playerNumber, new AiRuntimeExposureBinding(this.scene, fact.playerNumber, fact));
        } catch {
          this.frontiers.get(fact.playerNumber)?.lose("production_exposure_binding_reader_failed");
        }
      }
      const transition = fact.decision.economyProduction.transition;
      if (transition?.status === "committed") {
        this.frontiers.get(fact.playerNumber)?.require([transition.beginsTick, transition.forceDeadlineTick]);
      }
    }
    if (this.frontiers.size && isSnapshotApplyInProgress(this.scene)) {
      this.frontiers.forEach((entry) => entry.lose("snapshot_restore"));
    }
  }

  read(playerNumber: number) {
    return { setup: this.setup, setupGaps: this.setupGaps, frontiers: this.frontiers.get(playerNumber)?.read() };
  }

  dispose(): void {
    this.frontiers.forEach((entry) => entry.lose("production_capture_disposed"));
    this.detach?.();
    this.detach = undefined;
    this.frontiers.clear();
    this.tracked.clear();
    this.exposure.clear();
    this.setup = undefined;
  }
}
