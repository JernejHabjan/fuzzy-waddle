import { Component, Input, OnDestroy, OnInit, inject } from "@angular/core";
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
    trigger("slideIn", [
      transition(":enter", [
        style({ transform: "translateX(100%)" }),
        animate("300ms ease-out", style({ transform: "translateX(0)" }))
      ]),
      transition(":leave", [animate("300ms ease-in", style({ transform: "translateX(100%)" }))])
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
    this.show();
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
