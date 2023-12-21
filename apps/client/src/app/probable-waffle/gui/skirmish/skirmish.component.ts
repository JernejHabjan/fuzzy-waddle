import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { FactionDefinitions, FactionType } from "../../game/player/faction-definitions";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { Difficulty, PlayerType } from "./player-definition/player-definition.component";
import { ProbableWaffleGameModeLobby, ProbableWaffleLevelData } from "@fuzzy-waddle/api-interfaces";

export class PlayerLobbyDefinition {
  constructor(
    public playerNumber: number,
    public playerName: string | null,
    public playerPosition: number | null,
    public joined: boolean
  ) {}
}

export class PositionPlayerDefinition {
  constructor(
    public player: PlayerLobbyDefinition,
    public team: number | null = null,
    public factionType: FactionType | null = null,
    public playerType: PlayerType,
    public playerColor: string,
    public difficulty: Difficulty | null
  ) {}
}

export class MapPlayerDefinition {
  startPositionPerPlayer: PositionPlayerDefinition[] = [];
  allPossibleTeams: (number | null)[] = [];
  initialNrAiPlayers = 1;

  constructor(public readonly map: ProbableWaffleLevelData) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.mapInfo.startPositionsOnTile.length; i++) {
      const playerColor = `hsl(${(i * 360) / map.mapInfo.startPositionsOnTile.length}, 100%, 50%)`;
      // use initialNrAiPlayers to set the first x players to AI
      const shouldAutoJoin = i < this.initialNrAiPlayers + 1; // 1 for self player
      const isAi = i > 0 && shouldAutoJoin;
      const playerName = isAi ? `AI ${i}` : i === 0 ? "You" : `Player ${i}`;
      this.startPositionPerPlayer.push(
        new PositionPlayerDefinition(
          new PlayerLobbyDefinition(i, playerName, shouldAutoJoin ? i : null, shouldAutoJoin),
          null,
          null,
          !isAi ? PlayerType.Human : PlayerType.AI,
          playerColor,
          isAi ? Difficulty.Medium : null
        )
      );
      this.allPossibleTeams.push(i);
    }
  }

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player.playerPosition !== null);
  }
}

@Component({
  selector: "fuzzy-waddle-skirmish",
  templateUrl: "./skirmish.component.html",
  styleUrls: ["./skirmish.component.scss"]
})
export class SkirmishComponent {
  @ViewChild("mapDefinition") private mapDefinition!: MapDefinitionComponent;
  protected selectedMap?: MapPlayerDefinition;
  private gameModeLobby?: ProbableWaffleGameModeLobby;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  protected playerCountChanged() {
    this.mapDefinition.initializePlayerPositions();
    this.mapDefinition.draw();
  }

  protected playerRemoved(positionPlayerDefinition: PositionPlayerDefinition) {
    this.mapDefinition.removePlayer(positionPlayerDefinition.player.playerNumber);
    this.playerCountChanged();
  }

  protected mapChanged($event: MapPlayerDefinition) {
    this.selectedMap = $event;
    this.cd.detectChanges();
  }

  protected gameModeLobbyChanged($event: ProbableWaffleGameModeLobby) {
    this.gameModeLobby = $event;
    console.log("gameModeLobbyChanged", this.gameModeLobby);
  }
}
