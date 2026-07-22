import { Subscription } from "rxjs";
import type { ScenarioActorId, ScenarioRegionId } from "@fuzzy-waddle/probable-waffle-campaign";
import type {
  CampaignMissionEvent,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeJsonValue
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getActorComponent } from "../data/actor-component";
import { getGameObjectLogicalTransform } from "../data/game-object-helper";
import { getPlayer } from "../data/scene-data";
import { TechTreeService } from "../data/tech-tree/tech-tree.service";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { ConstructionSiteComponent } from "../entity/components/construction/construction-site-component";
import { ActorTranslateComponent } from "../entity/components/movement/actor-translate-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { ActorIndexSystem } from "../world/services/ActorIndexSystem";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SimulationTickService } from "../world/services/simulation-tick.service";
import { ScenarioActorReferenceComponent } from "./scenario/scenario-actor-reference.component";
import { IndexedScenarioReferenceRegistry } from "./scenario/scenario-reference-registry";

export interface CampaignWorldEventSink {
  queueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number;
}

interface ActorEventHandlers {
  readonly killed: () => void;
  readonly destroyed: () => void;
  readonly subscriptions: Subscription;
}

/** The only adapter that translates Phaser/component signals into deterministic mission events. */
export class CampaignWorldEventAdapter {
  private readonly subscriptions = new Subscription();
  private readonly actorHandlers = new Map<Phaser.GameObjects.GameObject, ActorEventHandlers>();
  private readonly regionsByActor = new Map<ScenarioActorId, Set<ScenarioRegionId>>();
  private started = false;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly sink: CampaignWorldEventSink
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    const actorIndex = this.requireService(ActorIndexSystem);
    for (const actor of actorIndex.getAllIdActors()) this.attachActor(actor, false);
    this.subscriptions.add(actorIndex.actorRegistered.subscribe((actor) => this.attachActor(actor, true)));
    this.subscriptions.add(
      actorIndex.actorOwnershipChanged.subscribe(({ actor, oldOwner, newOwner }) => {
        const identity = this.identity(actor);
        if (!identity) return;
        this.emit(
          "actor.owner-changed",
          identity.sourceId,
          {
            actorRuntimeId: identity.actorRuntimeId,
            scenarioActorId: identity.scenarioActorId,
            previousOwner: oldOwner,
            owner: newOwner
          },
          newOwner
        );
      })
    );
    this.subscriptions.add(
      this.requireService(TechTreeService).researchCompleted.subscribe(({ playerNumber, researchType }) => {
        this.emit("research.completed", String(researchType), { playerNumber, researchType }, playerNumber);
      })
    );
    const playerChanged = this.scene.communicator.playerChanged;
    if (playerChanged) {
      this.subscriptions.add(
        playerChanged.on.subscribe((event) => {
          if (event.property !== "resource.added" && event.property !== "resource.removed") return;
          const playerNumber = event.data.playerNumber;
          if (playerNumber === undefined) return;
          for (const [resourceType, rawAmount] of Object.entries(event.data.playerStateData?.resources ?? {}).sort()) {
            const amount = Number(rawAmount);
            if (!Number.isFinite(amount)) continue;
            const delta = event.property === "resource.added" ? amount : -amount;
            const total = Number(getPlayer(this.scene, playerNumber)?.getResources()[resourceType as never] ?? 0);
            this.emit(
              "resource.changed",
              `${playerNumber}:${resourceType}`,
              {
                playerNumber,
                resourceType,
                delta,
                total
              },
              playerNumber
            );
          }
        })
      );
    }
  }

  dialogueAcknowledged(lineId: string, ownerToken?: string, initiatorPlayerNumber?: number): void {
    this.emit(
      "dialogue.acknowledged",
      lineId,
      { lineId, ...(ownerToken ? { ownerToken } : {}) },
      initiatorPlayerNumber
    );
  }

  dialoguePresented(lineId: string, ownerToken: string): void {
    this.emit("dialogue.presented", lineId, { lineId, ownerToken });
  }

  cinematicCue(cinematicId: string, cueIndex: number): void {
    this.emit("cinematic.cue", cinematicId, { cinematicId, cueIndex });
  }

  cinematicFinished(cinematicId: string, skipped: boolean, initiatorPlayerNumber?: number): void {
    this.emit("cinematic.finished", cinematicId, { cinematicId, skipped }, initiatorPlayerNumber);
  }

  destroy(): void {
    this.subscriptions.unsubscribe();
    for (const [actor, handlers] of this.actorHandlers) {
      actor.off(HealthComponent.KilledEvent, handlers.killed);
      actor.off(Phaser.GameObjects.Events.DESTROY, handlers.destroyed);
      handlers.subscriptions.unsubscribe();
    }
    this.actorHandlers.clear();
    this.regionsByActor.clear();
    this.started = false;
  }

  private attachActor(actor: Phaser.GameObjects.GameObject, emitCreated: boolean): void {
    if (this.actorHandlers.has(actor)) return;
    const subscriptions = new Subscription();
    const killed = () => this.emitActorLifecycle("actor.killed", actor);
    const destroyed = () => {
      this.emitActorLifecycle("actor.destroyed", actor);
      this.detachActor(actor);
    };
    actor.once(HealthComponent.KilledEvent, killed);
    actor.once(Phaser.GameObjects.Events.DESTROY, destroyed);
    const construction = getActorComponent(actor, ConstructionSiteComponent);
    if (construction) {
      subscriptions.add(
        construction.constructionStateChanged.subscribe((state) => {
          if (state !== ConstructionStateEnum.Finished) return;
          const identity = this.identity(actor);
          if (!identity) return;
          this.emit("construction.completed", identity.sourceId, {
            scenarioActorId: identity.scenarioActorId,
            actorType: actor.name,
            owner: getActorComponent(actor, OwnerComponent)?.getOwner()
          });
        })
      );
    }
    const translate = getActorComponent(actor, ActorTranslateComponent);
    if (translate)
      subscriptions.add(translate.actorMovedLogicalPosition.subscribe(() => this.updateActorRegions(actor)));
    this.actorHandlers.set(actor, { killed, destroyed, subscriptions });
    this.seedActorRegions(actor);
    if (emitCreated) this.emitActorLifecycle("actor.created", actor);
  }

  private detachActor(actor: Phaser.GameObjects.GameObject): void {
    const handlers = this.actorHandlers.get(actor);
    if (!handlers) return;
    handlers.subscriptions.unsubscribe();
    const scenarioActorId = this.identity(actor)?.scenarioActorId;
    if (scenarioActorId) this.regionsByActor.delete(scenarioActorId);
    this.actorHandlers.delete(actor);
  }

  private emitActorLifecycle(
    kind: "actor.created" | "actor.destroyed" | "actor.killed",
    actor: Phaser.GameObjects.GameObject
  ): void {
    const identity = this.identity(actor);
    if (!identity) return;
    const payload = {
      actorRuntimeId: identity.actorRuntimeId,
      scenarioActorId: identity.scenarioActorId,
      actorType: actor.name
    };
    if (kind === "actor.created") {
      const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
      this.emit(kind, identity.sourceId, { ...payload, owner }, owner);
      return;
    }
    this.emit(kind, identity.sourceId, payload, getActorComponent(actor, OwnerComponent)?.getOwner());
  }

  private seedActorRegions(actor: Phaser.GameObjects.GameObject): void {
    const identity = this.identity(actor);
    const position = getGameObjectLogicalTransform(actor);
    const registry = getSceneService(this.scene, IndexedScenarioReferenceRegistry);
    if (!identity?.scenarioActorId || !position || !registry) return;
    this.regionsByActor.set(
      identity.scenarioActorId,
      new Set(registry.regionsContaining(position).map((region) => region.definition.id))
    );
  }

  private updateActorRegions(actor: Phaser.GameObjects.GameObject): void {
    const identity = this.identity(actor);
    const position = getGameObjectLogicalTransform(actor);
    const registry = getSceneService(this.scene, IndexedScenarioReferenceRegistry);
    if (!identity?.scenarioActorId || !position || !registry) return;
    const previous = this.regionsByActor.get(identity.scenarioActorId) ?? new Set<ScenarioRegionId>();
    const current = new Set(registry.regionsContaining(position).map((region) => region.definition.id));
    for (const regionId of [...current].sort()) {
      if (!previous.has(regionId)) {
        this.emit("actor.entered-region", identity.sourceId, { scenarioActorId: identity.scenarioActorId, regionId });
      }
    }
    for (const regionId of [...previous].sort()) {
      if (!current.has(regionId)) {
        this.emit("actor.left-region", identity.sourceId, { scenarioActorId: identity.scenarioActorId, regionId });
      }
    }
    this.regionsByActor.set(identity.scenarioActorId, current);
  }

  private identity(actor: Phaser.GameObjects.GameObject):
    | {
        readonly actorRuntimeId: string;
        readonly scenarioActorId?: ScenarioActorId;
        readonly sourceId: string;
      }
    | undefined {
    const actorRuntimeId = getActorComponent(actor, IdComponent)?.id;
    if (!actorRuntimeId) return undefined;
    const scenarioActorId = getActorComponent(actor, ScenarioActorReferenceComponent)?.getData()?.roleId as
      | ScenarioActorId
      | undefined;
    return { actorRuntimeId, scenarioActorId, sourceId: scenarioActorId ?? actorRuntimeId };
  }

  private emit<TKind extends CampaignMissionEvent["kind"]>(
    kind: TKind,
    sourceId: string,
    payload: CampaignMissionEventPayload<TKind>,
    initiatorPlayerNumber?: number
  ): void {
    const player = initiatorPlayerNumber === undefined ? undefined : getPlayer(this.scene, initiatorPlayerNumber);
    this.sink.queueEvent({
      tick: this.requireService(SimulationTickService).currentTick,
      kind,
      sourceId,
      payload,
      initiatorPlayerNumber,
      initiatorFaction: player?.factionType === 1 ? "tivara" : player?.factionType === 2 ? "skaduwee" : undefined
    });
  }

  private requireService<T>(type: new (...args: never[]) => T): T {
    const service = this.scene.getSceneGameData().services.find((candidate) => candidate instanceof type) as
      | T
      | undefined;
    if (!service) throw new Error(`CampaignWorldEventAdapter requires ${type.name}`);
    return service;
  }
}

type CampaignMissionEventPayload<TKind extends CampaignMissionEvent["kind"]> = CampaignMissionEvent extends infer TEvent
  ? TEvent extends { readonly kind: infer TEventKind; readonly payload: infer TPayload }
    ? TKind extends TEventKind
      ? Extract<TPayload, CampaignMissionRuntimeJsonValue>
      : never
    : never
  : never;
