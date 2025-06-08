import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController, BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";
import { Vector3Simple } from "../../game/vector";

export class ProbableWafflePlayer extends BasePlayer<
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
> {
  setSelectedActor(guid: string) {
    if (this.playerState.data.selection.includes(guid)) return;
    this.playerState.data.selection.push(guid);
  }

  removeSelectedActor(guid: string) {
    const newSelection = this.playerState.data.selection.filter((id) => id !== guid);
    if (newSelection.length === this.playerState.data.selection.length) return;
    this.playerState.data.selection = newSelection;
  }

  getSelection() {
    return this.playerState.data.selection;
  }

  clearSelection() {
    if (this.playerState.data.selection.length === 0) return;
    this.playerState.data.selection = [];
  }

  get playerNumber(): number | undefined {
    return this.playerController.data.playerDefinition?.player.playerNumber ?? undefined;
  }

  getResources(): PlayerStateResources {
    return this.playerState.data.resources;
  }

  /**
   * IMPORTANT - do not use directly - use emitResource function instead
   * @deprecated
   */
  addResources(resources: Partial<Record<ResourceType, number>>): void {
    Object.entries(resources).forEach(([resourceType, amount]) => {
      this.addResource(resourceType as ResourceType, amount);
    });
  }

  private addResource(resourceType: ResourceType, amount: number): number {
    const resourceAmount = this.playerState.data.resources[resourceType] || 0;
    this.playerState.data.resources[resourceType] = resourceAmount + amount;
    return resourceAmount;
  }

  /**
   * IMPORTANT - do not use directly - use emitResource function instead
   * @deprecated
   */
  payAllResources(resources: Partial<Record<ResourceType, number>>): void {
    Object.entries(resources).forEach(([resourceType, amount]) => {
      this.payResources(resourceType as ResourceType, amount);
    });
  }

  payResources(resourceType: ResourceType, amount: number): void {
    const resourceAmount = this.playerState.data.resources[resourceType] || 0;
    if (resourceAmount - amount < 0) {
      throw new Error("Not enough resources");
    }
    this.playerState.data.resources[resourceType] = resourceAmount - amount;
  }

  canPayAllResources(constructionCosts: Partial<Record<ResourceType, number>>) {
    // noinspection UnnecessaryLocalVariableJS
    const canAfford = Object.entries(constructionCosts).every(([resourceType, amount]) => {
      const resourceAmount = this.playerState.data.resources[resourceType as ResourceType] || 0;
      return resourceAmount >= amount;
    });
    return canAfford;
  }
}

export interface ProbableWafflePlayerStateData extends BaseData {
  resources: PlayerStateResources;
  summary: PlayerStateAction[];
  /**
   * contains GUID from actors' IdComponent
   */
  selection: string[];
}

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      resources: {
        [ResourceType.Ambrosia]: 0,
        [ResourceType.Minerals]: 500,
        [ResourceType.Stone]: 100,
        [ResourceType.Wood]: 200,
        [ResourceType.Food]: 8
      },
      summary: [],
      selection: []
    };
  }
}

export class ProbableWafflePlayerController extends BasePlayerController<ProbableWafflePlayerControllerData> {
  constructor(data?: ProbableWafflePlayerControllerData) {
    super(data as ProbableWafflePlayerControllerData);
  }
}

export interface ProbableWafflePlayerControllerData extends BasePlayerControllerData {
  playerDefinition?: PositionPlayerDefinition;
  leftOrKilled?: boolean;
}

export enum ProbableWafflePlayerType {
  Human = 0,
  AI = 1,
  NetworkOpen = 2
}

export enum ProbableWaffleAiDifficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2
}

export interface PlayerLobbyDefinition {
  // 1 - 8
  playerNumber: number;
  playerName?: string;
  playerPosition?: number;
  joined: boolean;
}

export enum FactionType {
  Tivara = 1,
  Skaduwee = 2
}

export function getRandomFactionType(): FactionType {
  const enumValues = Object.values(FactionType).filter((value) => typeof value === "number");
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex] as FactionType;
}

export interface PositionPlayerDefinition {
  // assigned only after entering the game in world space coordinates
  initialWorldSpawnPosition?: Vector3Simple;
  player: PlayerLobbyDefinition;
  team?: number;
  factionType?: FactionType;
  playerType: ProbableWafflePlayerType;
  difficulty?: ProbableWaffleAiDifficulty;
}

export type PlayerStateResources = {
  [key in ResourceType]: number;
};
