import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectVisibility, isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { HealthComponent } from "../components/combat/components/health-component";
import { TerrainType } from "../../world/services/navigation.service";
import { OrderType } from "../../ai/order-type";
import type { OrderData } from "../../ai/OrderData";
import {
  SharedActorActionsSfxGrassSounds,
  SharedActorActionsSfxGravelSounds,
  SharedActorActionsSfxSandSounds,
  SharedActorActionsSfxSnowSounds,
  SharedActorActionsSfxStoneSounds
} from "../../sfx/shared-actor-actions-sfx";
import type { MovementRuntime } from "./movement-runtime";

/** Movement sound, direction and animation callbacks; visual randomness never selects a route or duration. */
export class MovementPresentation {
  constructor(private readonly runtime: MovementRuntime) {}

  playOrderSound(action: OrderData) {
    if (!this.runtime.audioActorComponent) return;
    this.runtime.audioActorComponent.playOrderSound(action);
  }

  onMovementStart(newTileWorldXY: Vector3Simple, config?: PathMoveConfig | Partial<PathMoveConfig>) {
    this.playMovementSound();
    if (this.runtime.actorTranslateComponent) this.runtime.actorTranslateComponent.updateDirection(newTileWorldXY);
    this.playMovementAnimation(true, config);
  }

  private playMovementSound() {
    if (!this.runtime.audioService) return;
    const visibilityComponent = getGameObjectVisibility(this.runtime.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    const movementSoundDefinition = this.getMovementSound();
    if (!movementSoundDefinition) return;
    // get random from movementSoundDefinition
    // can be random as it doesn't need to be deterministic
    const randomIndex = Math.floor(Math.random() * movementSoundDefinition.length);
    const movementSound = movementSoundDefinition[randomIndex]!;
    this.runtime.audioService.playSpatialAudioSprite(this.runtime.gameObject, movementSound.key, movementSound.spriteName, {
      volume: 70 // make it quieter so it doesn't drown out other sounds
    });
  }

  playMovementAnimation(isMoving: boolean, config?: PathMoveConfig) {
    if (!this.runtime.animationActorComponent) return;
    if (config?.ignoreAnimations) return;
    if (!isGameObjectActiveInActiveScene(this.runtime.gameObject)) return;
    const isKilled = getActorComponent(this.runtime.gameObject, HealthComponent)?.killed ?? false;
    if (isKilled) return;
    this.runtime.animationActorComponent.playOrderAnimation(isMoving ? OrderType.Move : OrderType.Stop);
  }

  private getMovementSound() {
    const navigationService = this.runtime.navigationService;
    if (!this.runtime.audioService || !navigationService) return;
    const terrainUnderActor = navigationService.getTerrainUnderActor(this.runtime.gameObject);
    if (!terrainUnderActor) {
      console.warn("No terrain under actor");
      return SharedActorActionsSfxGravelSounds; // default to gravel
    }
    switch (terrainUnderActor) {
      case TerrainType.Grass:
        return SharedActorActionsSfxGrassSounds;
      case TerrainType.Gravel:
        return SharedActorActionsSfxGravelSounds;
      case TerrainType.Water:
        // console.warn("No movement sound for water");
        return undefined; // todo add water sound, but it should not be played when crossing the bridge
      case TerrainType.Sand:
        return SharedActorActionsSfxSandSounds;
      case TerrainType.Snow:
        return SharedActorActionsSfxSnowSounds;
      case TerrainType.Stone:
        return SharedActorActionsSfxStoneSounds;
      default:
        console.warn("No movement sound for terrain type", terrainUnderActor);
        return undefined;
    }
  }
}
