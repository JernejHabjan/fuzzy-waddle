import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../combat/components/health-component";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { AudioService } from "../../../scenes/services/audio.service";
import { getGameObjectLogicalTransform, onObjectReady } from "../../../data/game-object-helper";
import { UiFeedbackBuildDeniedSound } from "../../../sfx/UiFeedbackSfx";
import HudMessages, { HudVisualFeedbackMessageType } from "../../../prefabs/gui/labels/HudMessages";
import { CrossSceneCommunicationService } from "../../../scenes/services/CrossSceneCommunicationService";
import { OwnerComponent } from "./owner-component";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { AnimationActorComponent, AnimationOptions } from "./animation-actor-component";
import { OrderType } from "../../character/ai/order-type";
import { ActorTranslateComponent } from "./actor-translate-component";
import { GameplayLibrary } from "../../../library/gameplay-library";
import GameObject = Phaser.GameObjects.GameObject;
import { BuilderComponentData } from "@fuzzy-waddle/api-interfaces";
import { IdComponent } from "./id-component";
import { ActorIndexSystem } from "../../../scenes/services/ActorIndexSystem";

export type BuilderDefinition = {
  // types of building the gameObject can produce
  constructableBuildings: ObjectNames[];
  // Whether the builder enters the building site while working on it, or not.
  enterConstructionSite: boolean;
  // from how far a builder builds building site
  constructionSiteOffset: number;
};

// Allows the actor to construct building
export class BuilderComponent {
  // building site the builder is currently working on
  assignedConstructionSite?: GameObject;

  // when cooldown has expired
  // onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  onConstructionSiteEntered: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onAssignedToConstructionSite: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  // onConstructionStarted: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onRemovedFromConstructionSite: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onConstructionSiteLeft: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  remainingCooldown = 0;
  private audioService?: AudioService;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;

  constructor(
    private readonly gameObject: GameObject,
    private readonly builderComponentDefinition: BuilderDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(this.gameObject, this.onObjectReady, this);
  }

  private onObjectReady() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
  }

  private update(_: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  get constructableBuildings(): ObjectNames[] {
    // NOTE, this can be later filtered, so we show only buildings that are available to the player
    return this.builderComponentDefinition.constructableBuildings;
  }

  getAssignedConstructionSite() {
    return this.assignedConstructionSite;
  }

  assignToConstructionSite(constructionSite: GameObject) {
    if (this.assignedConstructionSite === constructionSite) return;

    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    if (!constructionSiteComponent.canAssignBuilder()) {
      this.reportDeniedAction(HudVisualFeedbackMessageType.CannotAssignBuilder);
      return;
    }
    this.assignedConstructionSite = constructionSite;
    constructionSiteComponent.assignBuilder(this.gameObject);
    this.onAssignedToConstructionSite.next([this.gameObject, constructionSite]);

    const containerComponent = getActorComponent(constructionSite, ContainerComponent);
    if (this.builderComponentDefinition.enterConstructionSite && containerComponent) {
      containerComponent.loadGameObject(this.gameObject);
      this.onConstructionSiteEntered.next([this.gameObject, constructionSite]);
    } else {
      this.actorTranslateComponent?.turnTowardsGameObject(constructionSite);
      this.animationActorComponent?.playOrderAnimation(OrderType.Build, { repeat: -1 } satisfies AnimationOptions);
    }
  }

  leaveConstructionSite() {
    if (!this.assignedConstructionSite) return;

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    // remove builder
    this.assignedConstructionSite = undefined;
    constructionSiteComponent.unAssignBuilder(this.gameObject);

    // notify listeners
    this.onRemovedFromConstructionSite.next([this.gameObject, constructionSite]);

    // console.log("builder left building site");
    if (this.builderComponentDefinition.enterConstructionSite) {
      // leave building site
      const containerComponent = getActorComponent(constructionSite, ContainerComponent);
      if (containerComponent) {
        containerComponent.unloadGameObject(this.gameObject);
        this.onConstructionSiteLeft.next([this.gameObject, constructionSite]);
      }
    }
  }

  getConstructionRange(): number {
    return 1;
  }

  /**
   * will seek for new construction sites in this range
   */
  getConstructionSeekRange(): number {
    return 10;
  }

  getRepairRange() {
    return 1;
  }

  assignToRepairSite(target: Phaser.GameObjects.GameObject) {
    if (this.assignedConstructionSite === target) return;

    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    if (!constructionSiteComponent.canAssignRepairer()) {
      this.reportDeniedAction(HudVisualFeedbackMessageType.CannotAssignRepairer);
      return;
    }
    this.assignedConstructionSite = target;
    constructionSiteComponent.assignRepairer(this.gameObject);
    this.onAssignedToConstructionSite.next([this.gameObject, target]);

    const containerComponent = getActorComponent(target, ContainerComponent);
    if (this.builderComponentDefinition.enterConstructionSite && containerComponent) {
      containerComponent.loadGameObject(this.gameObject);
      this.onConstructionSiteEntered.next([this.gameObject, target]);
    } else {
      this.actorTranslateComponent?.turnTowardsGameObject(target);
      this.animationActorComponent?.playOrderAnimation(OrderType.Repair, { repeat: -1 } satisfies AnimationOptions);
    }
  }

  private reportDeniedAction(action: HudVisualFeedbackMessageType) {
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (!ownerComponent) return;
    const owner = ownerComponent.getOwner();
    if (!owner) return;
    const player = getCurrentPlayerNumber(this.gameObject.scene);
    if (!player) return;
    if (player !== owner) return;
    const soundDefinition = UiFeedbackBuildDeniedSound;
    this.audioService?.playAudioSprite(soundDefinition.key, soundDefinition.spriteName);
    const crossSceneCommunicationService = getSceneService(this.gameObject.scene, CrossSceneCommunicationService);
    crossSceneCommunicationService?.emit(HudMessages.HudVisualFeedbackMessageEventName, action);
  }

  leaveRepairSite() {
    if (!this.assignedConstructionSite) return;

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    // remove repairer
    this.assignedConstructionSite = undefined;
    constructionSiteComponent.unAssignRepairer(this.gameObject);

    // notify listeners
    this.onRemovedFromConstructionSite.next([this.gameObject, constructionSite]);

    console.log("builder left repair site");
    if (this.builderComponentDefinition.enterConstructionSite) {
      // leave repair site
      const containerComponent = getActorComponent(constructionSite, ContainerComponent);
      if (containerComponent) {
        containerComponent.unloadGameObject(this.gameObject);
        this.onConstructionSiteLeft.next([this.gameObject, constructionSite]);
      }
    }
  }

  private destroy() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  isIdle() {
    return !this.assignedConstructionSite;
  }

  getClosestConstructionSite(rangeInTiles: number): GameObject | null {
    const owner = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    const transform = getGameObjectLogicalTransform(this.gameObject);
    if (!owner || !transform) return null;
    const availableConstructionSites = this.gameObject.scene.children.list.filter((go) => {
      const constructionSiteComponent = getActorComponent(go, ConstructionSiteComponent);
      if (!constructionSiteComponent) return false;
      if (!constructionSiteComponent.canAssignBuilder()) return false;
      const targetOwnerComponent = getActorComponent(go, OwnerComponent);
      if (!targetOwnerComponent) return false;
      const targetOwner = targetOwnerComponent.getOwner();
      if (!targetOwner) return false;
      // noinspection RedundantIfStatementJS
      if (targetOwner !== owner) return false;
      return true;
    });

    if (availableConstructionSites.length === 0) return null;

    const closestConstructionSite = availableConstructionSites.reduce((prev, curr) => {
      const prevPosition = getGameObjectLogicalTransform(prev);
      const currPosition = getGameObjectLogicalTransform(curr);
      if (!prevPosition || !currPosition) return prev;

      const prevDistance = GameplayLibrary.distance3D(transform, prevPosition);
      const currDistance = GameplayLibrary.distance3D(transform, currPosition);

      return prevDistance < currDistance ? prev : curr;
    });

    // Check if the closest site is within the specified range
    const closestPosition = getGameObjectLogicalTransform(closestConstructionSite);
    if (!closestPosition) return null;

    const distance = GameplayLibrary.distance3D(transform, closestPosition);

    const tileSize = 64;
    const worldRange = rangeInTiles * tileSize;
    return distance <= worldRange ? closestConstructionSite : null;
  }

  setData(data: Partial<BuilderComponentData>) {
    if (data.remainingCooldown !== undefined) this.remainingCooldown = data.remainingCooldown;
    if (data.enterConstructionSite !== undefined)
      this.builderComponentDefinition.enterConstructionSite = data.enterConstructionSite;
    if (data.constructionSiteOffset !== undefined)
      this.builderComponentDefinition.constructionSiteOffset = data.constructionSiteOffset;
    if (data.assignedConstructionSiteId) {
      const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
      const actorById = actorIndex?.getActorById(data.assignedConstructionSiteId);
      if (actorById) {
        this.assignedConstructionSite = actorById;
      }
    }
  }

  getData(): BuilderComponentData {
    return {
      remainingCooldown: this.remainingCooldown,
      enterConstructionSite: this.builderComponentDefinition.enterConstructionSite,
      constructionSiteOffset: this.builderComponentDefinition.constructionSiteOffset,
      assignedConstructionSiteId: this.assignedConstructionSite
        ? getActorComponent(this.assignedConstructionSite, IdComponent)?.id
        : undefined
    };
  }
}
