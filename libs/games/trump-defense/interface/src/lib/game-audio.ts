import { Howl } from "howler";
import type { GameSoundCue } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";

export const soundFiles: Record<GameSoundCue["kind"], string> = {
  spawn: "firepop2.wav",
  baloon: "baloon.wav",
  cash: "cash.wav",
  die: "die.wav",
  pew: "arrwdth_09.wav",
  cannon: "cannon.wav",
  buildWall: "wallUpgrade.wav",
  select: "select.wav",
  buy: "buy.wav",
  upgrade: "towerUpgrade.wav",
  lifeLost: "woodhit_06.wav",
  victory: "cheer2.wav",
  buildWallOpening: "buildWall.wav"
};
const rapidFireFiles = new Set([soundFiles.pew, soundFiles.cannon]);
const rapidFireVolumes: Record<string, number> = {
  [soundFiles.pew]: 0.24,
  [soundFiles.cannon]: 0.28
};
const positionalActionVolumes: Partial<Record<GameSoundCue["kind"], number>> = {
  buy: 0.6,
  upgrade: 0.6
};
const rapidFireIntervalMs = 160;
type AmbientZone = "work" | "wall" | "slums";

/** A live sound retains its origin and gain so camera movement can update the mix. */
interface SpatialVoice {
  file: string;
  id: number;
  sourceX: number;
  volume: number;
  zone?: AmbientZone;
}

/** Routes world-originating effects through camera-relative attenuation and stereo panning. */
export class GameAudio {
  private music: Howl | null = null;
  private readonly effects = new Map<string, Howl>();
  private readonly lastRapidFireMs = new Map<string, number>();
  private muted = false;
  private voices: SpatialVoice[] = [];
  private hearingScale = 1;
  private lastWorkSoundMs = Number.NEGATIVE_INFINITY;
  private lastWallSoundMs = Number.NEGATIVE_INFINITY;
  private lastSlumSoundMs = Number.NEGATIVE_INFINITY;

  startMusic(path: string): void {
    this.music?.unload();
    this.music = new Howl({ src: [assetUrl(path)], html5: true, loop: true, volume: 0.35 });
    if (!this.muted) this.music.play();
  }

  play(cue: GameSoundCue, cameraX: number): void {
    if (this.muted) return;
    if ((cue.kind === "spawn" || cue.kind === "baloon") && cameraX >= 30) return;
    if (cue.kind === "select" && cue.worldX === undefined) return;
    const pan = cue.worldX === undefined ? undefined : this.spatialMix(cue.worldX, cameraX);
    if (cue.worldX !== undefined && !pan) return;
    this.playFile(soundFiles[cue.kind], cue.worldX, cameraX, positionalActionVolumes[cue.kind] ?? 0.3);
  }

  /** Restores the source game's wall-work and slum chatter zones around the RTS camera. */
  updateCameraArea(cameraX: number, mapWidth: number, cameraHeight = 50): void {
    this.hearingScale = Math.min(1, 50 / Math.max(1, cameraHeight));
    if (this.muted) return;
    const now = performance.now();
    if (cameraX > mapWidth - 10 && now - this.lastWorkSoundMs >= 6000) {
      this.lastWorkSoundMs = now;
      const wallX = mapWidth + 24;
      this.playFile("hammer.wav", wallX, cameraX, 0.38, "work");
      this.playFile("puller_strain.wav", wallX, cameraX, 0.24, "work");
      this.playFile("mason_chip1.wav", wallX, cameraX, 0.2, "work");
      this.playFile("metrock_03.wav", wallX, cameraX, 0.2, "work");
      for (const file of [
        "constr1.wav",
        "constr2.wav",
        "constr3.wav",
        "constr4.wav",
        "constr5.wav",
        "constr6.wav",
        "constr7.wav"
      ]) {
        this.playFile(file, wallX, cameraX, 0.15, "work");
      }
    } else if (cameraX <= mapWidth - 10) {
      this.lastWorkSoundMs = Number.NEGATIVE_INFINITY;
      this.fadeZone("work", 200);
    }
    if (cameraX > mapWidth + 40 && now - this.lastWallSoundMs >= 6000) {
      this.lastWallSoundMs = now;
      this.playFile("buildWall.wav", mapWidth + 48, cameraX, 0.5, "wall");
    } else if (cameraX <= mapWidth + 40) {
      this.lastWallSoundMs = Number.NEGATIVE_INFINITY;
      this.fadeZone("wall", 1000);
    }
    if (cameraX < -20 && now - this.lastSlumSoundMs >= 12000) {
      this.lastSlumSoundMs = now;
      this.playFile("mexicoChatter.wav", -40, cameraX, 0.45, "slums");
    } else if (cameraX >= -20) {
      this.lastSlumSoundMs = Number.NEGATIVE_INFINITY;
      this.fadeZone("slums", 1000);
    }
    this.updateVoices(cameraX);
  }

  private spatialMix(sourceX: number, cameraX: number): { volume: number; pan: number } | null {
    const relativeX = sourceX - cameraX;
    if (Math.abs(relativeX) > 55) return null;
    return {
      volume: 0.3 * Math.max(0.08, 1 - Math.abs(relativeX) / 70) * this.hearingScale,
      pan: Math.max(-1, Math.min(1, relativeX / 55))
    };
  }

  private playFile(file: string, sourceX?: number, cameraX = 0, volume = 0.3, zone?: AmbientZone): void {
    if (rapidFireFiles.has(file)) {
      const now = performance.now();
      const lastPlayed = this.lastRapidFireMs.get(file) ?? Number.NEGATIVE_INFINITY;
      if (now - lastPlayed < rapidFireIntervalMs) return;
      this.lastRapidFireMs.set(file, now);
      volume = Math.min(volume, rapidFireVolumes[file] ?? volume);
    }
    let effect = this.effects.get(file);
    if (!effect) {
      effect = new Howl({ src: [assetUrl(`sfx/${file}`)], volume, pool: rapidFireFiles.has(file) || zone ? 1 : 3 });
      this.effects.set(file, effect);
    }
    // Ambient samples used fixed source channels: replace their voice rather than stacking long recordings.
    if (rapidFireFiles.has(file) || zone) {
      effect.stop();
      this.voices = this.voices.filter((voice) => voice.file !== file);
    }
    const id = effect.play();
    effect.volume(volume, id);
    if (sourceX !== undefined) {
      const voice: SpatialVoice = { file, id, sourceX, volume, zone };
      this.voices.push(voice);
      this.mixVoice(voice, cameraX);
    }
  }

  /** Repositions live voices without restarting samples or accumulating new playback. */
  private updateVoices(cameraX: number): void {
    this.voices = this.voices.filter((voice) => {
      const effect = this.effects.get(voice.file);
      // Howler queues playback during loading; keep its origin until that queued voice can start.
      return effect && (effect.state() !== "loaded" || effect.playing(voice.id));
    });
    for (const voice of this.voices) this.mixVoice(voice, cameraX);
  }

  private mixVoice(voice: SpatialVoice, cameraX: number): void {
    const mix = this.spatialMix(voice.sourceX, cameraX);
    const effect = this.effects.get(voice.file);
    effect?.volume(voice.volume * (mix ? mix.volume / 0.3 : 0), voice.id);
    effect?.stereo(mix?.pan ?? 0, voice.id);
  }

  /** Remove fading voices from updates so camera mixing cannot undo their fade. */
  private fadeZone(zone: AmbientZone, durationMs: number): void {
    for (const voice of this.voices.filter((voice) => voice.zone === zone)) {
      const effect = this.effects.get(voice.file);
      if (!effect) continue;
      effect.once("fade", () => effect.stop(voice.id), voice.id);
      const volume = effect.volume(voice.id);
      if (typeof volume === "number") effect.fade(volume, 0, durationMs, voice.id);
    }
    this.voices = this.voices.filter((voice) => voice.zone !== zone);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.music?.mute(muted);
    for (const effect of this.effects.values()) effect.mute(muted);
    if (!muted && this.music && !this.music.playing()) this.music.play();
  }

  pause(): void {
    this.music?.pause();
  }
  resume(): void {
    if (!this.muted) this.music?.play();
  }

  stop(): void {
    this.music?.unload();
    this.music = null;
    for (const effect of this.effects.values()) effect.stop();
    this.lastWallSoundMs = Number.NEGATIVE_INFINITY;
    this.lastWorkSoundMs = Number.NEGATIVE_INFINITY;
    this.lastSlumSoundMs = Number.NEGATIVE_INFINITY;
    this.lastRapidFireMs.clear();
    this.voices = [];
  }

  dispose(): void {
    this.stop();
    for (const effect of this.effects.values()) effect.unload();
    this.effects.clear();
  }
}
