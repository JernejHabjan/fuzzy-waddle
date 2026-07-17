import { Injectable, Logger } from "@nestjs/common";
import {
  type ActorDefinition,
  type PlayerStateHousing,
  type PlayerStateResources,
  type ProbableWaffleGameInstance,
  type ProbableWafflePlayerDataChangeEvent,
  ProbableWafflePlayerDataChangeProperties,
  ResourceType,
  type SelectionGroupData
} from "@fuzzy-waddle/api-interfaces";
import type { User } from "@supabase/supabase-js";

type PlayerDataChangeProperty = ProbableWafflePlayerDataChangeEvent["property"];

@Injectable()
/**
 * Validates player-scoped state mutations that are still sent outside lockstep
 * command batches.
 *
 * These checks prevent side-channel state drift: selection, control groups,
 * resources, and housing must still obey ownership and sanity limits even
 * though they are not part of the command-stream validator.
 */
export class PlayerStateValidatorService {
  private readonly logger = new Logger(PlayerStateValidatorService.name);

  private static readonly MAX_SELECTION_SIZE = 200;
  private static readonly RESOURCE_PROPERTIES: ReadonlySet<PlayerDataChangeProperty> = new Set([
    ProbableWafflePlayerDataChangeProperties.ResourceAdded,
    ProbableWafflePlayerDataChangeProperties.ResourceRemoved
  ]);
  private static readonly HOUSING_PROPERTIES: ReadonlySet<PlayerDataChangeProperty> = new Set([
    ProbableWafflePlayerDataChangeProperties.HousingAdded,
    ProbableWafflePlayerDataChangeProperties.HousingRemoved,
    ProbableWafflePlayerDataChangeProperties.HousingCurrentIncreased,
    ProbableWafflePlayerDataChangeProperties.HousingCurrentDecreased
  ]);
  private static readonly SELECTION_PROPERTIES: ReadonlySet<PlayerDataChangeProperty> = new Set([
    ProbableWafflePlayerDataChangeProperties.SelectionAdded,
    ProbableWafflePlayerDataChangeProperties.SelectionRemoved,
    ProbableWafflePlayerDataChangeProperties.SelectionSet,
    ProbableWafflePlayerDataChangeProperties.SelectionCleared
  ]);
  private static readonly CONTROL_GROUP_PROPERTY = ProbableWafflePlayerDataChangeProperties.SelectionGroupsChanged;
  private static readonly LEFT_OR_KILLED_PROPERTY = ProbableWafflePlayerDataChangeProperties.LeftOrKilledChanged;
  private static readonly OWNER_ONLY_PROPERTIES: ReadonlySet<PlayerDataChangeProperty> = new Set([
    ...PlayerStateValidatorService.RESOURCE_PROPERTIES,
    ...PlayerStateValidatorService.HOUSING_PROPERTIES,
    ...PlayerStateValidatorService.SELECTION_PROPERTIES,
    PlayerStateValidatorService.CONTROL_GROUP_PROPERTY,
    PlayerStateValidatorService.LEFT_OR_KILLED_PROPERTY,
    ProbableWafflePlayerDataChangeProperties.PlayerSceneReady,
    ProbableWafflePlayerDataChangeProperties.CommandIssuedMove,
    ProbableWafflePlayerDataChangeProperties.CommandIssuedActor
  ]);
  private static readonly MAX_CONTROL_GROUPS = 9;
  private static readonly MAX_CONTROL_GROUP_SIZE = 200;

  validate(event: ProbableWafflePlayerDataChangeEvent, gameInstance: ProbableWaffleGameInstance, user: User): boolean {
    const playerNumber = event.data.playerNumber;
    if (playerNumber === undefined) {
      return true;
    }

    const player = gameInstance.getPlayerByNumber(playerNumber);
    if (!player) {
      this.logger.warn(`[PlayerState] Unknown playerNumber ${playerNumber} in instance ${event.gameInstanceId}`);
      return false;
    }

    if (!this.canUserMutateProperty(event, gameInstance, player.playerController.data.userId ?? null, user.id)) {
      this.logger.warn(
        `[PlayerState] Ownership violation: user ${user.id} tried to emit ${event.property} for player ${playerNumber}`
      );
      return false;
    }

    switch (event.property) {
      case ProbableWafflePlayerDataChangeProperties.ResourceAdded:
      case ProbableWafflePlayerDataChangeProperties.ResourceRemoved:
        return this.validateResourceChange(event, gameInstance);
      case ProbableWafflePlayerDataChangeProperties.HousingAdded:
      case ProbableWafflePlayerDataChangeProperties.HousingRemoved:
      case ProbableWafflePlayerDataChangeProperties.HousingCurrentIncreased:
      case ProbableWafflePlayerDataChangeProperties.HousingCurrentDecreased:
        return this.validateHousingChange(event, gameInstance);
      case ProbableWafflePlayerDataChangeProperties.SelectionAdded:
      case ProbableWafflePlayerDataChangeProperties.SelectionRemoved:
      case ProbableWafflePlayerDataChangeProperties.SelectionSet:
      case ProbableWafflePlayerDataChangeProperties.SelectionCleared:
        return this.validateSelectionChange(event, gameInstance);
      case PlayerStateValidatorService.LEFT_OR_KILLED_PROPERTY:
        return this.validateLeftOrKilledChange(event);
      case PlayerStateValidatorService.CONTROL_GROUP_PROPERTY:
        return this.validateSelectionGroupsChange(event, gameInstance);
      default:
        return true;
    }
  }

  cleanup(_: string): void {}

  /** Restricts mutable player-state events to the owner, with host fallback for explicit leave. */
  private canUserMutateProperty(
    event: ProbableWafflePlayerDataChangeEvent,
    gameInstance: ProbableWaffleGameInstance,
    playerUserId: string | null,
    emitterUserId: string
  ): boolean {
    if (event.property === ProbableWafflePlayerDataChangeProperties.Left) {
      const currentHostUserId =
        gameInstance.gameInstanceMetadata.data.currentHostUserId ?? gameInstance.gameInstanceMetadata.data.createdBy;
      return playerUserId === emitterUserId || currentHostUserId === emitterUserId;
    }

    if (!PlayerStateValidatorService.OWNER_ONLY_PROPERTIES.has(event.property)) {
      return true;
    }

    return playerUserId === emitterUserId;
  }

  private validateSelectionChange(
    event: ProbableWafflePlayerDataChangeEvent,
    gameInstance: ProbableWaffleGameInstance
  ): boolean {
    if (event.property === ProbableWafflePlayerDataChangeProperties.SelectionCleared) {
      return true;
    }

    const selection = event.data.playerStateData?.selection;
    if (!Array.isArray(selection) || selection.length > PlayerStateValidatorService.MAX_SELECTION_SIZE) {
      this.logger.warn(`[PlayerState] Invalid selection payload for ${event.property} in ${event.gameInstanceId}`);
      return false;
    }

    const actorIndex = this.getActorIndex(gameInstance);
    for (const actorId of selection) {
      if (typeof actorId !== "string" || actorId.length === 0) {
        this.logger.warn(`[PlayerState] Invalid selected actor id in ${event.gameInstanceId}`);
        return false;
      }

      const actor = actorIndex.get(actorId);
      if (!actor || actor.owner?.ownerId !== event.data.playerNumber) {
        this.logger.warn(
          `[PlayerState] Player ${event.data.playerNumber} referenced non-owned actor ${actorId} in selection update`
        );
        return false;
      }
    }

    return true;
  }

  private validateSelectionGroupsChange(
    event: ProbableWafflePlayerDataChangeEvent,
    gameInstance: ProbableWaffleGameInstance
  ): boolean {
    const selectionGroups = event.data.playerControllerData?.selectionGroups;
    if (!Array.isArray(selectionGroups) || selectionGroups.length > PlayerStateValidatorService.MAX_CONTROL_GROUPS) {
      this.logger.warn(`[PlayerState] Invalid selection groups payload in ${event.gameInstanceId}`);
      return false;
    }

    const seenGroupKeys = new Set<number>();
    const actorIndex = this.getActorIndex(gameInstance);
    const playerNumber = event.data.playerNumber;
    if (playerNumber === undefined) {
      return false;
    }
    for (const group of selectionGroups) {
      if (!this.isValidSelectionGroup(group, playerNumber, actorIndex, seenGroupKeys)) {
        this.logger.warn(
          `[PlayerState] Invalid control group ${group?.groupKey ?? "unknown"} for player ${event.data.playerNumber}`
        );
        return false;
      }
    }

    return true;
  }

  private validateLeftOrKilledChange(event: ProbableWafflePlayerDataChangeEvent): boolean {
    // Quit/elimination is intentionally simple here: ownership is enforced by
    // OWNER_ONLY_PROPERTIES and the payload itself is just a boolean flag.
    const leftOrKilled = event.data.playerControllerData?.leftOrKilled;
    if (typeof leftOrKilled !== "boolean") {
      this.logger.warn(`[PlayerState] Invalid leftOrKilled payload in ${event.gameInstanceId}`);
      return false;
    }

    return true;
  }

  private validateHousingChange(
    event: ProbableWafflePlayerDataChangeEvent,
    gameInstance: ProbableWaffleGameInstance
  ): boolean {
    const housing = event.data.playerStateData?.housing;
    if (!housing) {
      this.logger.warn(`[PlayerState] Missing housing payload for ${event.property} in ${event.gameInstanceId}`);
      return false;
    }

    const playerNumber = event.data.playerNumber;
    if (playerNumber === undefined) {
      return false;
    }
    const player = gameInstance.getPlayerByNumber(playerNumber);
    if (!player) {
      return false;
    }

    const currentHousing = player.playerState.data.housing;
    const projected = {
      currentHousing: currentHousing.currentHousing,
      maxHousing: currentHousing.maxHousing
    } satisfies PlayerStateHousing;

    switch (event.property) {
      case ProbableWafflePlayerDataChangeProperties.HousingAdded:
        if (!this.isFinitePositiveNumber(housing.maxHousing)) {
          return false;
        }
        projected.maxHousing += housing.maxHousing;
        break;
      case ProbableWafflePlayerDataChangeProperties.HousingRemoved:
        if (!this.isFinitePositiveNumber(housing.maxHousing)) {
          return false;
        }
        projected.maxHousing -= housing.maxHousing;
        break;
      case ProbableWafflePlayerDataChangeProperties.HousingCurrentIncreased:
        if (!this.isFinitePositiveNumber(housing.currentHousing)) {
          return false;
        }
        projected.currentHousing += housing.currentHousing;
        break;
      case ProbableWafflePlayerDataChangeProperties.HousingCurrentDecreased:
        if (!this.isFinitePositiveNumber(housing.currentHousing)) {
          return false;
        }
        projected.currentHousing -= housing.currentHousing;
        break;
    }

    if (projected.currentHousing < 0 || projected.maxHousing < 0) {
      this.logger.warn(`[PlayerState] Invalid housing underflow for player ${event.data.playerNumber}`);
      return false;
    }

    return true;
  }

  private validateResourceChange(
    event: ProbableWafflePlayerDataChangeEvent,
    gameInstance: ProbableWaffleGameInstance
  ): boolean {
    const resources = event.data.playerStateData?.resources;
    const normalizedResources = this.normalizeResources(resources);
    if (!normalizedResources) {
      this.logger.warn(`[PlayerState] Invalid resource payload for ${event.property} in ${event.gameInstanceId}`);
      return false;
    }

    const playerNumber = event.data.playerNumber;
    if (playerNumber === undefined) {
      return false;
    }
    const player = gameInstance.getPlayerByNumber(playerNumber);
    if (!player) {
      return false;
    }

    if (event.property === ProbableWafflePlayerDataChangeProperties.ResourceRemoved) {
      for (const [resourceType, amount] of Object.entries(normalizedResources)) {
        if ((player.playerState.data.resources[resourceType as ResourceType] ?? 0) < amount) {
          this.logger.warn(
            `[PlayerState] Player ${event.data.playerNumber} cannot afford ${amount} ${resourceType} in ${event.gameInstanceId}`
          );
          return false;
        }
      }
      return true;
    }

    const carriedResources = this.getCarriedResources(gameInstance, playerNumber);
    const hasRefundableState = this.hasRefundableState(gameInstance, playerNumber);
    for (const [resourceType, amount] of Object.entries(normalizedResources)) {
      if (amount <= (carriedResources[resourceType as ResourceType] ?? 0)) {
        continue;
      }

      if (!hasRefundableState) {
        this.logger.warn(
          `[PlayerState] Unexplained resource gain for player ${event.data.playerNumber}: ${amount} ${resourceType}`
        );
        return false;
      }
    }

    return true;
  }

  private normalizeResources(
    resources: Partial<PlayerStateResources> | undefined
  ): Partial<PlayerStateResources> | null {
    if (!resources || typeof resources !== "object") {
      return null;
    }

    const normalizedEntries = Object.entries(resources).filter(([, amount]) => amount !== undefined);
    if (normalizedEntries.length === 0) {
      return null;
    }

    const normalized: Partial<PlayerStateResources> = {};
    for (const [resourceType, amount] of normalizedEntries) {
      if (!this.isResourceType(resourceType) || !this.isFinitePositiveNumber(amount)) {
        return null;
      }
      normalized[resourceType] = amount;
    }

    return normalized;
  }

  private isValidSelectionGroup(
    group: SelectionGroupData,
    playerNumber: number,
    actorIndex: Map<string, ActorDefinition>,
    seenGroupKeys: Set<number>
  ): boolean {
    if (
      !Number.isInteger(group.groupKey) ||
      group.groupKey < 1 ||
      group.groupKey > PlayerStateValidatorService.MAX_CONTROL_GROUPS ||
      seenGroupKeys.has(group.groupKey)
    ) {
      return false;
    }
    seenGroupKeys.add(group.groupKey);

    if (!Array.isArray(group.actorIds) || group.actorIds.length > PlayerStateValidatorService.MAX_CONTROL_GROUP_SIZE) {
      return false;
    }

    if (!Number.isFinite(group.timestamp)) {
      return false;
    }

    const seenActorIds = new Set<string>();
    for (const actorId of group.actorIds) {
      if (typeof actorId !== "string" || actorId.length === 0 || seenActorIds.has(actorId)) {
        return false;
      }
      seenActorIds.add(actorId);

      const actor = actorIndex.get(actorId);
      if (!actor || actor.owner?.ownerId !== playerNumber) {
        return false;
      }
    }

    return true;
  }

  private getCarriedResources(
    gameInstance: ProbableWaffleGameInstance,
    playerNumber: number
  ): Partial<Record<ResourceType, number>> {
    const carriedResources: Partial<Record<ResourceType, number>> = {};
    for (const actor of gameInstance.gameState?.data.actors ?? []) {
      if (actor.owner?.ownerId !== playerNumber) {
        continue;
      }

      const carriedAmount = actor.gatherer?.carriedResourceAmount;
      const carriedType = actor.gatherer?.carriedResourceType;
      if (!carriedType || !this.isFinitePositiveNumber(carriedAmount)) {
        continue;
      }

      carriedResources[carriedType] = (carriedResources[carriedType] ?? 0) + carriedAmount;
    }

    return carriedResources;
  }

  private hasRefundableState(gameInstance: ProbableWaffleGameInstance, playerNumber: number): boolean {
    return (gameInstance.gameState?.data.actors ?? []).some((actor) => {
      if (actor.owner?.ownerId !== playerNumber) {
        return false;
      }

      const hasUnfinishedConstruction = actor.constructionSite !== undefined;
      const hasQueuedProduction = (actor.production?.queue?.length ?? 0) > 0;
      const hasQueuedResearch = (actor.research?.researches?.length ?? 0) > 0;

      return hasUnfinishedConstruction || hasQueuedProduction || hasQueuedResearch;
    });
  }

  private getActorIndex(gameInstance: ProbableWaffleGameInstance): Map<string, ActorDefinition> {
    const actorIndex = new Map<string, ActorDefinition>();
    for (const actor of gameInstance.gameState?.data.actors ?? []) {
      const actorId = actor.id?.id;
      if (!actorId) {
        continue;
      }
      actorIndex.set(actorId, actor);
    }
    return actorIndex;
  }

  private isResourceType(value: string): value is ResourceType {
    return Object.values(ResourceType).includes(value as ResourceType);
  }

  private isFinitePositiveNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
  }
}
