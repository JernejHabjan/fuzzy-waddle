import { ChangeDetectionStrategy, Component, ElementRef, type OnDestroy, type OnInit, viewChild } from "@angular/core";
import type Phaser from "phaser";

@Component({
  selector: "probable-waffle-banner",
  template: `<div #gameContainer style="height: calc(100dvh - 6rem)"></div> `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerComponent implements OnInit, OnDestroy {
  readonly gameContainer = viewChild.required<ElementRef>("gameContainer");

  private game: Phaser.Game | null = null;
  private isDestroyed = false;

  ngOnInit(): void {
    void this.initializeGame();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.game?.destroy(true);
    this.game = null;
  }

  private async initializeGame(): Promise<void> {
    const { createBannerGame } = await import("./phaser/create-banner-game");

    if (this.isDestroyed) {
      return;
    }

    this.game = createBannerGame(this.gameContainer().nativeElement);
  }
}
