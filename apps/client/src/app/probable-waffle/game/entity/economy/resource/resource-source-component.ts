import { IComponent } from "../../../core/component.service";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import GameObject = Phaser.GameObjects.GameObject;

export type ResourceSourceDefinition = {
  resourceType: ResourceType;
  maximumResources: number;
  gatheringFactor: number;
};

export class ResourceSourceComponent {
  onResourcesChanged: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  onDepleted: Subject<GameObject> = new Subject<GameObject>();
  private currentResources: number;
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private gathererCapacity = 0;

  constructor(
    private readonly gameObject: GameObject,
    private readonly resourceSourceDefinition: ResourceSourceDefinition
  ) {
    this.currentResources = this.resourceSourceDefinition.maximumResources;
    this.init();
  }

  init(): void {
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.gathererCapacity = this.containerComponent?.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  extractResources(gatherer: GameObject, amount: number): number {
    if (this.gathererMustEnter) {
      // todo!!!!!!
    }

    const gatheredAmount = Math.min(amount * this.resourceSourceDefinition.gatheringFactor, this.currentResources);

    // deduct resources
    const oldResources = this.currentResources;
    this.currentResources -= gatheredAmount;
    const newResources = this.currentResources;

    console.log(
      "gatherer",
      gatherer,
      "extracted",
      gatheredAmount,
      this.resourceSourceDefinition.resourceType,
      "from",
      this.gameObject,
      "oldResources",
      oldResources,
      "newResources",
      newResources
    );

    this.onResourcesChanged.next([this.resourceSourceDefinition.resourceType, gatheredAmount, gatherer]);
    // check if we're depleted
    if (this.currentResources <= 0) {
      this.onDepleted.next(this.gameObject);
      this.gameObject.destroy();
    }
    return gatheredAmount;
  }

  canGathererEnter(gatherer: GameObject): boolean {
    return this.containerComponent?.canLoadGameObject(gatherer) ?? true;
  }

  getResourceType(): ResourceType {
    return this.resourceSourceDefinition.resourceType;
  }

  getMaximumResources(): number {
    return this.resourceSourceDefinition.maximumResources;
  }

  getGatheringFactor(): number {
    return this.resourceSourceDefinition.gatheringFactor;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getCurrentResources(): number {
    return this.currentResources;
  }
}
