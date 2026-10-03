import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  isDevMode,
  signal,
  viewChild,
  type AfterViewInit,
  type OnDestroy
} from "@angular/core";
import { Location } from "@angular/common";
import {
  buildWall,
  buyTower,
  createGame,
  selectTile,
  stepGame,
  togglePause,
  upgradeTower,
  type ActionResult,
  type GameState,
  type TowerKind
} from "@fuzzy-waddle/trump-defense-gameplay";
import { loadLevel } from "./asset-paths";
import { GameAudio } from "./game-audio";
import { getUnlockedLevels, unlockLevel } from "./level-progress";
import { deriveHud } from "./trump-defense-hud";
import { getLevelTutorial } from "./level-tutorial";
import { LevelTutorialComponent } from "./level-tutorial.component";
import { ThreeScene } from "./three-scene";
import { emptyHud, levelChoices } from "./trump-defense-ui-config";
import type { TutorialShowcaseSelection } from "@fuzzy-waddle/trump-defense-gameplay";
import type { TrumpDefensePhase } from "./trump-defense-ui-state";

@Component({
  selector: "fuzzy-waddle-trump-defense",
  templateUrl: "./trump-defense.component.html",
  styleUrl: "./trump-defense.component.scss",
  imports: [LevelTutorialComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "td-shell", "(window:keydown)": "onKeydown($event)" }
})
export class TrumpDefenseComponent implements AfterViewInit, OnDestroy {
  private readonly location = inject(Location);
  private readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>("viewport");
  private readonly audio = new GameAudio();
  private scene: ThreeScene | null = null;
  private game: GameState | null = null;
  private frameId = 0;
  private showcaseFrameId = 0;
  private lastFrame = 0;
  private accumulator = 0;
  private destroyed = false;
  private loadToken = 0;

  protected readonly phase = signal<TrumpDefensePhase>("selecting");
  protected readonly showProjectInfo = signal(false);
  protected readonly levelNumber = signal<1 | 2 | 3>(1);
  protected readonly finalLevel = computed(() => this.levelNumber() === 3);
  protected readonly levelChoices = levelChoices;
  protected readonly unlockedLevels = signal(getUnlockedLevels(isDevMode()));
  protected readonly hud = signal(emptyHud);
  protected readonly message = signal("Loading the original map…");
  protected readonly muted = signal(false);

  ngAfterViewInit(): void {
    this.message.set("Select an unlocked level to begin.");
  }

  /** A level owns fresh simulation, scene, and audio state; stale async loads are ignored. */
  private async load(index: 1 | 2 | 3): Promise<void> {
    const token = ++this.loadToken;
    cancelAnimationFrame(this.frameId);
    this.audio.stop();
    this.scene?.dispose();
    this.scene = null;
    this.game = null;
    this.phase.set("loading");
    this.levelNumber.set(index);
    this.message.set(`Loading level ${index}…`);
    try {
      const level = await loadLevel(index);
      if (this.destroyed || token !== this.loadToken) return;
      const scene = new ThreeScene(this.viewport().nativeElement);
      this.scene = scene;
      await scene.load(level);
      if (this.destroyed || token !== this.loadToken) {
        scene.dispose();
        return;
      }
      this.game = createGame(level);
      scene.sync(this.game);
      scene.render();
      this.updateHud();
      this.scene.setShowcase(getLevelTutorial(index)[0]?.showcase ?? null);
      this.phase.set("tutorial");
      this.message.set(`Level ${index} briefing. Skip it any time to deploy.`);
      this.animateShowcase();
    } catch (error) {
      if (this.destroyed || token !== this.loadToken) return;
      this.scene?.dispose();
      this.scene = null;
      this.phase.set("error");
      this.message.set(error instanceof Error ? error.message : "The 3D scene could not load.");
    }
  }

  protected start(): void {
    if (!this.game || this.phase() !== "tutorial") return;
    cancelAnimationFrame(this.showcaseFrameId);
    this.scene?.setShowcase(null);
    this.phase.set("playing");
    this.message.set(`Defend the route and raise the wall to ${this.game.level.rules.wallGoal}.`);
    this.audio.startMusic(this.game.level.music);
    this.schedule();
  }

  /** Keeps the tutorial model turning while the gameplay simulation stays paused. */
  private readonly animateShowcase = (): void => {
    if (this.destroyed || this.phase() !== "tutorial" || !this.scene) return;
    this.scene.rotateShowcase();
    this.showcaseFrameId = requestAnimationFrame(this.animateShowcase);
  };

  protected readonly setShowcase = (visual: TutorialShowcaseSelection): void => this.scene?.setShowcase(visual);

  /** First returns from a level to the picker; the picker delegates to browser history. */
  protected readonly goBack = (): void =>
    this.phase() === "selecting" ? this.location.back() : this.returnToSelection();

  protected chooseLevel(index: 1 | 2 | 3): void {
    if (!this.unlockedLevels().includes(index)) return;
    void this.load(index);
  }

  private schedule(): void {
    this.lastFrame = 0;
    this.accumulator = 0;
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number): void => {
    if (this.destroyed || this.phase() !== "playing" || !this.game || !this.scene) return;
    const elapsed = this.lastFrame ? Math.min(250, now - this.lastFrame) : 0;
    this.lastFrame = now;
    this.accumulator += elapsed;
    while (this.accumulator >= 100 && this.game.status === "playing") {
      stepGame(this.game, 100);
      for (const sound of this.game.sounds.splice(0)) this.audio.play(sound, this.scene.cameraX);
      this.scene.sync(this.game);
      this.accumulator -= 100;
    }
    this.audio.updateCameraArea(
      this.scene.cameraX,
      this.game.level.grid.width * this.game.level.grid.tileSize,
      this.scene.cameraHeight
    );
    this.scene.render();
    this.updateHud();
    if (this.game.status === "lost") {
      this.phase.set("lost");
      this.audio.stop();
      this.message.set("The wall has fallen. Regroup and try again.");
      return;
    }
    this.frameId = requestAnimationFrame(this.frame);
  };

  private updateHud(): void {
    if (!this.game) return;
    this.hud.set(deriveHud(this.game));
  }

  private apply(result: ActionResult): void {
    if (!this.game) return;
    this.message.set(result.message);
    for (const sound of this.game.sounds) this.audio.play(sound, this.scene?.cameraX ?? 64);
    this.game.sounds.length = 0;
    this.scene?.sync(this.game);
    this.scene?.render();
    this.updateHud();
    if (this.game.status === "won") {
      this.unlockedLevels.set(unlockLevel(this.levelNumber(), isDevMode()));
      this.phase.set("won");
      this.audio.stop();
      this.audio.play({ kind: "victory" }, this.scene?.cameraX ?? 64);
      cancelAnimationFrame(this.frameId);
      this.message.set(
        this.finalLevel() ? "All three levels held. Campaign complete!" : "Wall complete. Next level unlocked."
      );
    }
  }

  protected onPointer(event: PointerEvent): void {
    if (!this.game || this.phase() !== "playing") return;
    const tile = this.scene?.pick(event);
    if (tile) this.apply(selectTile(this.game, tile));
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.scene?.zoom(event.deltaY);
    this.scene?.render();
  }

  protected panCamera(dx: number, dz: number): void {
    this.scene?.pan(dx, dz);
    // The next active frame renders and remixes audio from the updated camera.
  }

  protected buy(kind: TowerKind): void {
    if (this.game) this.apply(buyTower(this.game, kind, Math.random));
  }

  protected upgrade(): void {
    if (this.game) this.apply(upgradeTower(this.game));
  }
  protected wall(): void {
    if (this.game) this.apply(buildWall(this.game));
  }

  protected pause(): void {
    if (!this.game || (this.phase() !== "playing" && this.phase() !== "paused")) return;
    togglePause(this.game);
    this.phase.set(this.game.status === "paused" ? "paused" : "playing");
    if (this.game.status === "paused") {
      this.message.set("Game paused.");
      cancelAnimationFrame(this.frameId);
      this.audio.pause();
    } else {
      this.audio.resume();
      this.schedule();
    }
  }

  protected toggleSound(): void {
    this.muted.update((value) => !value);
    this.audio.setMuted(this.muted());
  }

  protected toggleProjectInfo(): void {
    this.showProjectInfo.update((visible) => !visible);
  }

  protected retry(): void {
    void this.load(this.levelNumber());
  }
  /** Leaves the current run and rebuilds the campaign picker on the next level choice. */
  protected returnToSelection(): void {
    this.loadToken++;
    cancelAnimationFrame(this.frameId);
    cancelAnimationFrame(this.showcaseFrameId);
    this.audio.stop();
    this.scene?.dispose();
    this.scene = null;
    this.game = null;
    this.phase.set("selecting");
    this.message.set("Select an unlocked level to begin.");
  }
  protected next(): void {
    const index = this.levelNumber();
    if (index < 3) this.chooseLevel((index + 1) as 1 | 2 | 3);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
    if (key === "enter" && this.phase() === "tutorial") return this.start();
    if (key === "enter" && this.phase() === "selecting") return this.chooseLevel(1);
    if (key === "enter" && this.phase() === "won") return this.finalLevel() ? this.returnToSelection() : this.next();
    if (key === "enter" && this.phase() === "lost") return this.retry();
    if (key === "enter" && this.phase() === "error") return this.retry();
    if (key === "p") return this.pause();
    if (this.phase() !== "playing") return;
    if (key === "b") this.buy("SniperTower");
    else if (key === "c") this.buy("Cannon");
    else if (key === "u") this.upgrade();
    else if (key === " ") this.wall();
    else {
      const dx = key === "arrowleft" || key === "a" ? -8 : key === "arrowright" || key === "d" ? 8 : 0;
      const dz = key === "arrowup" || key === "w" ? -8 : key === "arrowdown" || key === "s" ? 8 : 0;
      if (dx || dz) this.panCamera(dx, dz);
    }
  }

  protected onContextLost(event: Event): void {
    event.preventDefault();
    cancelAnimationFrame(this.frameId);
    this.audio.stop();
    this.phase.set("error");
    this.message.set("WebGL was interrupted. Retry the level to rebuild the scene.");
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadToken++;
    cancelAnimationFrame(this.frameId);
    cancelAnimationFrame(this.showcaseFrameId);
    this.audio.dispose();
    this.scene?.dispose();
  }
}
