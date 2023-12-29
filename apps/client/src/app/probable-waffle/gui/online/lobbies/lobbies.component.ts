import { Component, inject, OnInit } from "@angular/core";
import {
  ProbableWaffleLevels,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType,
  ProbableWaffleRoom
} from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "fuzzy-waddle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"]
})
export class LobbiesComponent implements OnInit {
  protected readonly ProbableWaffleLevels = ProbableWaffleLevels;
  protected isFilterPopupOpen: boolean = false;
  protected selectedRoom?: ProbableWaffleRoom;
  protected readonly roomsService = inject(RoomsService);
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);

  async ngOnInit(): Promise<void> {
    await this.pull();
  }

  private async pull() {
    await this.roomsService.initiallyPullRooms();
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

  toggleFilterPopup(): void {
    this.isFilterPopupOpen = !this.isFilterPopupOpen;
  }

  async filter(maps: ProbableWaffleMapEnum[]): Promise<void> {
    // Handle the filter logic here
    await this.roomsService.getRooms(maps);
  }
}
