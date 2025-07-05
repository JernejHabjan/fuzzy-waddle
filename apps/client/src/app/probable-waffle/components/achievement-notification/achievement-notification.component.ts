import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";

import { AtlasSpriteComponent } from "../atlas-sprite/atlas-sprite.component";
import { animate, style, transition, trigger } from "@angular/animations";

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

  @ViewChild("audio") audioRef?: ElementRef<HTMLAudioElement>;

  visible = false;
  private hideTimeout?: number;

  ngOnInit() {
    this.show();
  }

  ngOnDestroy() {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }
  }

  show() {
    // Clear any existing timeout
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }

    // Make the notification visible
    this.visible = true;

    // Play sound effect
    setTimeout(() => {
      if (this.audioRef?.nativeElement) {
        this.audioRef.nativeElement.play().catch((error) => {
          console.warn("Could not play achievement sound:", error);
        });
      }
    });

    // Set timeout to hide the notification
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
