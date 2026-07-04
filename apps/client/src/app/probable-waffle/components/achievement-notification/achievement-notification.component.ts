import { Component, inject, type OnDestroy, type OnInit, input } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";

import { AtlasSpriteComponent } from "../atlas-sprite/atlas-sprite.component";
import { AudioAtlasService } from "../../services/audio-atlas/audio-atlas.service";

@Component({
  selector: "fuzzy-waddle-achievement-notification",
  standalone: true,
  imports: [AtlasSpriteComponent],
  templateUrl: "./achievement-notification.component.html",
  styleUrls: ["./achievement-notification.component.scss"]
})
export class AchievementNotificationComponent implements OnInit, OnDestroy {
  readonly title = input<string>("");
  readonly description = input<string>("");
  readonly spriteId = input<string>("");
  readonly autoHide = input<boolean>(true);
  readonly autoHideDuration = input<number>(5000); // 5 seconds default

  visible = false;
  private hideTimeout?: number;
  private soundId = -1;

  private readonly audioAtlasService = inject(AudioAtlasService);

  ngOnInit() {
    // Small delay before showing to ensure CSS is fully applied
    setTimeout(() => this.show(), 10);
  }

  ngOnDestroy() {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }
    // Stop any playing sounds when component is destroyed
    if (this.soundId >= 0) {
      this.audioAtlasService.stopSound(this.soundId);
    }
  }

  show() {
    // Clear any existing timeout
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }

    // Play achievement sound
    this.audioAtlasService.playSound("achievement").then((id) => {
      this.soundId = id;
    });

    this.visible = true;

    if (this.autoHide()) {
      this.hideTimeout = window.setTimeout(() => {
        this.hide();
      }, this.autoHideDuration());
    }
  }

  hide() {
    this.visible = false;
  }
}
