import { Howl } from "howler";
import type { GameSoundCue } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";

const soundFiles: Record<GameSoundCue["kind"], string> = {
  spawn: "spawn.wav",
  baloon: "baloon.wav",
  cash: "cash.wav",
  die: "die.wav",
  pew: "arrwdth_09.wav",
  cannon: "cannon.wav",
  buildWall: "wallUpgrade.wav",
  select: "select.wav",
  buy: "buy.wav",
  upgrade: "towerUpgrade.wav",
  lifeLost: "woodhit_06.wav"
};
const rapidFireFiles = new Set([soundFiles.pew, soundFiles.cannon]);
const rapidFireVolumes: Record<string, number> = {
  [soundFiles.pew]: 0.12,
  [soundFiles.cannon]: 0.16
};
const rapidFireIntervalMs = 160;

/** Routes world-originating effects through camera-relative attenuation and stereo panning. */
export class GameAudio {
  private music: Howl | null = null;
  private readonly effects = new Map<string, Howl>();
  private readonly lastRapidFireMs = new Map<string, number>();
  private muted = false;
  private lastWorkSoundMs = 0;
  private lastWallSoundMs = 0;
  private lastSlumSoundMs = 0;

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
    this.playFile(soundFiles[cue.kind], cue.worldX, cameraX, pan?.volume);
  }

  /** Restores the source game's wall-work and slum chatter zones around the RTS camera. */
  updateCameraArea(cameraX: number, mapWidth: number): void {
    if (this.muted) return;
    const now = performance.now();
    if (cameraX > mapWidth - 10 && now - this.lastWorkSoundMs >= 6000) {
      this.lastWorkSoundMs = now;
      const wallX = mapWidth + 24;
      this.playFile("hammer.wav", wallX, cameraX, 0.38);
      this.playFile("puller_strain.wav", wallX, cameraX, 0.24);
      this.playFile("mason_chip1.wav", wallX, cameraX, 0.2);
      this.playFile("metrock_03.wav", wallX, cameraX, 0.2);
      for (const file of [
        "constr1.wav",
        "constr2.wav",
        "constr3.wav",
        "constr4.wav",
        "constr5.wav",
        "constr6.wav",
        "constr7.wav"
      ]) {
        this.playFile(file, wallX, cameraX, 0.15);
      }
    } else if (cameraX <= mapWidth - 10) {
      this.lastWorkSoundMs = 0;
    }
    if (cameraX > mapWidth + 40 && now - this.lastWallSoundMs >= 6000) {
      this.lastWallSoundMs = now;
      this.playFile("buildWall.wav", mapWidth + 48, cameraX, 0.5);
    } else if (cameraX <= mapWidth + 40) {
      this.lastWallSoundMs = 0;
    }
    if (cameraX < -20 && now - this.lastSlumSoundMs >= 12000) {
      this.lastSlumSoundMs = now;
      this.playFile("mexicoChatter.wav", -40, cameraX, 0.45);
    } else if (cameraX >= -20) {
      this.lastSlumSoundMs = 0;
    }
  }

  private spatialMix(sourceX: number, cameraX: number): { volume: number; pan: number } | null {
    const relativeX = sourceX - cameraX;
    if (Math.abs(relativeX) > 55) return null;
    return {
      volume: 0.3 * Math.max(0.08, 1 - Math.abs(relativeX) / 70),
      pan: Math.max(-1, Math.min(1, relativeX / 55))
    };
  }

  private playFile(file: string, sourceX?: number, cameraX = 0, volume = 0.3): void {
    if (rapidFireFiles.has(file)) {
      const now = performance.now();
      const lastPlayed = this.lastRapidFireMs.get(file) ?? Number.NEGATIVE_INFINITY;
      if (now - lastPlayed < rapidFireIntervalMs) return;
      this.lastRapidFireMs.set(file, now);
      volume = Math.min(volume, rapidFireVolumes[file] ?? volume);
    }
    let effect = this.effects.get(file);
    if (!effect) {
      effect = new Howl({ src: [assetUrl(`sfx/${file}`)], volume, pool: rapidFireFiles.has(file) ? 1 : 3 });
      this.effects.set(file, effect);
    }
    if (rapidFireFiles.has(file)) effect.stop();
    const id = effect.play();
    effect.volume(volume, id);
    if (sourceX !== undefined) {
      const pan = this.spatialMix(sourceX, cameraX)?.pan ?? 0;
      effect.stereo(pan, id);
    }
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
    this.lastWallSoundMs = 0;
    this.lastWorkSoundMs = 0;
    this.lastSlumSoundMs = 0;
    this.lastRapidFireMs.clear();
  }

  dispose(): void {
    this.stop();
    for (const effect of this.effects.values()) effect.unload();
    this.effects.clear();
  }
}
