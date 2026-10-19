import Phaser from "phaser";
import { Subscription } from "rxjs";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";

/** Native registration/tech/balance/damage listeners share the parent's single ordered fact budget and disposal boundary. */
export class AiRuntimeProductionWorldCapture {
  private readonly subscriptions = new Subscription();
  private readonly lastBalances = new Map<number, Record<ResourceType, number>>();
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly callbacks: {
      readonly resources: (player: number) => Record<ResourceType, number>;
      readonly boundary: (player: number) => { sequence: number; tick: number; playerNumber: number };
      readonly append: (fact: AiRuntimeProductionFactV1) => void;
      readonly watchQueue: (actor: Phaser.GameObjects.GameObject) => void;
      readonly unwatchActor: (actor: Phaser.GameObjects.GameObject) => void;
    },
    captureCombat = false
  ) {
    const index = getSceneService(scene, ActorIndexSystem);
    const tech = getSceneService(scene, TechTreeService);
    const playerChanged = scene.communicator.playerChanged;
    if (!index || !tech || !playerChanged) throw new Error("production_capture_world_authority_missing");
    for (const player of scene.players)
      if (player.playerNumber !== undefined) {
        this.lastBalances.set(player.playerNumber, callbacks.resources(player.playerNumber));
      }
    this.subscriptions.add(
      playerChanged.on.subscribe((event) => {
        if (event.property !== "resource.added" && event.property !== "resource.removed") return;
        const playerNumber = event.data.playerNumber;
        if (playerNumber === undefined) return;
        const after = this.callbacks.resources(playerNumber);
        const before = this.lastBalances.get(playerNumber) ?? after;
        const amounts = { ...event.data.playerStateData?.resources };
        const sign = event.property === "resource.added" ? 1 : -1;
        const balanceMatches = Object.values(ResourceType).every(
          (resource) => after[resource] === before[resource] + sign * (amounts[resource] ?? 0)
        );
        this.lastBalances.set(playerNumber, after);
        this.callbacks.append({
          ...this.callbacks.boundary(playerNumber),
          kind: "resources_applied",
          action: event.property,
          amounts,
          before,
          after,
          balanceMatches
        });
      })
    );
    this.subscriptions.add(
      tech.researchCompleted.subscribe(({ playerNumber, researchType }) =>
        this.callbacks.append({
          ...this.callbacks.boundary(playerNumber),
          kind: "research_completed",
          researchType
        })
      )
    );
    this.subscriptions.add(
      index.actorRegistered.subscribe((actor) => {
        const playerNumber = getActorComponent(actor, OwnerComponent)?.getOwner();
        if (playerNumber !== undefined && actor.scene === this.scene)
          this.callbacks.append({
            ...this.callbacks.boundary(playerNumber),
            kind: "actor_registered",
            actor: captureAiRuntimeCreatedActor(actor),
            snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene)
          });
        this.callbacks.watchQueue(actor);
      })
    );
    this.subscriptions.add(
      index.actorUnregistered.subscribe((actor) => {
        const playerNumber = getActorComponent(actor, OwnerComponent)?.getOwner();
        const actorId = getActorComponent(actor, IdComponent)?.id;
        if (playerNumber !== undefined && actorId)
          this.callbacks.append({
            ...this.callbacks.boundary(playerNumber),
            kind: "actor_unregistered",
            actorId,
            actor: captureAiRuntimeCreatedActor(actor),
            objectName: actor.name
          });
        this.callbacks.unwatchActor(actor);
      })
    );
    if (captureCombat) {
      scene.events.on(ProbableWaffleSceneEventName.ScoreDamage, this.observeDamage, this);
      this.subscriptions.add(() => scene.events.off(ProbableWaffleSceneEventName.ScoreDamage, this.observeDamage, this));
    }
  }
  dispose(): void {
    this.subscriptions.unsubscribe();
    this.lastBalances.clear();
  }

  /** Explicit setup overwrites are not income. Start later generic delta checks from the actual paused authority. */
  syncSetupBalances(): void {
    for (const player of this.scene.players)
      if (player.playerNumber !== undefined) {
        this.lastBalances.set(player.playerNumber, this.callbacks.resources(player.playerNumber));
      }
  }

  /** Victim ownership selects the existing ledger; cross-player initiators remain exact detached native identities. */
  private readonly observeDamage = (
    target: Phaser.GameObjects.GameObject, amount: number, initiator?: Phaser.GameObjects.GameObject
  ): void => {
    if (target.scene !== this.scene) return;
    const playerNumber = getActorComponent(target, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    const health = getActorComponent(target, HealthComponent);
    this.callbacks.append({
      ...this.callbacks.boundary(playerNumber), kind: "native_damage", damage: {
        target: captureAiRuntimeCreatedActor(target), initiator: initiator ? captureAiRuntimeCreatedActor(initiator) : null,
        targetInCaptureScene: true, initiatorInCaptureScene: initiator?.scene === this.scene,
        amount, damageType: health?.latestDamage?.damageType ?? null,
        healthAfter: health?.healthComponentData.health ?? null, armourAfter: health?.healthComponentData.armour ?? null,
        damageTick: health?.latestDamage?.simulationTick ?? null,
        sceneActive: this.scene.sys?.isActive() ?? false, snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene)
      }
    });
  };
}
