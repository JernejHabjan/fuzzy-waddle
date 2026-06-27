import { BasePlayer, type PlayerNumber } from "../player/player";
import type { BaseData } from "../data";
import { BasePlayerController, type BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";
import type { Vector3Simple } from "../../game/vector";
import type { AIBehaviorTreeStateData, CameraStateData, SelectionGroupData } from "./component-data";

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

  get playerNumber(): PlayerNumber | undefined {
    return this.playerController.data.playerDefinition?.player.playerNumber ?? undefined;
  }

  getResources(): PlayerStateResources {
    return this.playerState.data.resources;
  }

  get factionType(): FactionType | undefined {
    return this.playerController.data.playerDefinition?.factionType;
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
      return this.canPayResources(resourceType as ResourceType, amount);
    });
    return canAfford;
  }

  canPayResources(resourceType: ResourceType, amount: number) {
    const resourceAmount = this.playerState.data.resources[resourceType] || 0;
    return resourceAmount >= amount;
  }

  canAffordHousing(housingNeeded: number) {
    return this.playerState.data.housing.currentHousing + housingNeeded <= this.playerState.data.housing.maxHousing;
  }
}

export interface ProbableWafflePlayerStateData extends BaseData {
  resources: PlayerStateResources;
  housing: PlayerStateHousing;
  summary: PlayerStateAction[];
  /**
   * contains GUID from actors' IdComponent
   */
  selection: string[];
  // AI behavior tree state for save/load (AI players only)
  aiBehaviorTreeState?: AIBehaviorTreeStateData;
}

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      resources: {
        [ResourceType.Food]: 2000,
        [ResourceType.Wood]: 2000,
        [ResourceType.Stone]: 2000,
        [ResourceType.Minerals]: 2000
      },
      housing: {
        currentHousing: 0,
        maxHousing: 0
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
  // Camera position for save/load (human players only)
  cameraState?: CameraStateData;
  // Selection groups for save/load (human players only)
  selectionGroups?: SelectionGroupData[];
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
  playerNumber: PlayerNumber;
  playerName?: string;
  playerPosition?: number;
  joined: boolean;
  ready?: boolean;
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

/**
 * Creates a PlayerLobbyDefinition with default values.
 * This centralizes player lobby definition creation to avoid duplication.
 *
 * @param playerNumber - The player number (1-8)
 * @param playerPosition - The player position (defaults to playerNumber - 1 if not provided)
 * @param playerName - The player name (defaults to "Player {playerNumber}" if not provided)
 * @returns A PlayerLobbyDefinition object
 */
export function createPlayerLobbyDefinition(
  playerNumber: PlayerNumber,
  playerPosition?: number,
  playerName?: string
): PlayerLobbyDefinition {
  return {
    playerNumber,
    playerName: playerName ?? `Player ${playerNumber}`,
    playerPosition: playerPosition ?? playerNumber - 1,
    joined: true
  };
}

export interface PositionPlayerDefinition {
  // assigned only after entering the game in world space coordinates
  initialWorldLogicalSpawnPosition?: Vector3Simple;
  player: PlayerLobbyDefinition;
  team?: number;
  factionType?: FactionType;
  playerType: ProbableWafflePlayerType;
  difficulty?: ProbableWaffleAiDifficulty;
}

export type PlayerStateResources = {
  [key in ResourceType]: number;
};

export type PlayerStateHousing = {
  currentHousing: number;
  maxHousing: number;
};
