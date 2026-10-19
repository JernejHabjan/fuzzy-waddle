import Phaser from "phaser";
import { type Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { GameSetupHelpers, ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getCurrentPlayerNumber, getPlayers } from "../../data/scene-data";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { AudioService } from "../../world/services/audio.service";
import { AudioSprites } from "../../sfx/audio-sprites";
import { UiFeedbackSfx } from "../../hud/UiFeedbackSfx";
import type HudProbableWaffle from "../../world/scenes/hud-scenes/HudProbableWaffle";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { Subscription } from "rxjs";

/**
 * Owns the non-deterministic minimap-signal interaction. It intentionally uses
 * the ordinary communicator instead of lockstep commands so a ping cannot
 * affect simulation, saves, or replays.
 */
export class MinimapSignalController {
  private static readonly LOCAL_COOLDOWN_MS = 2_000;
  private armed = false;
  private readonly consumedPointerIds = new Set<number>();
  private nextSignalAt = 0;
  private signalSubscription?: Subscription;
  private modalSubscription?: Subscription;
  private externalModalOpen = false;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hud: HudProbableWaffle
  ) {
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.handleWorldPointerUp, this);
    this.hud.input.keyboard?.on("keydown-G", this.handleSignalShortcut, this);
    this.hud.input.keyboard?.on("keydown-ESC", this.cancel, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleRightClickCancel, this);
    this.signalSubscription = this.scene.communicator.minimapSignal?.on.subscribe((signal) => this.renderSignal(signal.tile, signal.playerNumber));
    this.modalSubscription = this.scene.communicator.allScenes.subscribe((event) => {
      if (event.name === "external-modal-opened") this.externalModalOpen = true;
      else if (event.name === "external-modal-closed") this.externalModalOpen = false;
    });
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  isArmed(): boolean {
    return this.armed;
  }

  canSignal(): boolean {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) return false;
    if (this.externalModalOpen) return false;
    if (!this.scene.communicator.activeSocket || !this.scene.communicator.minimapSignal) return false;
    if (Date.now() < this.nextSignalAt) return false;
    const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
    if (currentPlayerNumber === undefined) return false;
    const currentDefinition = this.scene.baseGameData.gameInstance.getPlayerByNumber(currentPlayerNumber)?.playerController.data.playerDefinition;
    if (currentDefinition?.playerType !== ProbableWafflePlayerType.Human) return false;
    const currentTeam = currentDefinition.team ?? currentPlayerNumber;
    return getPlayers(this.scene).some((player) => {
      const definition = player.playerController.data.playerDefinition;
      return (
        player.playerNumber !== currentPlayerNumber &&
        definition?.playerType === ProbableWafflePlayerType.Human &&
        !player.playerController.data.leftOrKilled &&
        (definition?.team ?? player.playerNumber) === currentTeam
      );
    });
  }

  toggle(): void {
    if (!this.canSignal()) return;
    this.armed ? this.cancel() : this.arm();
  }

  arm(): void {
    if (!this.canSignal()) return;
    this.armed = true;
  }

  cancel(): void {
    this.armed = false;
  }

  /** Called by Minimap before its camera/order behavior handles a left click. */
  trySignalMinimapTile(tile: Vector2Simple, pointer: Phaser.Input.Pointer): boolean {
    const altSignal = pointer.leftButtonDown() && pointer.event.altKey;
    if (!this.armed && !altSignal) return false;
    if (!pointer.leftButtonDown()) return false;
    const sent = this.sendSignal(tile);
    if (sent) this.consumedPointerIds.add(pointer.id);
    // Targeting input is consumed even during the mirrored cooldown so it
    // cannot unexpectedly turn into a camera movement or unit order.
    return true;
  }

  isPointerConsumed(pointer: Phaser.Input.Pointer): boolean {
    return this.consumedPointerIds.has(pointer.id);
  }

  private handleSignalShortcut(event: KeyboardEvent): void {
    if (!event.altKey) return;
    event.preventDefault();
    this.toggle();
  }

  private handleRightClickCancel(pointer: Phaser.Input.Pointer): void {
    if (this.armed && pointer.rightButtonDown()) this.cancel();
  }

  private handleWorldPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.isPointerConsumed(pointer)) {
      setTimeout(() => this.consumedPointerIds.delete(pointer.id));
      return;
    }
    const altSignal = pointer.leftButtonReleased() && pointer.event.altKey;
    if ((!this.armed && !altSignal) || !pointer.leftButtonReleased()) return;
    if (this.hud.input.hitTestPointer(pointer).length > 0) return;

    const worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const clickedTile = IsoHelper.isometricWorldToTileXY(this.scene, worldPosition.x, worldPosition.y, false);
    const tile = { x: Math.floor(clickedTile.x), y: Math.floor(clickedTile.y) };
    if (this.sendSignal(tile)) this.consumedPointerIds.add(pointer.id);
  }

  private sendSignal(tile: Vector2Simple): boolean {
    if (!this.canSignal() || Date.now() < this.nextSignalAt) return false;
    const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
    if (currentPlayerNumber === undefined) return false;

    this.nextSignalAt = Date.now() + MinimapSignalController.LOCAL_COOLDOWN_MS;
    this.armed = false;
    this.scene.communicator.minimapSignal!.emit({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: null,
      playerNumber: currentPlayerNumber,
      tile
    });
    this.renderSignal(tile, currentPlayerNumber);
    this.hud.refreshMinimapSignalButton();
    this.hud.time.delayedCall(MinimapSignalController.LOCAL_COOLDOWN_MS, () => this.hud.refreshMinimapSignalButton());
    return true;
  }

  private renderSignal(tile: Vector2Simple, playerNumber: number): void {
    const { hue, saturation, lightness } = GameSetupHelpers.getHslColorForPlayer(
      playerNumber,
      this.scene.mapInfo.mapInfo.startPositionsOnTile.length,
      this.scene.gameInstanceId
    );
    const color = Phaser.Display.Color.HSLToColor(hue / 360, saturation / 100, lightness / 100).color;
    const world = IsoHelper.isometricTileToWorldXY(this.scene, tile.x, tile.y);
    const graphics = this.scene.add.graphics().setDepth(100_000);
    this.scene.tweens.addCounter({
      from: 12,
      to: 60,
      duration: 1_500,
      onUpdate: (tween) => {
        const progress = tween.getValue() / 60;
        graphics.clear();
        for (const delay of [0, 0.22, 0.44]) {
          const ringProgress = Math.max(0, (progress - delay) / (1 - delay));
          if (ringProgress === 0) continue;
          graphics.lineStyle(3, color, 1 - ringProgress);
          graphics.strokeCircle(world.x, world.y, 12 + ringProgress * 48);
        }
      },
      onComplete: () => graphics.destroy()
    });
    this.hud.displayMinimapSignal(tile, color);
    getSceneService(this.scene, AudioService)?.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUTTON_CLICK);
  }

  private destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handleWorldPointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleRightClickCancel, this);
    this.hud.input.keyboard?.off("keydown-G", this.handleSignalShortcut, this);
    this.hud.input.keyboard?.off("keydown-ESC", this.cancel, this);
    this.signalSubscription?.unsubscribe();
    this.modalSubscription?.unsubscribe();
  }
}
