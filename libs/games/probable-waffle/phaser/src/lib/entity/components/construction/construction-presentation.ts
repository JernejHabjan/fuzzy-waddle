import type Phaser from "phaser";
import { getGameObjectVisibility } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import {
  SharedActorActionsSfxHammeringSounds,
  SharedActorActionsSfxSawingSounds,
  SharedActorActionsSfxSelectionSounds
} from "../../../sfx/shared-actor-actions-sfx";

/** Construction audio only; the facade owns the saved playback flag and all simulation/lifecycle work. */
export class ConstructionPresentation {
  private audioService?: AudioService;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly isPlaying: () => boolean,
    private readonly setPlaying: (playing: boolean) => void
  ) {}

  /** Called at the facade's original ready-time service lookup, before its cached health lookup. */
  init(): void {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  /** Set the saved flag before playback; native throws and late completion callbacks retain their original effects. */
  playBuildSound(): void {
    if (!this.audioService) return;
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    if (this.isPlaying()) return;
    this.setPlaying(true);
    const soundDefinitions = [...SharedActorActionsSfxHammeringSounds, ...SharedActorActionsSfxSawingSounds];
    // can be random as it doesn't need to be deterministic
    const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
    this.audioService.playSpatialAudioSprite(
      this.gameObject,
      soundDefinition.key,
      soundDefinition.spriteName,
      undefined,
      { onComplete: () => { this.setPlaying(false); } }
    );
  }

  /** Visible completion still selects a sound when audio is unavailable, preserving presentation RNG order. */
  playCompletionSound(): void {
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (visibilityComponent && visibilityComponent.visible) {
      const soundDefinitions = SharedActorActionsSfxSelectionSounds;
      // can be random as it doesn't need to be deterministic
      const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
      this.audioService?.playSpatialAudioSprite(this.gameObject, soundDefinition.key, soundDefinition.spriteName);
    }
  }
}
