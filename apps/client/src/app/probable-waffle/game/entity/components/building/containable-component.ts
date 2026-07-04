import { ContainerComponent } from "./container-component";
import { getActorComponent } from "../../../data/actor-component";
import GameObject = Phaser.GameObjects.GameObject;
import { HealthComponent } from "../combat/components/health-component";

/**
 * Apply on actor that can be loaded into a container - for example enter a mine to gather resources or enter a tower to repair or shoot
 */
export class ContainableComponent {
  private containerOwner: GameObject | null = null;
  /** The container the unit has registered a boarding request with but hasn't boarded yet. */
  pendingContainerBoardingRequest: GameObject | null = null;

  constructor(public gameObject: GameObject) {
    gameObject.once(HealthComponent.KilledEvent, this.onKilled, this);
  }

  isContained() {
    return !!this.containerOwner;
  }

  leaveContainer() {
    if (!this.containerOwner) return;
    const owner = this.containerOwner;
    this.containerOwner = null; // clear before calling to prevent infinite recursion
    getActorComponent(owner, ContainerComponent)?.unloadGameObject(this.gameObject);
  }

  /** Clears the container reference without triggering unload (called by ContainerComponent during unload). */
  clearContainerReference() {
    this.containerOwner = null;
  }

  setContainer(containerOwner: GameObject) {
    this.containerOwner = containerOwner;
  }

  /** Cancel any pending boarding request registered on a container (called when unit takes a new order). */
  cancelAnyPendingBoardingRequest() {
    if (!this.pendingContainerBoardingRequest) return;
    getActorComponent(this.pendingContainerBoardingRequest, ContainerComponent)?.cancelBoardingRequest(this.gameObject);
    this.pendingContainerBoardingRequest = null;
  }

  /**
   * unload actor from container
   */
  onKilled() {
    if (!this.containerOwner) return;
    const owner = this.containerOwner;
    this.containerOwner = null; // clear before calling to prevent infinite recursion
    getActorComponent(owner, ContainerComponent)?.unloadGameObject(this.gameObject);
  }
}
