import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from "@angular/core";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleLevels,
  ProbableWaffleMapData,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType,
  ProbableWaffleRoom,
  ProbableWaffleRoomHelper
} from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MapFilterComponent } from "./map-filter/map-filter.component";

@Component({
  selector: "probable-waffle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"],
  standalone: true,
  imports: [FaIconComponent, MapFilterComponent]
})
export class LobbiesComponent implements OnInit, OnDestroy {
  protected readonly ProbableWaffleRoomHelper = ProbableWaffleRoomHelper;
  protected readonly faFilter = faFilter;
  protected isFilterPopupOpen: boolean = false;
  protected selectedRoom?: ProbableWaffleRoom;
  private readonly roomsService = inject(RoomsService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  @Output() requestNavigateToHostLobby: EventEmitter<void> = new EventEmitter<void>();

  async ngOnInit(): Promise<void> {
    await this.roomsService.init();
  }

  ngOnDestroy(): void {
    this.roomsService.destroy();
  }

  protected canAddSelfAsPlayer(): boolean {
    if (!this.selectedRoom) return false;
    return this.selectedRoom.players.some(
      (player) => player.controllerData.playerDefinition?.playerType === ProbableWafflePlayerType.NetworkOpen
    );
  }

  protected canAddSelfAsSpectator(): boolean {
    return !!this.selectedRoom;
  }

  protected async addSelfAsPlayer() {
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
          room.gameInstanceMetadataData.sessionState === GameSessionState.NotStarted &&
          room.gameInstanceMetadataData.visibility === ProbableWaffleGameInstanceVisibility.Public &&
          room.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.SelfHosted &&
          room.players.some(
            (p) => p.controllerData.playerDefinition?.playerType === ProbableWafflePlayerType.NetworkOpen
          )
      );
  }
}
