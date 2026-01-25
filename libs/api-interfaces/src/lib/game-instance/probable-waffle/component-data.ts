import type { Vector3Simple } from "../../game/vector";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { ObjectNames } from "./object-names";
import type { ActorId } from "../player/player";

export interface VisionComponentData {
  visibilityByCurrentPlayer?: boolean;
}

export interface AttackComponentData {
  remainingCooldown?: number;
  currentAttackIndex?: number;
}

export interface HealingComponentData {
  remainingCooldown?: number;
}

export interface BuilderComponentData {
  remainingCooldown?: number;
  assignedConstructionSiteId?: string;
}

export interface GathererComponentData {
  carriedResourceAmount?: number;
  carriedResourceType?: ResourceType | null;
  remainingCooldown?: number;
}

export interface ContainerComponentData {
  containedIds?: ActorId[];
}

export interface ResourceDrainComponentData {
  currentCapacity?: number;
}

export interface ResourceSourceComponentData {
  currentResources?: number;
}

export interface ProductionComponentData {
  queue?: ObjectNames[];
  isProducing?: boolean;
  progress?: number;
  rallyPoint?: RallyPointComponentData;
}

export interface RallyPointComponentData {
  tileVec3?: Vector3Simple;
  worldVec3?: Vector3Simple;
  actorId?: ActorId;
}

export interface ActorTranslateComponentData {
  x?: number;
  y?: number;
  z?: number;
  facingAngle?: number;
}

export interface WalkableComponentData {
  speed?: number;
  pathingRadius?: number;
}

export interface RepresentableComponentData {
  logicalWorldTransform?: Vector3Simple;
}

export interface OwnerComponentData {
  ownerId?: number;
}

export interface SelectableComponentData {
  selected?: boolean;
}

export interface IdComponentData {
  id?: string;
}

export interface BackboardComponentData {
  blackboard: Record<string, any>;
}

export interface HousingComponentData {
  housingProvided?: boolean;
}

// Selection group data for save/load
export interface SelectionGroupData {
  groupKey: number;
  actorIds: ActorId[];
  timestamp: number;
}

// Camera state data for save/load
export interface CameraStateData {
  scrollX?: number;
  scrollY?: number;
  zoom?: number;
}
// Player AI blackboard data for save/load
export interface PlayerAiBlackboardData {
  // ---- Legacy / top-level ----
  currentStrategy?: string;
  baseSize?: number;
  mapFullyExplored?: boolean;
  wantsToSurrender?: boolean;
  surrenderOfferedAt?: number;
  surrenderRejected?: boolean;
  activeTechUpgrades?: number;
  lastTechUpgradeAt?: number;

  // ---- Economy ----
  economy?: {
    resources: Record<string, number>;
    reserved: Record<string, number>;

    incomeInstant?: Record<string, number>;
    incomeSmoothed?: Record<string, number>;
    lastIncomeSampleAt?: number;
    lastIncomeSnapshot?: Record<string, number>;
  };

  // ---- Production ----
  production?: {
    supply: {
      used: number;
      max: number;
      pendingFromQueued: number;
    };

    // NEW
    plannedStructures?: Array<{
      id: string;
      name: ObjectNames;
      reservedAt: number;
      cost: Partial<Record<ResourceType, number>>;
    }>;

    prereqQueue?: Array<{
      id: string;
      type: "produce" | "construct";
      objectName: ObjectNames;
      insertedAt: number;
    }>;
  };

  // ---- Army (numbers only, no GameObjects) ----
  army?: {
    militaryStrength: number;
    enemyMilitaryStrength: number;
    enemyIntel: Record<
      number,
      {
        strength: number;
        unitsInCombat: number;
        flankOpen: boolean;
      }
    >;
  };

  // ---- Intel ----
  intel?: {
    enemyFlankOpen: boolean;
    mapFullyExplored: boolean;
    enemyPowerTrend: Array<{
      at: number;
      own: number;
      enemy: number;
    }>;
    lastScoutedAt: number;
  };

  // ---- Map / planning ----
  map?: {
    baseCenterTile: Vector3Simple | null;
    suggestedBuildTiles: Array<{ x: number; y: number }>;
  };

  // ---- Strategy slice ----
  strategy?: {
    current: string;
    baseSize: number;
    modeLockedUntil: number;
  };

  // ---- Combat metadata ----
  combat?: {
    engagements: Array<{
      id: string;
      startedAt: number;
      ourUnits: number;
      enemyUnits: number;
    }>;
    lastEngagementAt: number;
  };

  // ---- Cooldowns ----
  cooldowns?: Record<string, number>;
}

// AI behavior tree state data for save/load
export interface AIBehaviorTreeStateData {
  blackboard: PlayerAiBlackboardData;
  telemetry?: unknown;
}

export interface ConvertibleComponentData {
  detectionRange?: number;
  checkInterval?: number;
}
