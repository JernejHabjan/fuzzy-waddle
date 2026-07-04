import { ActorDataChangedEvent } from "../../../data/actor-data";
import { getActorComponent } from "../../../data/actor-component";
import { TendableComponent, type TendablePhase } from "./tendable-component";
import { Subscription } from "rxjs";
import { onObjectReady } from "../../../data/game-object-helper";

export class TendableGameObjectInterfaceComponent {
  private phaseSubscription?: Subscription;
  private initialized = false;
  private setupDone = false;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly handlePrefabVisibility: (phase: TendablePhase | null) => void
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.on(ActorDataChangedEvent, this.actorDataChanged, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
  }

  private actorDataChanged() {
    this.tendableHandler();
  }

  private init() {
    this.initialized = true;
    this.tendableHandler();
  }

  private tendableHandler() {
    if (this.setupDone) return;
    if (!this.initialized) return;
    const tendableComponent = getActorComponent(this.gameObject, TendableComponent);
    if (!tendableComponent) {
      this.phaseSubscription?.unsubscribe();
      this.handlePrefabVisibility(null);
      return;
    }
    this.setupDone = true;
    // Set initial state
    this.handlePrefabVisibility(tendableComponent.phase);
    // Subscribe to future phase changes
    this.phaseSubscription = tendableComponent.phaseChanged.subscribe((phase) => {
      this.handlePrefabVisibility(phase);
    });
  }

  private onDestroy() {
    this.phaseSubscription?.unsubscribe();
    this.gameObject.off(ActorDataChangedEvent, this.actorDataChanged, this);
  }
}
