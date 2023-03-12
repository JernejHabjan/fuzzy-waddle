import { Component, OnInit } from '@angular/core';
import { MapIds, Maps } from '../../../game/world/scenes/scenes';

type Lobby = {
  host: string;
  players: {
    name: string;
  }[];
  map: MapIds;
};

@Component({
  selector: 'fuzzy-waddle-lobbies',
  templateUrl: './lobbies.component.html',
  styleUrls: ['./lobbies.component.scss']
})
export class LobbiesComponent implements OnInit {
  Maps = Maps;
  lobbies: Lobby[] = [];
  selectedLobby?: Lobby;

  ngOnInit(): void {
    this.pull();
  }

  pull = () => {
    // todo - pull lobbies from server
    this.lobbies = [
      {
        host: 'host1',
        players: [
          {
            name: 'player1'
          },
          {
            name: 'player2'
          }
        ],
        map: MapIds.GrasslandSmall
      },
      {
        host: 'host2',
        players: [
          {
            name: 'player3'
          },
          {
            name: 'player4'
          }
        ],
        map: MapIds.GrasslandLarge
      }
    ];
  };

  join() {
    // todo - do something with this.selectedLobby
  }

  select(lobby: Lobby) {
    this.selectedLobby = lobby;
  }

  filter($event: Event) {
    // todo - filter lobbies

    const mapId = ($event.target as HTMLInputElement).value;
    console.log(mapId);
  }
}
