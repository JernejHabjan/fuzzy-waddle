import { Component, OnInit } from "@angular/core";
import { ProbableWaffleLevelEnum, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

type Lobby = {
  host: string;
  players: {
    name: string;
  }[];
  map: ProbableWaffleLevelEnum;
};

@Component({
  selector: "fuzzy-waddle-lobbies",
  templateUrl: "./lobbies.component.html",
  styleUrls: ["./lobbies.component.scss"]
})
export class LobbiesComponent implements OnInit {
  protected readonly ProbableWaffleLevels = ProbableWaffleLevels;
  protected lobbies: Lobby[] = [];
  protected selectedLobby?: Lobby;

  ngOnInit(): void {
    this.pull();
  }

  private pull = () => {
    // todo - pull lobbies from server
    this.lobbies = [
      {
        host: "host1",
        players: [
          {
            name: "player1"
          },
          {
            name: "player2"
          }
        ],
        map: ProbableWaffleLevelEnum.EmberEnclave
      },
      {
        host: "host2",
        players: [
          {
            name: "player3"
          },
          {
            name: "player4"
          }
        ],
        map: ProbableWaffleLevelEnum.RiverCrossing
      }
    ];
  };

  protected join() {
    // todo - do something with this.selectedLobby
  }

  protected select(lobby: Lobby) {
    this.selectedLobby = lobby;
  }

  protected filter($event: Event) {
    // todo - filter lobbies

    const mapId = ($event.target as HTMLInputElement).value;
    console.log(mapId);
  }
}
