import { Component, inject, type OnDestroy, type OnInit, output } from "@angular/core";
import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility, ProbableWaffleLevels, type ProbableWaffleMapData, type ProbableWaffleMapEnum, ProbableWafflePlayerType, type ProbableWaffleRoom, ProbableWaffleRoomHelper } from "@fuzzy-waddle/probable-waffle-protocol";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MapFilterComponent } from "./map-filter/map-filter.component";
import { ToastService } from "@fuzzy-waddle/platform-game-host/angular/services/toast.service";

@Component({
  selector: "probable-waffle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"],
  imports: [FaIconComponent, MapFilterComponent]
})
export class LobbiesComponent implements OnInit, OnDestroy {
  protected readonly ProbableWaffleRoomHelper = ProbableWaffleRoomHelper;
  protected readonly faFilter = faFilter;
  protected isFilterPopupOpen: boolean = false;
  protected selectedRoom?: ProbableWaffleRoom;
  private readonly roomsService = inject(RoomsService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly toastService = inject(ToastService);
  readonly requestNavigateToHostLobby = output<void>();

  async ngOnInit(): Promise<void> {
    await this.roomsService.init();
  }

  ngOnDestroy(): void {
    this.roomsService.destroy();
  }

  protected canAddSelfAsPlayer(): boolean {
    if (!this.selectedRoom) return false;
    return (
      this.selectedRoom.gameInstanceMetadataData.sessionState === GameSessionState.NotStarted &&
      this.selectedRoom.players.some(
        (player) => player.controllerData.playerDefinition?.playerType === ProbableWafflePlayerType.NetworkOpen
      )
    );
  }

  protected get joinActionMessage(): string {
    if (!this.selectedRoom) return "Select a lobby to see how you can join it.";
    if (this.selectedRoom.gameInstanceMetadataData.sessionState !== GameSessionState.NotStarted) {
      return "This game has already started. You can still join it as a spectator.";
    }
    if (!this.selectedRoom.players.some(this.isNetworkOpenPlayer)) {
      return "No multiplayer slots are open in this lobby. Ask the host to open a player slot.";
    }
    return "Join this lobby as a player.";
  }

  protected canAddSelfAsSpectator(): boolean {
    return !!this.selectedRoom && this.selectedRoom.gameInstanceMetadataData.sessionState !== GameSessionState.Stopped;
  }

  protected async addSelfAsPlayer() {
    if (!this.canAddSelfAsPlayer()) {
      this.toastService.showWarning("Cannot join as player", this.joinActionMessage);
      return;
    }
    if (!this.selectedRoom?.gameInstanceMetadataData?.gameInstanceId) return;
    await this.gameInstanceClientService.joinGameInstanceAsPlayer(
      this.selectedRoom.gameInstanceMetadataData.gameInstanceId
    );
    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }

  protected async addSelfAsSpectator() {
    if (!this.selectedRoom?.gameInstanceMetadataData?.gameInstanceId) return;
    await this.gameInstanceClientService.joinGameInstanceAsSpectator(
      this.selectedRoom.gameInstanceMetadataData.gameInstanceId
    );
    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }

  protected select(room: ProbableWaffleRoom) {
    this.selectedRoom = room;
  }

  protected selectWithKeyboard(event: Event, room: ProbableWaffleRoom): void {
    event.preventDefault();
    this.select(room);
  }

  protected toggleFilterPopup(): void {
    this.isFilterPopupOpen = !this.isFilterPopupOpen;
  }

  protected async filter(maps: ProbableWaffleMapEnum[]): Promise<void> {
    // Handle the filter logic here
    await this.roomsService.getRooms(maps);
  }

  protected get mapInfo(): null | ProbableWaffleMapData {
    if (!this.selectedRoom) return null;
    return this.mapInfoOfMap(this.selectedRoom.gameModeData?.map);
  }

  protected mapInfoOfMap(map?: ProbableWaffleMapEnum): null | ProbableWaffleMapData {
    if (!map) return null;
    return ProbableWaffleLevels[map];
  }

  protected navigateToCreateLobby() {
    this.requestNavigateToHostLobby.emit();
  }

  protected get getRoomsToJoin(): ProbableWaffleRoom[] {
    return this.roomsService
      .rooms()
      .filter(
        (room) =>
          room.gameInstanceMetadataData.sessionState !== GameSessionState.Stopped &&
          room.gameInstanceMetadataData.visibility === ProbableWaffleGameInstanceVisibility.Public &&
          room.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.SelfHosted
      );
  }

  protected get selectedRoomPlayers() {
    return this.selectedRoom ? ProbableWaffleRoomHelper.getActivatedPlayersInRoom(this.selectedRoom) : [];
  }

  private readonly isNetworkOpenPlayer = (player: ProbableWaffleRoom["players"][number]): boolean =>
    player.controllerData.playerDefinition?.playerType === ProbableWafflePlayerType.NetworkOpen;
}
