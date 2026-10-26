import Phaser from "phaser";
import { ConstructionSiteComponent } from "./construction-site-component";
import { ContainerComponent } from "../building/container-component";
import { Subject, type Subscription } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { type BuilderComponentData, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
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
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { ConstructableDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/constructable-category";
import type { AnimationOptions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-options";
import type { BuilderDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/builder-definition";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { constructionApproachRange } from "./construction-approach-range";

// Allows the actor to construct building
export class BuilderComponent {
  // building site the builder is currently working on
  assignedConstructionSite?: Phaser.GameObjects.GameObject;

  // when cooldown has expired
  // onCooldownReady: EventEmitter<Phaser.GameObjects.GameObject> = new EventEmitter<Phaser.GameObjects.GameObject>();
  onConstructionSiteEntered: Subject<[Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]> = new Subject<
    [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]
  >();
  onAssignedToConstructionSite: Subject<[Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]> = new Subject<
    [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]
  >();
  onRemovedFromConstructionSite: Subject<[Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]> = new Subject<
    [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]
  >();
  onConstructionSiteLeft: Subject<[Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]> = new Subject<
    [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject]
  >();
  remainingCooldown = 0;
  // Fixes same-tick cooldown decrement right after setData/reconnect restore.
  private cooldownStartedOnTick = -1;
  // Fixes one-shot restore race when assigned site is not indexed yet.
  private pendingAssignedConstructionSiteId?: string;
  private simulationTickService?: SimulationTickService;
  private cooldownTickSub?: Subscription;
  private audioService?: AudioService;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private disposed = false;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly builderComponentDefinition: BuilderDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    onObjectReady(this.gameObject, this.onObjectReady, this);
  }

  private onObjectReady() {
    if (this.disposed) return;
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    this.cooldownTickSub = this.simulationTickService?.tick$.subscribe(() => {
      this.onSimulationTick();
    });
  }

  private onSimulationTick(): void {
    // Fixes delayed actor-index population by retrying assigned-site resolution deterministically.
    this.tryResolveAssignedConstructionSiteReference();

    if (this.remainingCooldown <= 0) {
      return;
    }

    if (this.cooldownStartedOnTick === this.simulationTickService?.currentTick) {
      return;
    }

    this.remainingCooldown -= SimulationTickService.TICK_INTERVAL_MS;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    if (this.remainingCooldown <= 0) {
      this.cooldownStartedOnTick = -1;
    }
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

  assignToConstructionSite(constructionSite: Phaser.GameObjects.GameObject) {
    if (this.disposed) return;
    if (this.assignedConstructionSite === constructionSite) return;

    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    if (!constructionSiteComponent.canAssignBuilder()) {
      this.reportDeniedAction(HudVisualFeedbackMessageType.CannotAssignBuilder);
      return;
    }
    // Release the former site's progress/capacity before transferring this worker to another site.
    this.leaveConstructionSite();
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
    this.pendingAssignedConstructionSiteId = undefined;
    if (!this.assignedConstructionSite) return;

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);

    // remove builder
    this.assignedConstructionSite = undefined;
    constructionSiteComponent?.unAssignBuilder(this.gameObject);
    constructionSiteComponent?.unAssignRepairer(this.gameObject);

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

  /** Uses the target footprint to give pathfinding a free tile beyond its blocked center. */
  getConstructionRange(target?: Phaser.GameObjects.GameObject): number {
    if (!target) return 1;
    const tilemap = getSceneComponent(target.scene, TilemapComponent)?.tilemap;
    if (!tilemap) return 1;
    return constructionApproachRange(
      getTileCoordsUnderObject(tilemap, target),
      getCenterTileCoordUnderObject(tilemap, target)
    );
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
    if (this.disposed) return;
    if (this.assignedConstructionSite === target) return;

    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    if (!constructionSiteComponent.canAssignRepairer()) {
      this.reportDeniedAction(HudVisualFeedbackMessageType.CannotAssignRepairer);
      return;
    }
    this.leaveConstructionSite();
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
    this.leaveConstructionSite();
  }

  private destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.cooldownTickSub?.unsubscribe();
    this.simulationTickService = undefined;
    this.leaveConstructionSite();
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.destroy, this);
    this.gameObject.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.onConstructionSiteEntered.complete();
    this.onAssignedToConstructionSite.complete();
    this.onRemovedFromConstructionSite.complete();
    this.onConstructionSiteLeft.complete();
  }

  isIdle() {
    return !this.assignedConstructionSite;
  }

  async getClosestConstructionSite(rangeInTiles: number): Promise<Phaser.GameObjects.GameObject | null> {
    if (this.disposed) return null;
    const owner = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    const transform = getGameObjectLogicalTransform(this.gameObject);
    if (!owner || !transform) {
      // console.log("[Build] getClosestConstructionSite: No owner or transform");
      return null;
    }

    const tileSize = TilemapComponent.tileWidth;
    const worldRange = rangeInTiles * tileSize;

    const canUseSite = (site: Phaser.GameObjects.GameObject) =>
      site.active !== false && site.scene === this.gameObject.scene &&
      site !== this.assignedConstructionSite &&
      getActorComponent(site, ConstructionSiteComponent)?.canAssignBuilder() === true &&
      getActorComponent(site, OwnerComponent)?.getOwner() === owner;

    // First filter by geometric distance and ownership
    const availableConstructionSites = this.gameObject.scene.children.list.filter((go) => {
      // Skip the currently assigned construction site (we're looking for the NEXT one)
      if (!canUseSite(go)) return false;

      // Pre-filter by geometric distance to avoid unnecessary pathfinding
      const targetPosition = getGameObjectLogicalTransform(go);
      if (!targetPosition) return false;
      const geometricDistance = DistanceHelper.distance3D(transform, targetPosition);
      return geometricDistance <= worldRange;
    });

    if (availableConstructionSites.length === 0) return null;

    // Get navigation distances for all sites using batch method
    const pairs: [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject][] = availableConstructionSites.map(
      (site) => [this.gameObject, site]
    );
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);
    if (this.disposed || owner !== getActorComponent(this.gameObject, OwnerComponent)?.getOwner()) return null;

    const sitesWithDistance: { site: Phaser.GameObjects.GameObject; distance: number }[] = [];

    for (let i = 0; i < availableConstructionSites.length; i++) {
      // Cancellation, completion, capture or a competing builder can invalidate a pending lookup.
      const site = availableConstructionSites[i];
      if (!site || !canUseSite(site)) continue;
      const distance = distances[i];
      // console.log("[Build] getClosestConstructionSite: Site", availableConstructionSites[i], "navDistance=", distance);
      // Only include reachable sites
      if (typeof distance === "number" && distance <= rangeInTiles) {
        sitesWithDistance.push({ site, distance });
      }
    }

    // console.log("[Build] getClosestConstructionSite: Found", sitesWithDistance.length, "reachable sites");

    if (sitesWithDistance.length === 0) return null;

    // Find closest by navigation distance with deterministic tie-break by actor ID.
    const closest = sitesWithDistance.reduce((prev, curr) => {
      if (curr.distance < prev.distance) {
        return curr;
      }
      if (curr.distance > prev.distance) {
        return prev;
      }
      const prevId = getActorComponent(prev.site, IdComponent)?.id ?? "";
      const currId = getActorComponent(curr.site, IdComponent)?.id ?? "";
      if (!prevId || !currId || prevId === currId) {
        return prev;
      }
      return currId.localeCompare(prevId) < 0 ? curr : prev;
    });

    // console.log("[Build] getClosestConstructionSite: Closest site", closest.site, "at distance", closest.distance);
    return closest.site;
  }

  setData(data: Partial<BuilderComponentData>) {
    if (this.disposed) return;
    if (data.remainingCooldown !== undefined) {
      this.remainingCooldown = data.remainingCooldown;
      if (this.remainingCooldown > 0) {
        // Fixes immediate first-tick cooldown skew after restore.
        this.cooldownStartedOnTick = this.simulationTickService?.currentTick ?? -1;
      } else {
        this.cooldownStartedOnTick = -1;
      }
    }

    this.assignedConstructionSite = undefined;
    this.pendingAssignedConstructionSiteId = data.assignedConstructionSiteId;
    this.tryResolveAssignedConstructionSiteReference();
  }

  private tryResolveAssignedConstructionSiteReference(): void {
    if (!this.pendingAssignedConstructionSiteId) {
      return;
    }

    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndex) {
      return;
    }

    const actorById = actorIndex.getActorById(this.pendingAssignedConstructionSiteId);
    if (actorById) {
      this.assignedConstructionSite = actorById;
      this.pendingAssignedConstructionSiteId = undefined;
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
