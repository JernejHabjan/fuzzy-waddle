import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceSourceComponent } from "./resource-source-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import type { GathererComponent } from "./gatherer-component";
type GameObject = Phaser.GameObjects.GameObject;

/** Native indexed resource selection and deterministic ties; the facade owns cargo and source assignments. */
export class GathererTargetSelection {
  constructor(private readonly gameObject: GameObject, private readonly gatherer: GathererComponent) {}
  async findClosestResourceDrain(): Promise<GameObject | null> {
    if (this.gatherer.carriedResourceType === null) {
      // Gatherer is not carrying any resources
      return null;
    }

    const gatherer = this.gameObject;
    const gatherOwnerComponent = getActorComponent(gatherer, OwnerComponent);
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);

    // Use indexed drains if available, otherwise nothing
    const drains = actorIndex ? actorIndex.getResourceDrainsFiltered(undefined, this.gatherer.carriedResourceType) : [];

    const validDrains = drains.filter((resourceDrain) => {
      // check owner / team
      if (!gatherOwnerComponent || !gatherOwnerComponent.isSameTeamAsGameObject(resourceDrain)) return false;

      // check ready to use
      return GathererTargetSelection.isReadyToUse(resourceDrain);
    });

    // Use batch method for better performance
    const pairs: [GameObject, GameObject][] = validDrains.map((drain) => [gatherer, drain]);
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);

    let closestResourceDrain: GameObject | null = null;
    let closestResourceDrainDistance = Infinity;

    for (let i = 0; i < validDrains.length; i++) {
      const distance = distances[i];
      if (typeof distance !== "number") {
        continue;
      }
      const candidate = validDrains[i]!;
      if (
        distance < closestResourceDrainDistance ||
        (distance === closestResourceDrainDistance &&
          closestResourceDrain !== null &&
          this.compareActorTieBreaker(candidate, closestResourceDrain) < 0)
      ) {
        closestResourceDrain = candidate;
        closestResourceDrainDistance = distance;
      }
    }

    return closestResourceDrain;
  }

  /**
   * Checks whether the specified actor is ready to use (e.g. finished building).
   */
  private static isReadyToUse(resourceDrain: GameObject): boolean {
    const constructionSiteComponent = getActorComponent(resourceDrain, ConstructionSiteComponent);
    if (!constructionSiteComponent) return true;
    return constructionSiteComponent.isFinished;
  }

  async getClosestResourceSource(
    resourceType: ResourceType | null,
    maxDistance: number
  ): Promise<GameObject | undefined> {
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    const sources = actorIndex ? actorIndex.getResourceSourcesFiltered(resourceType ?? undefined) : [];

    const validSources = sources.filter((gameObject) => {
      const resourceSourceComponent = getActorComponent(gameObject, ResourceSourceComponent);
      if (!resourceSourceComponent) return false;
      // if not correct resource type
      if (resourceType && resourceSourceComponent.getResourceType() !== resourceType) return false;
      // check amount of resources
      if (resourceSourceComponent.getCurrentResources() <= 0) return false;
      // check if resource source can accept more gatherers
      // noinspection RedundantIfStatementJS
      if (!resourceSourceComponent.canAcceptGatherer()) return false;
      return true;
    });

    // Use batch method for better performance
    const pairs: [GameObject, GameObject][] = validSources.map((source) => [this.gameObject, source]);
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);

    let closestResourceSource: GameObject | undefined = undefined;
    let closestResourceSourceDistance = Infinity;

    for (let i = 0; i < validSources.length; i++) {
      const distance = distances[i];
      if (typeof distance !== "number") continue;
      if (maxDistance > 0 && distance > maxDistance) continue;
      const candidate = validSources[i];
      if (!candidate) {
        continue;
      }
      if (
        distance < closestResourceSourceDistance ||
        (distance === closestResourceSourceDistance &&
          closestResourceSource !== undefined &&
          this.compareActorTieBreaker(candidate, closestResourceSource) < 0)
      ) {
        closestResourceSource = candidate;
        closestResourceSourceDistance = distance;
      }
    }
    return closestResourceSource;
  }

  /**
   * Deterministic tie-break for equal-distance candidates.
   * Without this, Set/list iteration order differences can desync resource target selection.
   */
  private compareActorTieBreaker(left: GameObject, right: GameObject): number {
    const leftId = getActorComponent(left, IdComponent)?.id;
    const rightId = getActorComponent(right, IdComponent)?.id;
    if (leftId && rightId && leftId !== rightId) {
      return leftId.localeCompare(rightId);
    }
    const leftTransform = getGameObjectLogicalTransform(left);
    const rightTransform = getGameObjectLogicalTransform(right);
    const leftKey = [left.name, Math.round(leftTransform?.x ?? 0), Math.round(leftTransform?.y ?? 0),
      Math.round(leftTransform?.z ?? 0)].join(":");
    const rightKey = [right.name, Math.round(rightTransform?.x ?? 0), Math.round(rightTransform?.y ?? 0),
      Math.round(rightTransform?.z ?? 0)].join(":");
    return leftKey.localeCompare(rightKey);
  }

}
