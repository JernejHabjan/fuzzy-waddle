import { ConstructionSiteComponent } from "./construction-site-component";
import { ContainerComponent } from "../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { type BuilderComponentData, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import { getGameObjectLogicalTransform, onObjectReady } from "../../../data/game-object-helper";
import { UiFeedbackBuildDeniedSound } from "../../../hud/UiFeedbackSfx";
import HudMessages, { HudVisualFeedbackMessageType } from "../../../prefabs/gui/labels/HudMessages";
import { CrossSceneCommunicationService } from "../../../world/services/CrossSceneCommunicationService";
import { OwnerComponent } from "../owner-component";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { AnimationActorComponent } from "../animation/animation-actor-component";
import { OrderType } from "../../../ai/order-type";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { IdComponent } from "../id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { ConstructableDefinition } from "./constructable-category";
import type { AnimationOptions } from "../animation/animation-options";
import type { BuilderDefinition } from "./builder-definition";
import GameObject = Phaser.GameObjects.GameObject;
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { getSimulationDelta } from "../../../world/services/simulation-time";

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
  private lastSimulationTimeMs?: number;
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

  private update(): void {
    const simulationDelta = getSimulationDelta(this.gameObject.scene, this.lastSimulationTimeMs);
    this.lastSimulationTimeMs = simulationDelta.now;
    const deltaWithTimeScale = simulationDelta.delta;

    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= deltaWithTimeScale;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  get constructableBuildings(): ObjectNames[] {
    // NOTE, this can be later filtered, so we show only buildings that are available to the player
    return BuilderComponent.getFlatConstructableBuildings(this.builderComponentDefinition.constructableBuildings);
  }

  get constructableBuildingsNested(): ConstructableDefinition {
    return this.builderComponentDefinition.constructableBuildings;
  }

  static getFlatConstructableBuildings(constructableDefinition: ConstructableDefinition): ObjectNames[] {
    const flatBuildings: ObjectNames[] = [];
    if (constructableDefinition.actorNames) {
      flatBuildings.push(...constructableDefinition.actorNames);
    }
    if (constructableDefinition.constructableCategories) {
      for (const category of constructableDefinition.constructableCategories) {
        const buildingsInCategory = category.constructableDefinitions;
        if (!buildingsInCategory) continue;
        for (const buildingDef of buildingsInCategory) {
          const buildings = BuilderComponent.getFlatConstructableBuildings(buildingDef);
          flatBuildings.push(...buildings);
        }
      }
    }
    return flatBuildings;
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

  async getClosestConstructionSite(rangeInTiles: number): Promise<GameObject | null> {
    const owner = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    const transform = getGameObjectLogicalTransform(this.gameObject);
    if (!owner || !transform) {
      // console.log("[Build] getClosestConstructionSite: No owner or transform");
      return null;
    }

    const tileSize = TilemapComponent.tileWidth;
    const worldRange = rangeInTiles * tileSize;

    // First filter by geometric distance and ownership
    const availableConstructionSites = this.gameObject.scene.children.list.filter((go) => {
      // Skip the currently assigned construction site (we're looking for the NEXT one)
      if (go === this.assignedConstructionSite) return false;

      const constructionSiteComponent = getActorComponent(go, ConstructionSiteComponent);
      if (!constructionSiteComponent) return false;
      if (!constructionSiteComponent.canAssignBuilder()) return false;
      const targetOwnerComponent = getActorComponent(go, OwnerComponent);
      if (!targetOwnerComponent) return false;
      const targetOwner = targetOwnerComponent.getOwner();
      if (!targetOwner) return false;
      if (targetOwner !== owner) return false;

      // Pre-filter by geometric distance to avoid unnecessary pathfinding
      const targetPosition = getGameObjectLogicalTransform(go);
      if (!targetPosition) return false;
      const geometricDistance = DistanceHelper.distance3D(transform, targetPosition);
      return geometricDistance <= worldRange;
    });

    // console.log("[Build] getClosestConstructionSite: Found", availableConstructionSites.length, "sites in geometric range (excluding current:", this.assignedConstructionSite, ")");

    if (availableConstructionSites.length === 0) return null;

    // Get navigation distances for all sites using batch method
    const pairs: [GameObject, GameObject][] = availableConstructionSites.map((site) => [this.gameObject, site]);
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);

    const sitesWithDistance: { site: GameObject; distance: number }[] = [];

    for (let i = 0; i < availableConstructionSites.length; i++) {
      const distance = distances[i];
      // console.log("[Build] getClosestConstructionSite: Site", availableConstructionSites[i], "navDistance=", distance);
      // Only include reachable sites
      if (typeof distance === "number" && distance <= rangeInTiles) {
        sitesWithDistance.push({ site: availableConstructionSites[i]!, distance });
      }
    }

    // console.log("[Build] getClosestConstructionSite: Found", sitesWithDistance.length, "reachable sites");

    if (sitesWithDistance.length === 0) return null;

    // Find closest by navigation distance
    const closest = sitesWithDistance.reduce((prev, curr) => (prev.distance < curr.distance ? prev : curr));

    // console.log("[Build] getClosestConstructionSite: Closest site", closest.site, "at distance", closest.distance);
    return closest.site;
  }

  setData(data: Partial<BuilderComponentData>) {
    if (data.remainingCooldown !== undefined) this.remainingCooldown = data.remainingCooldown;
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
      assignedConstructionSiteId: this.assignedConstructionSite
        ? getActorComponent(this.assignedConstructionSite, IdComponent)?.id
        : undefined
    };
  }
}
