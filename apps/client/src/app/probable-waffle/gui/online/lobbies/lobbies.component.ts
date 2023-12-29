import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import {
  ProbableWaffleLevels,
  ProbableWaffleMapData,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType,
  ProbableWaffleRoom
} from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "probable-waffle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"]
})
export class LobbiesComponent implements OnInit, OnDestroy {
  protected readonly faFilter = faFilter;
  protected isFilterPopupOpen: boolean = false;
  protected selectedRoom?: ProbableWaffleRoom;
  protected readonly roomsService = inject(RoomsService);
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);

  async ngOnInit(): Promise<void> {
    await this.roomsService.init();
  }

  ngOnDestroy(): void {
    this.roomsService.destroy();
  }
  protected canAddSelfAsPlayer(): boolean {
    // check if the selected room is joinable by checking if player type is NetworkOpen
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
    await this.gameInstanceClientService.joinToLobbyAsPlayer(this.selectedRoom.gameInstanceMetadataData.gameInstanceId);
  }

  protected async addSelfAsSpectator() {
    if (!this.selectedRoom?.gameInstanceMetadataData?.gameInstanceId) return;
    await this.gameInstanceClientService.joinToLobbyAsSpectator(
      this.selectedRoom.gameInstanceMetadataData.gameInstanceId
    );
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
    return this.mapInfoOfMap(this.selectedRoom.gameMode.data.map);
  }

  protected mapInfoOfMap(map?: ProbableWaffleMapEnum): null | ProbableWaffleMapData {
    if (!map) return null;
    return ProbableWaffleLevels[map];
  }
}
