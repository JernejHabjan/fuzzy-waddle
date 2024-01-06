import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { GameSessionState, LittleMuncherGameCreate } from "@fuzzy-waddle/api-interfaces";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { SpectateService } from "./home/spectate/spectate.service";
import { Subscription } from "rxjs";
import { GameInstanceClientService } from "./main/communicators/game-instance-client.service";
import { UserInstanceService } from "../home/profile/user-instance.service";
import { CommonModule } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { HomeComponent } from "./home/home.component";
import { MainComponent } from "./main/main.component";
import { NgbToast } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./little-muncher.component.html",
  styleUrls: ["./little-muncher.component.scss"],
  standalone: true,
  imports: [CommonModule, FaIconComponent, HomeComponent, MainComponent, NgbToast]
})
export class LittleMuncherComponent implements OnInit, OnDestroy {
  protected readonly faSpinner = faSpinner;
  protected loading = false;
  private spectatorDisconnectedSubscription?: Subscription;
  protected toastData = {
    show: false,
    title: "",
    text: ""
  };
  protected readonly userInstanceService = inject(UserInstanceService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly spectateService = inject(SpectateService);

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame();
  }

  async startLevel(gameCreate: LittleMuncherGameCreate): Promise<void> {
    this.loading = true;
    try {
      await this.gameInstanceClientService.startLevel(gameCreate);
    } finally {
      this.loading = false;
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.gameInstanceClientService.stopGame();
    this.spectateService.destroy();
    this.spectatorDisconnectedSubscription?.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    this.userInstanceService.setVisitedGame("little-muncher");
    await this.gameInstanceClientService.startGame();
    await this.spectateService.listenToRoomEvents();
    this.spectatorDisconnectedSubscription = this.spectateService.spectatorDisconnected.subscribe(() => {
      this.toastData = {
        show: true,
        title: "Game Disconnected",
        text: "You have been disconnected from the game"
      };
    });
  }

  get notPlaying() {
    const currentState = this.gameInstanceClientService.gameInstance!.gameInstanceMetadata!.data.sessionState!;
    return currentState === GameSessionState.NotStarted;
  }
}
