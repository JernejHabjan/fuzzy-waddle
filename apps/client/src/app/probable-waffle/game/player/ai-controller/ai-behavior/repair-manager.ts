import { State } from "mistreevous";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ScenePlayerHelpers } from "../../../data/scene-player-helpers";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";

/**
 * RepairManager
 * - Identifies damaged friendly structures.
 * - Assigns a limited number of idle builders (workers) to repair.
 * - Uses a cooldown to avoid thrashing.
 */
export class RepairManager {
  private lastRepairAssignTime = 0;
  private readonly repairCooldownMs = 4000;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly playerNumber: number,
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  hasDamagedStructures(): boolean {
    const { currentPlayerActors } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.playerNumber);
    return currentPlayerActors.some((go) => {
      const health = getActorComponent(go, HealthComponent);
      return !!health && !health.killed && health.healthComponentData.health < health.healthDefinition.maxHealth;
    });
  }

  assignRepairWorkers(): State {
    const now = Date.now();
    if (now - this.lastRepairAssignTime < this.repairCooldownMs) return State.FAILED;

    this.blackboard.workers = getSceneService(this.scene, ActorIndexSystem)!
      .getAllIdActors()
      .filter((go) => getActorComponent(go, BuilderComponent));

    const { currentPlayerActors } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.playerNumber);
    const damaged = currentPlayerActors.filter((go) => {
      const health = getActorComponent(go, HealthComponent);
      return health && !health.killed && health.healthComponentData.health < health.healthDefinition.maxHealth;
    });
    if (damaged.length === 0) return State.FAILED;

    const target = damaged[0];
    if (!target) return State.FAILED;
    let assigned = 0;
    this.blackboard.workers.forEach((worker) => {
      if (assigned >= 2) return; // limit repairers
      const builder = getActorComponent(worker, BuilderComponent);
      if (!builder || !builder.isIdle()) return;
      builder.assignToConstructionSite(target); // reuse construction interface
      assigned++;
    });

    if (assigned === 0) return State.FAILED;
    this.lastRepairAssignTime = now;
    this.log("Assigned workers to repair damaged structure(s).");
    return State.SUCCEEDED;
  }
}
