import { Component, inject } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { faCheck, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  GameSetupHelpers,
  type PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWaffleGameInstanceType,
  ProbableWaffleLevels,
  type ProbableWaffleMapData,
  ProbableWafflePlayer,
  type ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { AuthService } from "../../../../auth/auth.service";

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
  styleUrls: ["./player-definition.component.scss"],
  imports: [FormsModule, FaIconComponent]
})
export class PlayerDefinitionComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly authService = inject(AuthService);
  protected readonly faSpinner = faSpinner;
  protected readonly faCheck = faCheck;
  protected readonly faTimes = faTimes;
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
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata?.data.type ===
      ProbableWaffleGameInstanceType.SelfHosted
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

  get teams(): (undefined | number)[] {
    if (!this.mapDetails) return [];
    const teams: (undefined | number)[] = this.playerPositions;
    teams.unshift(undefined);
    return teams;
  }

  getColorForPlayer(player: ProbableWafflePlayer): string {
    return GameSetupHelpers.getStringColorForPlayer(
      player.playerNumber!,
      this.mapDetails!.mapInfo!.startPositionsOnTile.length
    );
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

  protected onValueChange(property: ProbableWafflePlayerDataChangeEventProperty, player: ProbableWafflePlayer) {
    // timeout so ngModelChange can finish
    setTimeout(async () => {
      const playerDefinition = this.definition(player);
      switch (property) {
        case "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty:
          const factionType = playerDefinition.factionType;
          await this.gameInstanceClientService.playerChanged(property, {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { factionType } as PositionPlayerDefinition }
          });
          break;
        case "playerController.data.playerDefinition.team" as ProbableWafflePlayerDataChangeEventProperty:
          const team = playerDefinition.team;
          await this.gameInstanceClientService.playerChanged(property, {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { team } as PositionPlayerDefinition }
          });
          break;
        case "playerController.data.playerDefinition.difficulty" as ProbableWafflePlayerDataChangeEventProperty:
          const difficulty = playerDefinition.difficulty;
          await this.gameInstanceClientService.playerChanged(property, {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { difficulty } as PositionPlayerDefinition }
          });
          break;
        default:
          throw new Error(`Unhandled property ${property}`);
      }
      console.log("player state changed", property);
    }, 50);
  }

  changeFaction(player: ProbableWafflePlayer) {
    this.onValueChange(
      "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty,
      player
    );
  }

  changeTeam(player: ProbableWafflePlayer) {
    this.onValueChange(
      "playerController.data.playerDefinition.team" as ProbableWafflePlayerDataChangeEventProperty,
      player
    );
  }

  changeDifficulty(player: ProbableWafflePlayer) {
    this.onValueChange(
      "playerController.data.playerDefinition.difficulty" as ProbableWafflePlayerDataChangeEventProperty,
      player
    );
  }

  getPlayerName(player: ProbableWafflePlayer) {
    const playerNumber = player.playerNumber!;
    const isCurrentPlayer = this.getPlayerIsCurrentPlayer(player);
    // noinspection UnnecessaryLocalVariableJS
    const name = isCurrentPlayer ? "You" : `Player ${playerNumber}`;
    return name;
  }

  getPlayerIsCurrentPlayer(player: ProbableWafflePlayer) {
    const currentPlayerNumber = this.gameInstanceClientService.currentPlayerNumber;
    const playerNumber = player.playerNumber;
    // noinspection UnnecessaryLocalVariableJS
    const isCurrentPlayer = currentPlayerNumber === playerNumber;
    return isCurrentPlayer;
  }

  getPlayerIsCreator(player: ProbableWafflePlayer) {
    const creatorUserId = this.gameInstanceClientService.gameInstance?.gameInstanceMetadata!.data.createdBy;
    const userId = player.playerController.data.userId;
    // noinspection UnnecessaryLocalVariableJS
    const isCreator = creatorUserId === userId;
    return isCreator;
  }

  protected get isHost(): boolean {
    return this.gameInstanceClientService.gameInstance?.isHost(this.authService.userId) ?? false;
  }

  protected get isSelfHosted(): boolean {
    return (
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata?.data.type ===
      ProbableWaffleGameInstanceType.SelfHosted
    );
  }

  changeReadyStatus(player: ProbableWafflePlayer) {
    const ready = this.definition(player).player.ready;
    this.gameInstanceClientService.playerChanged(
      "playerController.data.playerDefinition.player.ready" as ProbableWafflePlayerDataChangeEventProperty,
      {
        playerNumber: player.playerNumber,
        playerControllerData: {
          playerDefinition: {
            player: { ready }
          } as PositionPlayerDefinition
        }
      }
    );
  }

  getPlayerIsHost(player: ProbableWafflePlayer): boolean {
    const userId = player.playerController.data.userId;
    return this.gameInstanceClientService.gameInstance?.isHost(userId) ?? false;
  }
}
