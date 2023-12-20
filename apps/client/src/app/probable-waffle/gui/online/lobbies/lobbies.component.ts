import { Component, inject, OnInit } from "@angular/core";
import { ProbableWaffleLevelEnum, ProbableWaffleLevels, ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
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

  async ngOnInit(): Promise<void> {
    await this.pull();
  }

  private async pull() {
    await this.roomsService.initiallyPullRooms();
  }

  protected join() {
    // todo - do something with this.selectedRoom
  }

  protected spectate() {
    // todo - do something with this.selectedRoom
  }

  protected select(room: ProbableWaffleRoom) {
    this.selectedRoom = room;
  }

  toggleFilterPopup(): void {
    this.isFilterPopupOpen = !this.isFilterPopupOpen;
  }

  filter(levels: ProbableWaffleLevelEnum[]): void {
    // Handle the filter logic here
    console.log("levels: ", levels.join(", ")); // todo here refresh lobbies
  }
}
