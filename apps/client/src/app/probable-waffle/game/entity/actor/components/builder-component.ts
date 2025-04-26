import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { ObjectNames } from "../../../data/object-names";
import { HealthComponent } from "../../combat/components/health-component";
import GameObject = Phaser.GameObjects.GameObject;
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { AudioService } from "../../../scenes/services/audio.service";
import { onSceneInitialized } from "../../../data/game-object-helper";
import { UiFeedbackBuildDeniedSound } from "../../../sfx/UiFeedbackSfx";
import HudMessages, { HudVisualFeedbackMessageType } from "../../../prefabs/gui/labels/HudMessages";
import { CrossSceneCommunicationService } from "../../../scenes/services/CrossSceneCommunicationService";

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

  constructor(
    private readonly gameObject: GameObject,
    private readonly builderComponentDefinition: BuilderDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onSceneInitialized(this.gameObject.scene, this.sceneInit, this);
  }

  private sceneInit() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
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

    if (this.builderComponentDefinition.enterConstructionSite) {
      const containerComponent = getActorComponent(constructionSite, ContainerComponent);
      if (containerComponent) {
        containerComponent.loadGameObject(this.gameObject);
        this.onConstructionSiteEntered.next([this.gameObject, constructionSite]);
      }
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

    if (this.builderComponentDefinition.enterConstructionSite) {
      const containerComponent = getActorComponent(target, ContainerComponent);
      if (containerComponent) {
        containerComponent.loadGameObject(this.gameObject);
        this.onConstructionSiteEntered.next([this.gameObject, target]);
      }
    }
  }

  private reportDeniedAction(action: HudVisualFeedbackMessageType) {
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
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  isIdle() {
    return !this.assignedConstructionSite;
  }
}
