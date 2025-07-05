import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";

import { AtlasSpriteComponent } from "../atlas-sprite/atlas-sprite.component";
import { AudioAtlasService } from "../../audio-atlas/audio-atlas.service";

@Component({
  selector: "fuzzy-waddle-achievement-notification",
  standalone: true,
  imports: [AtlasSpriteComponent],
  templateUrl: "./achievement-notification.component.html",
  styleUrls: ["./achievement-notification.component.scss"],
  animations: [
    trigger("notificationAnimation", [
      // Element starts completely off-screen and invisible
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate("300ms cubic-bezier(0.16, 1, 0.3, 1)", style({ transform: "translateX(0)", opacity: 1 }))
      ]),
      // Element slides out and fades away
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate("300ms cubic-bezier(0.7, 0, 0.84, 0)", style({ transform: "translateX(100%)", opacity: 0 }))
      ])
    ])
  ]
})
export class AchievementNotificationComponent implements OnInit, OnDestroy {
  @Input() title: string = "";
  @Input() description: string = "";
  @Input() spriteId: string = "";
  @Input() autoHide: boolean = true;
  @Input() autoHideDuration: number = 5000; // 5 seconds default

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

    if (this.autoHide) {
      this.hideTimeout = window.setTimeout(() => {
        this.hide();
      }, this.autoHideDuration);
    }
  }

  hide() {
    this.visible = false;
  }
}
