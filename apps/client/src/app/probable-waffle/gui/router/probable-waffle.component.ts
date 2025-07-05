import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { UserInstanceService } from "../../../home/profile/user-instance.service";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "../../../shared/consts";

@Component({
  templateUrl: "./probable-waffle.component.html",
  styleUrls: ["./probable-waffle.component.scss"],
  imports: [RouterOutlet],
  host: AngularHost.contentFlexFullHeight
})
export class ProbableWaffleComponent implements OnInit, OnDestroy {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly userInstanceService = inject(UserInstanceService);

  ngOnInit(): void {
    this.userInstanceService.setVisitedGame("aota");
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGameInstance();
  }

  async ngOnDestroy(): Promise<void> {
    await this.onBeforeUnload();
  }
}
