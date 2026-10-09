import Phaser from "phaser";
import {
  type PlayerStateResources,
  type ResourceDrainComponentData,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ContainerComponent } from "../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { onObjectReady } from "../../../data/game-object-helper";
import { OwnerComponent } from "../owner-component";
import type { ResourceDrainDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/resource-drain-definition";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import type { ResourceTransferContext } from "./resource-transfer-context";
import { observeResourceCredit } from "./observe-resource-credit";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";
/**
 * Defines the game object alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
type GameObject = Phaser.GameObjects.GameObject;

// this is to be applied to townHall/mine/lodge where resources can be returned to
export class ResourceDrainComponent {
  onResourcesReturned: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private maximumGathererCapacity = 0;
  private currentCapacity = 0;

  constructor(
    private readonly gameObject: GameObject,
    private readonly resourceDrainDefinition: ResourceDrainDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
  }

  init(): void {
    fenceSceneResourceHistory(this.gameObject.scene, "resource_drain_capacity_change");
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.maximumGathererCapacity = this.containerComponent?.containerDefinition.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  canDropOffResources(): boolean {
    const capacityReached = this.currentCapacity >= this.maximumGathererCapacity;
    return !capacityReached;
  }

  /**
   * returns resources to player controller
   */
  async returnResources(gatherer: GameObject, resourceType: ResourceType, amount: number,
    context?: ResourceTransferContext): Promise<number> {
    if (this.gathererMustEnter) {
      fenceSceneResourceHistory(this.gameObject.scene, "resource_drain_capacity_change");
      this.currentCapacity += 1;
      this.containerComponent?.loadGameObject(gatherer);
    }

    await waitForSimulationDuration(this.gameObject.scene, this.resourceDrainDefinition.cooldown);

    if (this.gathererMustEnter) {
      fenceSceneResourceHistory(this.gameObject.scene, "resource_drain_capacity_change");
      this.containerComponent?.unloadGameObject(gatherer);
      this.currentCapacity -= 1;
    }

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    const economy = getPlayer(this.gameObject.scene, owner)?.playerController.data.playerDefinition?.campaignEconomy;
    const amounts = { [resourceType]: amount } satisfies Partial<PlayerStateResources>;
    observeResourceCredit({ actor: gatherer, target: this.gameObject, context, resourceType, amount,
      channel: "drop_off", ownerArgument: owner ?? null }, this.gameObject.scene, amounts,
      campaignEconomyAcceptsGatheredResources(economy) ? () => emitResource(
        this.gameObject.scene,
        "resource.added",
        amounts,
        owner
      ) : undefined);

    // notify listeners
    this.onResourcesReturned.next([resourceType, amount, gatherer]);

    // we always return full amount
    // noinspection UnnecessaryLocalVariableJS
    const returnedAmount = amount;

    return returnedAmount;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getResourceTypes(): ResourceType[] {
    return this.resourceDrainDefinition.resourceTypes;
  }

  getDropOffRange(): number {
    return 1;
  }

  setData(data: Partial<ResourceDrainComponentData>) {
    if (data.currentCapacity !== undefined) {
      fenceSceneResourceHistory(this.gameObject.scene, "resource_drain_restore");
      this.currentCapacity = data.currentCapacity;
    }
  }

  getData(): ResourceDrainComponentData {
    return {
      currentCapacity: this.currentCapacity
    } satisfies ResourceDrainComponentData;
  }
}

export function campaignEconomyAcceptsGatheredResources(economy: "normal" | "granted" | "none" | undefined): boolean {
  return economy === undefined || economy === "normal";
}
