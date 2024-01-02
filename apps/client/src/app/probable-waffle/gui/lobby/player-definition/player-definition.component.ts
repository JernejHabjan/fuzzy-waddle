import { Component, inject } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWaffleGameInstanceType,
  ProbableWaffleLevels,
  ProbableWaffleMapData,
  ProbableWafflePlayer,
  ProbableWafflePlayerDataChangeEventPayload,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

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
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly faSpinner = faSpinner;
  protected PlayerTypeDefinitions = PlayerTypeDefinitions;
  protected PlayerType = ProbableWafflePlayerType;
  protected FactionDefinitions = FactionDefinitions;
  protected DifficultyDefinitions = DifficultyDefinitions;

  protected async addAiPlayer() {
    await this.gameInstanceClientService.addAiPlayer();
  }

  protected async openMpSlot() {
    await this.gameInstanceClientService.playerSlotOpened();
  }

  protected async removePlayer(playerNumber: number) {
    await this.gameInstanceClientService.removePlayer(playerNumber);
  }

  get allowOpenSlotForMp(): boolean {
    return (
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata!.data.type ===
        ProbableWaffleGameInstanceType.SelfHosted ?? false
    );
  }

  definition(player: ProbableWafflePlayer): PositionPlayerDefinition {
    return player.playerController.data.playerDefinition!;
  }

  get mapDetails(): ProbableWaffleMapData | null {
    if (!this.map) return null;
    // noinspection UnnecessaryLocalVariableJS
    const mapData = ProbableWaffleLevels[this.map];
    return mapData;
  }

  get map() {
    return this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
  }

  get teams(): (null | number)[] {
    if (!this.mapDetails) return [];
    const teams: (null | number)[] = this.playerPositions;
    teams.unshift(null);
    return teams;
  }

  get playerPositions(): number[] {
    // noinspection UnnecessaryLocalVariableJS
    const positions = new Array(this.mapDetails!.mapInfo!.startPositionsOnTile.length)
      .fill(0)
      .map((n, index) => index + 1);
    return positions;
  }

  get players(): ProbableWafflePlayer[] {
    // noinspection UnnecessaryLocalVariableJS
    const players = this.gameInstanceClientService.gameInstance?.players ?? [];
    return players;
  }

  get allFilled() {
    return this.players.length === this.playerPositions.length;
  }

  protected async onValueChange(
    property: ProbableWafflePlayerDataChangeEventProperty,
    data: ProbableWafflePlayerDataChangeEventPayload
  ): Promise<void> {
    console.log("player state changed", property, data);
    await this.gameInstanceClientService.playerChanged(property, data);
  }
}
