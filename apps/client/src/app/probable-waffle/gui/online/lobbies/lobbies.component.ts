import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from "@angular/core";
import {
  ProbableWaffleLevels,
  ProbableWaffleMapData,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType,
  ProbableWaffleRoom,
  ProbableWaffleRoomHelper
} from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { Router } from "@angular/router";

@Component({
  selector: "probable-waffle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"]
})
export class LobbiesComponent implements OnInit, OnDestroy {
  protected readonly ProbableWaffleRoomHelper = ProbableWaffleRoomHelper;
  protected readonly faFilter = faFilter;
  protected isFilterPopupOpen: boolean = false;
  protected selectedRoom?: ProbableWaffleRoom;
  protected readonly roomsService = inject(RoomsService);
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly router = inject(Router);
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
    return this.mapInfoOfMap(this.selectedRoom.gameMode?.data.map);
  }

  protected mapInfoOfMap(map?: ProbableWaffleMapEnum): null | ProbableWaffleMapData {
    if (!map) return null;
    return ProbableWaffleLevels[map];
  }

  protected navigateToCreateLobby() {
    this.requestNavigateToHostLobby.emit();
  }
}
