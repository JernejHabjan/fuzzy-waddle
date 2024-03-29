import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController, BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";

export class ProbableWafflePlayer extends BasePlayer<
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
> {
  setSelectedActor(guid: string) {
    if (!this.playerState.data.selection.includes(guid)) {
      this.playerState.data.selection.push(guid);
    }
  }

  removeSelectedActor(guid: string) {
    this.playerState.data.selection = this.playerState.data.selection.filter((id) => id !== guid);
  }

  getSelection() {
    return this.playerState.data.selection;
  }

  clearSelection() {
    this.playerState.data.selection = [];
  }

  get playerNumber(): number | undefined {
    return this.playerController.data.playerDefinition?.player.playerNumber ?? undefined;
  }

  getResources(): PlayerStateResources {
    return this.playerState.data.resources;
  }

  addResources(resources: Partial<Record<ResourceType, number>>): void {
    Object.entries(resources).forEach(([resourceType, amount]) => {
      this.addResource(resourceType as ResourceType, amount);
    });
  }

  addResource(resourceType: ResourceType, amount: number): number {
    const resourceAmount = this.playerState.data.resources[resourceType] || 0;
    this.playerState.data.resources[resourceType] = resourceAmount + amount;
    return resourceAmount;
  }

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
  selection: string[]; // guid from idComponent
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
        [ResourceType.Minerals]: 0,
        [ResourceType.Stone]: 0,
        [ResourceType.Wood]: 0
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
  playerNumber: number;
  playerName?: string;
  playerPosition?: number;
  joined: boolean;
}

export enum FactionType {
  Tivara,
  Skaduwee
}

export interface PositionPlayerDefinition {
  player: PlayerLobbyDefinition;
  team?: number;
  factionType?: FactionType;
  playerType: ProbableWafflePlayerType;
  difficulty?: ProbableWaffleAiDifficulty;
}

export type PlayerStateResources = {
  [key in ResourceType]: number;
};
