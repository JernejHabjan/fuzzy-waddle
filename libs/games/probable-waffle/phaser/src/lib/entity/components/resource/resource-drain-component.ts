import Phaser from "phaser";
import {
  type PlayerStateResources,
  type ResourceDrainComponentData,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ContainerComponent } from "../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { creditGatheredResource } from "./credit-gathered-resource";
import { onObjectReady } from "../../../data/game-object-helper";
import { OwnerComponent } from "../owner-component";
import type { ResourceDrainDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/resource-drain-definition";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import type { ResourceTransferContext } from "./resource-transfer-context";
import { observeResourceCredit } from "./observe-resource-credit";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";
import { HealthComponent } from "../combat/components/health-component";
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
  /** Native transfer lock; repeated calls for the same carrier cannot credit the same cargo twice. */
  private readonly returningGatherers = new Set<GameObject>();

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
    return !this.gathererMustEnter || this.currentCapacity < this.maximumGathererCapacity;
  }

  /**
   * returns resources to player controller
   */
  async returnResources(
    gatherer: GameObject,
    resourceType: ResourceType,
    amount: number,
    context?: ResourceTransferContext
  ): Promise<number> {
    const scene = this.gameObject.scene;
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !this.getResourceTypes().includes(resourceType) ||
      !this.isLiveTransfer(gatherer, scene) ||
      !this.canDropOffResources() ||
      this.returningGatherers.has(gatherer)
    )
      return 0;
    this.returningGatherers.add(gatherer);
    try {
      if (this.gathererMustEnter) {
        fenceSceneResourceHistory(scene, "resource_drain_capacity_change");
        this.currentCapacity += 1;
      }
      let loaded = false;
      try {
        if (this.gathererMustEnter) {
          this.containerComponent?.loadGameObject(gatherer);
          loaded = true;
        }
        await waitForSimulationDuration(scene, this.resourceDrainDefinition.cooldown);
      } finally {
        if (this.gathererMustEnter) {
          fenceSceneResourceHistory(scene, "resource_drain_capacity_change");
          try {
            if (loaded && this.gameObject.scene === scene && gatherer.scene === scene)
              this.containerComponent?.unloadGameObject(gatherer);
          } finally {
            this.currentCapacity = Math.max(0, this.currentCapacity - 1);
          }
        }
      }
      // A destroyed drain or carrier cannot complete a transfer started by an earlier native order.
      if (!this.isLiveTransfer(gatherer, scene)) return 0;
      return this.creditResources(gatherer, resourceType, amount, context);
    } finally {
      this.returningGatherers.delete(gatherer);
    }
  }

  /** Keep cargo with the carrier when either physical endpoint disappears during the wait. */
  private isLiveTransfer(gatherer: GameObject, scene: Phaser.Scene): boolean {
    return (
      !!scene &&
      this.gameObject.scene === scene &&
      gatherer.scene === scene &&
      this.gameObject.active !== false &&
      gatherer.active !== false &&
      getActorComponent(this.gameObject, HealthComponent)?.killed !== true &&
      getActorComponent(gatherer, HealthComponent)?.killed !== true
    );
  }

  /** Preserve the existing recipient and campaign policy after physical transfer validation. */
  private creditResources(
    gatherer: GameObject,
    resourceType: ResourceType,
    amount: number,
    context?: ResourceTransferContext
  ): number {
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return 0;
    const economy = player.playerController.data.playerDefinition?.campaignEconomy;
    const amounts = { [resourceType]: amount } satisfies Partial<PlayerStateResources>;
    observeResourceCredit(
      {
        actor: gatherer,
        target: this.gameObject,
        context,
        resourceType,
        amount,
        channel: "drop_off",
        ownerArgument: owner ?? null
      },
      this.gameObject.scene,
      amounts,
      campaignEconomyAcceptsGatheredResources(economy)
        ? () => creditGatheredResource(this.gameObject.scene, owner, resourceType, amounts)
        : undefined
    );

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
