import type Phaser from "phaser";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { NavigationService } from "../../world/services/navigation.service";
import { MovementOccupancyService } from "../../world/services/movement-occupancy.service";
import { getActorComponent } from "../../data/actor-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { AnimationActorComponent } from "../components/animation/animation-actor-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { AudioService } from "../../world/services/audio.service";
import { AudioActorComponent } from "../components/actor-audio/audio-actor-component";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";

/**
 * Actor-local dependencies shared by movement owners. Components are sampled only at the original ready callback;
 * navigation and occupancy keep their original lazy scene lookup and caching. Nothing here is saved or observed.
 */
export class MovementRuntime {
  /** Retry a missing service lazily; retain the first available native instance. */
  private _navigationService?: NavigationService;
  /** Ready-time translation component; tween duration also retains its original live component read. */
  actorTranslateComponent?: ActorTranslateComponent;
  /** Set by the existing actor-ready callback before standard-step duration uses tile dimensions. */
  tileMapComponent!: TilemapComponent;
  audioService: AudioService | undefined;
  audioActorComponent: AudioActorComponent | undefined;
  animationActorComponent?: AnimationActorComponent;
  statusEffectComponent?: StatusEffectComponent;
  /** Shared scene reservations remain service-owned, with the original lazy lookup lifetime. */
  private _movementOccupancyService?: MovementOccupancyService;

  constructor(readonly gameObject: Phaser.GameObjects.GameObject) {}

  /** Keep component/service reads in the original ready-callback order. */
  init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    this.tileMapComponent = getSceneComponent(this.gameObject.scene, TilemapComponent)!;
  }

  get navigationService(): NavigationService | undefined {
    this._navigationService = this._navigationService ?? getSceneService(this.gameObject.scene, NavigationService);
    return this._navigationService;
  }

  get movementOccupancyService(): MovementOccupancyService | undefined {
    this._movementOccupancyService =
      this._movementOccupancyService ?? getSceneService(this.gameObject.scene, MovementOccupancyService);
    return this._movementOccupancyService;
  }
}
