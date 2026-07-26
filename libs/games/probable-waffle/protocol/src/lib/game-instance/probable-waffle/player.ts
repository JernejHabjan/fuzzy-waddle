import { BasePlayer, type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { BaseData } from "@fuzzy-waddle/platform-game-sessions";
import { BasePlayerController, type BasePlayerControllerData } from "@fuzzy-waddle/platform-game-sessions";
import { BasePlayerState } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
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

/**
 * Defines the structured probable waffle player state data contract for this module. Its declared surface
 * makes resources, housing, summary, selection, ai behavior tree state explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWafflePlayerStateData extends BaseData {
  /**
   * resources value carried by {@link ProbableWafflePlayerStateData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resources: PlayerStateResources;
  /**
   * housing value carried by {@link ProbableWafflePlayerStateData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  housing: PlayerStateHousing;
  /**
   * human-facing summary for {@link ProbableWafflePlayerStateData}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  summary: PlayerStateAction[];
  /**
   * contains GUID from actors' IdComponent
   */
  selection: string[];
  // AI behavior tree state for save/load (AI players only)
  /**
   * Optional discriminator for {@link ProbableWafflePlayerStateData}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
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

/**
 * Defines the structured probable waffle player controller data contract for this module. Its declared surface
 * makes player definition, left or killed, camera state, selection groups explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWafflePlayerControllerData extends BasePlayerControllerData {
  /**
   * Optional player definition value carried by {@link ProbableWafflePlayerControllerData}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  playerDefinition?: PositionPlayerDefinition;
  /**
   * Optional left or killed value carried by {@link ProbableWafflePlayerControllerData}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  leftOrKilled?: boolean;
  // Camera position for save/load (human players only)
  /**
   * Optional discriminator for {@link ProbableWafflePlayerControllerData}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  cameraState?: CameraStateData;
  // Selection groups for save/load (human players only)
  /**
   * Optional collection value on {@link ProbableWafflePlayerControllerData}. Its element type defines the
   * records that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on
   * it.
   */
  selectionGroups?: SelectionGroupData[];
}

/**
 * Defines the closed probable waffle player type classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWafflePlayerType {
  /**
   * Selects the `Human` case of {@link ProbableWafflePlayerType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Human = 0,
  /**
   * Selects the `AI` case of {@link ProbableWafflePlayerType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  AI = 1,
  /**
   * Selects the `NetworkOpen` case of {@link ProbableWafflePlayerType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  NetworkOpen = 2
}

/**
 * Defines the closed probable waffle ai difficulty classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleAiDifficulty {
  /**
   * Selects the `Easy` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Easy = 0,
  /**
   * Selects the `Medium` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Medium = 1,
  /**
   * Selects the `Hard` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Hard = 2
}

/**
 * Defines the structured player lobby definition contract for this module. Its declared surface makes player
 * number, player name, player position, joined, ready explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface PlayerLobbyDefinition {
  /**
   * player number value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  playerNumber: PlayerNumber;
  /**
   * Optional human-facing player name for {@link PlayerLobbyDefinition}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  playerName?: string;
  /**
   * Optional numeric player position carried by {@link PlayerLobbyDefinition}. Its units and valid range are
   * defined by {@link PlayerLobbyDefinition} and must remain consistent across producers and consumers.
   */
  playerPosition?: number;
  /**
   * joined value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  joined: boolean;
  /**
   * Optional ready value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  ready?: boolean;
}

/**
 * Defines the closed faction type classification. Use an explicit member rather than a free-form string so
 * branching, persistence, and diagnostics share the same vocabulary.
 */
export enum FactionType {
  /**
   * Selects the `Tivara` case of {@link FactionType}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Tivara = 1,
  /**
   * Selects the `Skaduwee` case of {@link FactionType}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
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

/**
 * Defines the structured position player definition contract for this module. Its declared surface makes
 * initial world logical spawn position, player, team, faction type, player type explicit to every consumer.
 * Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface PositionPlayerDefinition {
  // assigned only after entering the game in world space coordinates
  /**
   * Optional initial world logical spawn position value carried by {@link PositionPlayerDefinition}. Its
   * declared type is the compatibility boundary for producers, validators, and consumers; do not replace it with
   * a broader inferred shape.
   */
  initialWorldLogicalSpawnPosition?: Vector3Simple;
  /**
   * player value carried by {@link PositionPlayerDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  player: PlayerLobbyDefinition;
  /**
   * Optional numeric team carried by {@link PositionPlayerDefinition}. Its units and valid range are defined by
   * {@link PositionPlayerDefinition} and must remain consistent across producers and consumers.
   */
  team?: number;
  /**
   * Optional discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  factionType?: FactionType;
  /**
   * discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  playerType: ProbableWafflePlayerType;
  /**
   * Optional difficulty value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  difficulty?: ProbableWaffleAiDifficulty;
  /**
   * Optional campaign controller value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignController?: "full-ai" | "scripted-ai" | "passive";
  /**
   * Optional campaign economy value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignEconomy?: "normal" | "granted" | "none";
  /**
   * Optional discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  campaignFogPolicy?: "normal" | "revealed" | "omniscient-ai";
  /**
   * Optional campaign starting resources value carried by {@link PositionPlayerDefinition}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  campaignStartingResources?: Partial<Record<ResourceType, number>>;
  /**
   * Optional numeric bound or quantity carried by {@link PositionPlayerDefinition}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  campaignDamageScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link PositionPlayerDefinition}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  campaignAiAggressionScale?: number;
  /**
   * Optional campaign ai enabled value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignAiEnabled?: boolean;
}

/**
 * Defines the player state resources alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type PlayerStateResources = {
  [key in ResourceType]: number;
};

/**
 * Defines the structural player state housing contract. Its declared surface makes current housing, max
 * housing explicit to every consumer. This named alias keeps the boundary explicit without duplicating an
 * anonymous object shape.
 */
export type PlayerStateHousing = {
  /**
   * numeric current housing carried by {@link PlayerStateHousing}. Its units and valid range are defined by
   * {@link PlayerStateHousing} and must remain consistent across producers and consumers.
   */
  currentHousing: number;
  /**
   * numeric max housing carried by {@link PlayerStateHousing}. Its units and valid range are defined by {@link
   * PlayerStateHousing} and must remain consistent across producers and consumers.
   */
  maxHousing: number;
};
