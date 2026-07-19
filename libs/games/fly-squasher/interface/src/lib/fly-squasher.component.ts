import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { UserInstanceService } from "@fuzzy-waddle/platform-identity/client/profile/user-instance.service";

import { RouterOutlet } from "@angular/router";
import { AngularHost } from "@fuzzy-waddle/platform-game-host/angular/consts";

@Component({
  templateUrl: "./fly-squasher.component.html",
  styleUrls: ["./fly-squasher.component.scss"],
  standalone: true,
  imports: [RouterOutlet],
  host: AngularHost.contentFlexFullHeight
})
export class FlySquasherComponent implements OnInit {
  protected readonly userInstanceService = inject(UserInstanceService);
  ngOnInit(): void {
    this.userInstanceService.setVisitedGame("fly-squasher");
  }
}
