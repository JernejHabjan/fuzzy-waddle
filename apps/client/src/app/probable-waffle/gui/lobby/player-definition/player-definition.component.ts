import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { MapPlayerDefinition } from "../map-player-definition";

export class PlayerTypeDefinitions {
  static playerTypes = [
    { value: ProbableWafflePlayerType.Human, name: "Human" },
    { value: ProbableWafflePlayerType.AI, name: "AI" },
    { value: ProbableWafflePlayerType.NetworkOpen, name: "Network Open" }
  ];
  static playerTypeLookup = {
    [ProbableWafflePlayerType.Human]: "Human",
    [ProbableWafflePlayerType.AI]: "A.I.",
    [ProbableWafflePlayerType.NetworkOpen]: "Network Open"
  };
}

export class DifficultyDefinitions {
  static difficulties = [
    { name: "Easy", value: ProbableWaffleAiDifficulty.Easy },
    { name: "Normal", value: ProbableWaffleAiDifficulty.Medium },
    { name: "Hard", value: ProbableWaffleAiDifficulty.Hard }
  ];
}

@Component({
  selector: "probable-waffle-player-definition",
  templateUrl: "./player-definition.component.html",
  styleUrls: ["./player-definition.component.scss"]
})
export class PlayerDefinitionComponent {
  protected readonly faSpinner = faSpinner;
  protected PlayerTypeDefinitions = PlayerTypeDefinitions;
  protected PlayerType = ProbableWafflePlayerType;
  protected FactionDefinitions = FactionDefinitions;
  protected DifficultyDefinitions = DifficultyDefinitions;
  @Input({ required: true }) allowOpenSlotForMp!: boolean;
  @Input({ required: true }) selectedMap: MapPlayerDefinition | undefined;
  @Output() aiPlayerAdded: EventEmitter<PositionPlayerDefinition> = new EventEmitter<PositionPlayerDefinition>();
  @Output() playerSlotOpened: EventEmitter<PositionPlayerDefinition> = new EventEmitter<PositionPlayerDefinition>();
  @Output() playerRemoved: EventEmitter<PositionPlayerDefinition> = new EventEmitter<PositionPlayerDefinition>();

  /**
   * get first free position
   */
  private get firstFreePosition(): number {
    const map = this.selectedMap as MapPlayerDefinition;

    // extract all positions that are already taken
    const takenPositions = map.playerPositions.map((startPosition) => startPosition.player.playerPosition) as number[];
    // sort them
    takenPositions.sort();
    // get first free position
    let freePosition = 0;
    for (let i = 0; i < map.allPlayerPositions.length; i++) {
      if (takenPositions.includes(i)) {
        continue;
      }
      freePosition = i;
      break;
    }
    return freePosition;
  }

  protected addAiPlayer(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.allPlayerPositions[playerIndex];
    startPositionPerPlayerElement.player.playerPosition = this.firstFreePosition;
    startPositionPerPlayerElement.player.joined = true;
    startPositionPerPlayerElement.difficulty = ProbableWaffleAiDifficulty.Medium;
    startPositionPerPlayerElement.playerType = ProbableWafflePlayerType.AI;
    this.aiPlayerAdded.emit(startPositionPerPlayerElement);
  }

  protected openMpSlot(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.allPlayerPositions[playerIndex];
    startPositionPerPlayerElement.player.playerPosition = this.firstFreePosition;
    startPositionPerPlayerElement.player.joined = false;
    startPositionPerPlayerElement.difficulty = undefined;
    startPositionPerPlayerElement.playerType = ProbableWafflePlayerType.NetworkOpen;
    this.playerSlotOpened.emit(startPositionPerPlayerElement);
  }

  protected removePlayer(playerNumber: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.allPlayerPositions[playerNumber];
    startPositionPerPlayerElement.player.playerPosition = undefined;
    startPositionPerPlayerElement.player.joined = false;
    this.playerRemoved.emit(startPositionPerPlayerElement);
  }
}
