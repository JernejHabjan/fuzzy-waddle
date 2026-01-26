import { Blackboard } from "../../ai/blackboard";
import {
  ObjectNames,
  type PlayerAiBlackboardData,
  ResourceType,
  type Vector2Simple,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import type { MapAnalysis } from "./ai-behavior/map-analyzer";
import { ReservationPool } from "./resource-reservations";
import { getActorComponent } from "../../data/actor-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import GameObject = Phaser.GameObjects.GameObject;

export interface EnemyIntel {
  strength: number;
  unitsInCombat: number;
  flankOpen: boolean;
}

export class PlayerAiBlackboard extends Blackboard {
  constructor(
    public units: Phaser.GameObjects.GameObject[] = [],
    public workers: Phaser.GameObjects.GameObject[] = [],
    public defendingUnits: GameObject[] = [], // Units assigned for base defense
    public visibleEnemies: GameObject[] = [], // Enemies visible to the player
    public enemiesNearBase: GameObject[] = [], // Enemies within a certain range of the base
    public enemyBase: GameObject | null = null, // Reference to the enemy base
    public primaryTarget: GameObject | null = null, // The main target to attack (an enemy unit or building)
    public mapFullyExplored: boolean = false,
    public trainingBuildings: Phaser.GameObjects.GameObject[] = [], // Buildings that can train new units
    public productionBuildings: GameObject[] = [], // Buildings that produce resources or military units
    public defensiveStructures: GameObject[] = [], // Defensive buildings like towers, walls, etc.
    public gatheringStructures: GameObject[] = [], // Resource gathering buildings
    public baseSize: number = 0, // Current size of the player's base (based on expansion)
    public upgradeBuilding: Phaser.GameObjects.GameObject | null = null, // Building responsible for upgrades (tech or unit)
    public militaryStrength: number = 0, // Overall military power
    public enemyMilitaryStrength: number = 0, // Estimated enemy military strength
    public enemyFlankOpen: boolean = false, // Is the enemy's flank open for an attack?
    public enemyIntel: Record<number, EnemyIntel> = {}, // Per-enemy intel
    public enemiesInCombat: any[] = [], // Enemies currently engaged in combat
    public currentStrategy: string = "defensive", // Current strategy: "aggressive", "defensive", "economic"
    // Map analysis/cache (phase 1)
    public mapAnalysis: MapAnalysis | null = null,
    public baseCenterTile: Vector3Simple | null = null,
    public suggestedBuildTiles: Vector2Simple[] = [],
    // Planned building types (phase 2 planning output)
    public plannedBuildingTypes: string[] = [],
    // Logistics / tech (new lightweight fields)
    public activeTechUpgrades: number = 0,
    public lastTechUpgradeAt: number = 0,
    // Surrender state
    public wantsToSurrender: boolean = false,
    public surrenderOfferedAt: number = 0,
    public surrenderRejected: boolean = false,
    // public nextReservedBuilding?: { name: string; tile: Vector2Simple } // (optional future use)
    private reservationPool = new ReservationPool()
  ) {
    super();
    this.economy = {
      resources: { minerals: 0, stone: 0, wood: 0 },
      // Placeholder income/surplus structures (populated via updateFromWorld)
      incomeInstant: { minerals: 0, stone: 0, wood: 0 },
      incomeSmoothed: { minerals: 0, stone: 0, wood: 0 },
      lastIncomeSampleAt: 0,
      lastIncomeSnapshot: { minerals: 0, stone: 0, wood: 0 },
      reserved: { minerals: 0, stone: 0, wood: 0 },
      get available() {
        const out: Record<ResourceType, number> = { minerals: 0, stone: 0, wood: 0 };
        for (const k in out) {
          const r = k as ResourceType;
          out[r] = (this.resources[r] ?? 0) - (this.reserved[r] ?? 0);
        }
        return out;
      }
    };

    this.production = {
      trainingBuildings: this.trainingBuildings,
      productionBuildings: this.productionBuildings,
      defensiveStructures: this.defensiveStructures,
      supply: {
        used: 0,
        max: 0,
        pendingFromQueued: 0
      },
      queueSnapshots: [],
      plannedStructures: [], // will be used by later prompts
      prereqQueue: [] // pending prerequisite build/produce tasks
    };

    this.army = {
      militaryStrength: this.militaryStrength,
      enemyMilitaryStrength: this.enemyMilitaryStrength,
      enemyIntel: this.enemyIntel,
      defendingUnits: this.defendingUnits,
      enemiesInCombat: this.enemiesInCombat,
      visibleEnemies: this.visibleEnemies,
      primaryTarget: this.primaryTarget
    };

    this.intel = {
      enemyBase: this.enemyBase,
      enemyFlankOpen: this.enemyFlankOpen,
      mapFullyExplored: this.mapFullyExplored,
      enemyPowerTrend: [],
      lastScoutedAt: 0
    };

    this.map = {
      analysis: this.mapAnalysis,
      baseCenterTile: this.baseCenterTile,
      suggestedBuildTiles: this.suggestedBuildTiles
    };

    this.strategy = {
      current: this.currentStrategy,
      baseSize: this.baseSize,
      modeLockedUntil: 0
    };

    this.combat = {
      engagements: [],
      lastEngagementAt: 0
    };

    this.logistics = {
      workers: this.workers,
      activeTechUpgrades: this.activeTechUpgrades,
      lastTechUpgradeAt: this.lastTechUpgradeAt
    };

    this.cooldowns = {
      analyzeMap: 0,
      strategyShift: 0,
      attackTrigger: 0,
      scoutingTier: 0
    };

    this.diagnostics = {
      // Caches for derived metrics; simple time-based invalidation.
      caches: {
        aggregateIncome: { lastComputedAt: 0, value: 0, horizonMs: 0 },
        attackPowerRatio: { lastComputedAt: 0, value: 0 }
      },
      lastUpdateAt: 0
    };
  }

  getMostNeededResource(): { type: ResourceType; amount: number } | null {
    // This method is kept for backward compatibility but currently returns null
    // The actual logic is in LogisticsManager.getMostConstrainedResource()
    // If you need urgency calculation here, pass the logistics manager as a parameter
    // to methods that call this, or refactor to use LogisticsManager directly
    return null;
  }

  getTotalResources(): number {
    let total = 0;
    for (const key in this.economy.resources) {
      total += this.economy.resources[key as ResourceType] ?? 0;
    }
    return total;
  }

  hasAtLeastResources(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const key in cost) {
      const r = key as ResourceType;
      const needed = cost[r] ?? 0;
      if ((this.economy.resources[r] ?? 0) < needed) return false;
    }
    return true;
  }

  getData(): PlayerAiBlackboardData {
    return {
      currentStrategy: this.currentStrategy,
      baseSize: this.baseSize,
      wantsToSurrender: this.wantsToSurrender,
      surrenderOfferedAt: this.surrenderOfferedAt,
      surrenderRejected: this.surrenderRejected,

      activeTechUpgrades: this.activeTechUpgrades,
      lastTechUpgradeAt: this.lastTechUpgradeAt,

      economy: {
        resources: { ...this.economy.resources },
        reserved: { ...this.economy.reserved },
        incomeInstant: { ...this.economy.incomeInstant },
        incomeSmoothed: { ...this.economy.incomeSmoothed },
        lastIncomeSampleAt: this.economy.lastIncomeSampleAt,
        lastIncomeSnapshot: { ...this.economy.lastIncomeSnapshot }
      },

      production: {
        supply: { ...this.production.supply },
        plannedStructures: this.production.plannedStructures.map((p) => ({ ...p })),
        prereqQueue: this.production.prereqQueue.map((p) => ({ ...p }))
      },

      army: {
        militaryStrength: this.militaryStrength,
        enemyMilitaryStrength: this.enemyMilitaryStrength,
        enemyIntel: structuredClone(this.enemyIntel)
      },

      intel: {
        enemyFlankOpen: this.enemyFlankOpen,
        mapFullyExplored: this.mapFullyExplored,
        enemyPowerTrend: [...this.intel.enemyPowerTrend],
        lastScoutedAt: this.intel.lastScoutedAt
      },

      map: {
        baseCenterTile: this.baseCenterTile,
        suggestedBuildTiles: [...this.suggestedBuildTiles]
      },

      strategy: {
        current: this.strategy.current,
        baseSize: this.strategy.baseSize,
        modeLockedUntil: this.strategy.modeLockedUntil
      },

      combat: {
        engagements: [...this.combat.engagements],
        lastEngagementAt: this.combat.lastEngagementAt
      },

      cooldowns: { ...this.cooldowns }
    };
  }

  setData(data: Partial<PlayerAiBlackboardData>, _scene: Phaser.Scene): void {
    if (!data) return;

    // ---- Strategy & meta ----
    this.currentStrategy = data.currentStrategy ?? this.currentStrategy;
    this.baseSize = data.baseSize ?? this.baseSize;
    this.wantsToSurrender = data.wantsToSurrender ?? this.wantsToSurrender;
    this.surrenderOfferedAt = data.surrenderOfferedAt ?? this.surrenderOfferedAt;
    this.surrenderRejected = data.surrenderRejected ?? this.surrenderRejected;

    this.activeTechUpgrades = data.activeTechUpgrades ?? this.activeTechUpgrades;
    this.lastTechUpgradeAt = data.lastTechUpgradeAt ?? this.lastTechUpgradeAt;

    // ---- Economy ----
    if (data.economy) {
      Object.assign(this.economy.resources, data.economy.resources);
      Object.assign(this.economy.reserved, data.economy.reserved);
      Object.assign(this.economy.incomeInstant, data.economy.incomeInstant);
      Object.assign(this.economy.incomeSmoothed, data.economy.incomeSmoothed);
      this.economy.lastIncomeSampleAt = data.economy.lastIncomeSampleAt ?? 0;
      Object.assign(this.economy.lastIncomeSnapshot, data.economy.lastIncomeSnapshot);
    }

    // ---- Production ----
    if (data.production) {
      Object.assign(this.production.supply, data.production.supply);
      this.production.plannedStructures = data.production.plannedStructures
        ? [...data.production.plannedStructures]
        : [];
      this.production.prereqQueue = data.production.prereqQueue ? [...data.production.prereqQueue] : [];
    }

    // ---- Army (numbers only) ----
    if (data.army) {
      this.militaryStrength = data.army.militaryStrength ?? this.militaryStrength;
      this.enemyMilitaryStrength = data.army.enemyMilitaryStrength ?? this.enemyMilitaryStrength;
      this.enemyIntel = data.army.enemyIntel ? structuredClone(data.army.enemyIntel) : {};
    }

    // ---- Intel ----
    if (data.intel) {
      this.enemyFlankOpen = data.intel.enemyFlankOpen ?? this.enemyFlankOpen;
      this.mapFullyExplored = data.intel.mapFullyExplored ?? this.mapFullyExplored;
      this.intel.enemyPowerTrend = data.intel.enemyPowerTrend ? [...data.intel.enemyPowerTrend] : [];
      this.intel.lastScoutedAt = data.intel.lastScoutedAt ?? 0;
    }

    // ---- Map ----
    if (data.map) {
      this.baseCenterTile = data.map.baseCenterTile ?? null;
      this.suggestedBuildTiles = data.map.suggestedBuildTiles ? [...data.map.suggestedBuildTiles] : [];
    }

    // ---- Strategy slice ----
    if (data.strategy) {
      this.strategy.current = data.strategy.current ?? this.strategy.current;
      this.strategy.baseSize = data.strategy.baseSize ?? this.strategy.baseSize;
      this.strategy.modeLockedUntil = data.strategy.modeLockedUntil ?? 0;
    }

    // ---- Combat ----
    if (data.combat) {
      this.combat.engagements = data.combat.engagements ? [...data.combat.engagements] : [];
      this.combat.lastEngagementAt = data.combat.lastEngagementAt ?? 0;
    }

    // ---- Cooldowns ----
    if (data.cooldowns) {
      Object.assign(this.cooldowns, data.cooldowns);
    }

    // ---- Clear GameObject references (will be repopulated by world state update) ----
    this.clearGameObjectReferences();

    // ---- Rebuild ReservationPool from restored plannedStructures ----
    this.rebuildReservationPool();
  }

  /**
   * Clears all GameObject references.
   * These will be repopulated by the AI's world state update mechanism
   * which runs periodically and discovers units/buildings from the scene.
   */
  private clearGameObjectReferences(): void {
    // Clear unit arrays
    this.units.length = 0;
    this.workers.length = 0;
    this.defendingUnits.length = 0;

    // Clear enemy arrays
    this.visibleEnemies.length = 0;
    this.enemiesNearBase.length = 0;
    this.enemiesInCombat.length = 0;

    // Clear building arrays
    this.trainingBuildings.length = 0;
    this.productionBuildings.length = 0;
    this.defensiveStructures.length = 0;
    this.gatheringStructures.length = 0;

    // Clear single object references
    this.enemyBase = null;
    this.primaryTarget = null;
    this.upgradeBuilding = null;

    // Clear slice references that mirror arrays
    this.army.defendingUnits.length = 0;
    this.army.enemiesInCombat.length = 0;
    this.army.visibleEnemies.length = 0;
    this.army.primaryTarget = null;
    this.intel.enemyBase = null;
    this.logistics.workers.length = 0;
    this.production.trainingBuildings.length = 0;
    this.production.productionBuildings.length = 0;
    this.production.defensiveStructures.length = 0;
  }

  /**
   * Rebuilds the ReservationPool from production.plannedStructures.
   * This restores resource reservations after loading a saved game.
   */
  private rebuildReservationPool(): void {
    // Clear existing reservations by creating a new pool
    this.reservationPool = new ReservationPool();

    const now = performance.now();
    const defaultTtlMs = 15000; // Same as beginPlannedStructure default

    for (const plan of this.production.plannedStructures) {
      // Calculate remaining TTL based on when reservation was made
      // If reservedAt is old, use a fresh TTL to give time for the build to complete
      const age = now - plan.reservedAt;
      const remainingTtl = Math.max(defaultTtlMs - age, defaultTtlMs); // At least full TTL after load

      this.reservationPool.reserve(plan.id, plan.cost, remainingTtl, now);
    }

    // Update economy.reserved to reflect rebuilt reservations
    this.economy.reserved = this.reservationPool.getTotals();
  }

  /**
   * Returns a list of workers that are currently idle.
   */
  getIdleWorkers(): GameObject[] {
    return this.workers.filter((worker) => {
      const payerPawnAiController = getActorComponent(worker, PawnAiController);
      if (!payerPawnAiController) return false;
      const order = payerPawnAiController.blackboard.getCurrentOrder();
      return !order;
    });
  }

  // Slices
  public readonly economy!: {
    resources: Record<ResourceType, number>;
    incomeInstant: Record<ResourceType, number>;
    incomeSmoothed: Record<ResourceType, number>;
    lastIncomeSampleAt: number;
    lastIncomeSnapshot: Record<ResourceType, number>;
    reserved: Record<ResourceType, number>;
    readonly available: Record<ResourceType, number>;
  };
  public readonly production!: {
    trainingBuildings: Phaser.GameObjects.GameObject[];
    productionBuildings: any[]; // align w/ existing field type
    defensiveStructures: any[];
    supply: {
      used: number;
      max: number;
      pendingFromQueued: number;
    };
    queueSnapshots: Array<{ at: number; queued: string[] }>;
    plannedStructures: Array<{
      id: string;
      name: ObjectNames;
      reservedAt: number;
      cost: Partial<Record<ResourceType, number>>;
    }>;
    prereqQueue: Array<{
      id: string;
      type: "produce" | "construct";
      objectName: ObjectNames;
      insertedAt: number;
    }>;
  };
  public readonly army!: {
    militaryStrength: number;
    enemyMilitaryStrength: number;
    enemyIntel: Record<number, EnemyIntel>;
    defendingUnits: any[];
    enemiesInCombat: any[];
    visibleEnemies: any[];
    primaryTarget: any;
  };
  public readonly intel!: {
    enemyBase: any;
    enemyFlankOpen: boolean;
    mapFullyExplored: boolean;
    enemyPowerTrend: Array<{ at: number; own: number; enemy: number }>;
    lastScoutedAt: number;
  };
  public readonly map!: {
    analysis: MapAnalysis | null;
    baseCenterTile: Vector2Simple | null;
    suggestedBuildTiles: Vector2Simple[];
  };
  public readonly strategy!: {
    current: string;
    baseSize: number;
    modeLockedUntil: number; // ms timestamp until which strategy is locked
  };
  public readonly combat!: {
    engagements: Array<{ id: string; startedAt: number; ourUnits: number; enemyUnits: number }>;
    lastEngagementAt: number;
  };
  public readonly logistics!: {
    workers: Phaser.GameObjects.GameObject[];
    activeTechUpgrades: number;
    lastTechUpgradeAt: number;
  };
  public readonly cooldowns!: {
    analyzeMap: number;
    strategyShift: number;
    attackTrigger: number;
    scoutingTier: number;
  };
  public readonly diagnostics!: {
    caches: {
      aggregateIncome: { lastComputedAt: number; value: number; horizonMs: number };
      attackPowerRatio: { lastComputedAt: number; value: number };
    };
    lastUpdateAt: number;
    reservationsDenied?: number; // appended dynamically
    reservationsGranted?: number; // appended dynamically
    telemetry?: any; // appended dynamically
  };

  /** Returns ratio (own/enemy) with graceful handling of zero enemy strength. */
  getAttackPowerRatio(now: number = performance.now()): number {
    const cache = this.diagnostics.caches.attackPowerRatio;
    if (now - cache.lastComputedAt < 250) return cache.value;
    const enemy = this.enemyMilitaryStrength || 1; // avoid div by zero
    const ratio = this.militaryStrength / enemy;
    cache.value = ratio;
    cache.lastComputedAt = now;
    return ratio;
  }

  /** Aggregated income estimate across all resources for a future horizon (ms). Placeholder linear extrapolation. */
  getAggregateIncomeEstimate(horizonMs: number, now: number = performance.now()): number {
    const cache = this.diagnostics.caches.aggregateIncome;
    if (cache.horizonMs === horizonMs && now - cache.lastComputedAt < 250) return cache.value;
    const seconds = horizonMs / 1000;
    let total = 0;
    for (const k in this.economy.incomeSmoothed) {
      const r = k as ResourceType;
      total += (this.economy.incomeSmoothed[r] || 0) * seconds;
    }
    cache.value = total;
    cache.horizonMs = horizonMs;
    cache.lastComputedAt = now;
    return total;
  }

  /** Whether current strategy is under a lock (preventing shifts). */
  isStrategyLocked(now: number = performance.now()): boolean {
    return now < this.strategy.modeLockedUntil;
  }

  // Strategy control helpers appended for cooldown & hysteresis integration.
  /** Lock strategy mode and record shift meta without side effects outside blackboard. */
  lockStrategy(newMode: string, now: number, durationMs: number): void {
    this.currentStrategy = newMode; // maintain legacy field
    this.strategy.current = newMode; // mirrored slice
    this.strategy.modeLockedUntil = now + durationMs;
    // track last shift timestamp in cooldowns (used by agent gating)
    this.cooldowns.strategyShift = now;
  }

  /** Reserve resources for a planned structure; returns token or null if denied. */
  private reserveForPlan(
    token: string,
    cost: Partial<Record<ResourceType, number>>,
    ttlMs: number,
    now: number
  ): string | null {
    // Refresh current totals then attempt reservation
    const totalsBefore = this.reservationPool.getTotals();
    // Compute hypothetical availability check first
    for (const k in cost) {
      const r = k as ResourceType;
      const needed = cost[r] || 0;
      const available = (this.economy.resources[r] || 0) - (this.economy.reserved[r] || 0);
      if (available < needed) {
        // track denial
        this.diagnostics.reservationsDenied = (this.diagnostics.reservationsDenied || 0) + 1;
        return null;
      }
    }
    const res = this.reservationPool.reserve(token, cost, ttlMs, now);
    // Update economy.reserved snapshot to reflect new totals
    const totals = this.reservationPool.getTotals();
    this.economy.reserved = totals; // overwrite (breaking change acceptable)
    this.diagnostics.reservationsGranted = (this.diagnostics.reservationsGranted || 0) + 1;
    // Sanity: negative available detection
    for (const r of Object.keys(this.economy.resources) as ResourceType[]) {
      if ((this.economy.resources[r] || 0) - (totals[r] || 0) < 0) {
        // eslint-disable-next-line no-console
        console.warn("Reservation over-allocation detected", r, this.economy.resources[r], totals[r]);
      }
    }
    return res.id;
  }

  /** Begin a planned structure and record internal meta list. */
  beginPlannedStructure(name: ObjectNames, cost: Partial<Record<ResourceType, number>>, now: number, ttlMs = 15000) {
    const id = `${name}-${now}-${Math.random().toString(36).slice(2)}`;
    const token = this.reserveForPlan(id, cost, ttlMs, now);
    if (!token) return null;
    const plan = { id, name, reservedAt: now, cost };
    this.production.plannedStructures.push(plan);
    return plan;
  }

  /** Release reservation for a planned structure (on success or timeout). */
  releasePlannedStructure(id: string, now: number) {
    const idx = this.production.plannedStructures.findIndex((p) => p.id === id);
    if (idx >= 0) this.production.plannedStructures.splice(idx, 1);
    if (this.reservationPool.has(id)) {
      this.reservationPool.release(id);
      this.economy.reserved = this.reservationPool.getTotals();
    }
  }

  /** Called periodically to prune expired reservations and planned structures. */
  pruneExpiredReservations(now: number) {
    this.reservationPool.prune(now);
    this.economy.reserved = this.reservationPool.getTotals();
    // Drop orphaned planned structures with no reservation
    this.production.plannedStructures = this.production.plannedStructures.filter((p) => this.reservationPool.has(p.id));
  }

  /** Supply block / forecast helpers */
  forecastSupplyUsage(horizonMs: number): number {
    // simplistic: current used + queued pending supply consumption (no growth model yet)
    return this.production.supply.used + this.production.supply.pendingFromQueued;
  }

  // Telemetry container appended if absent
  getTelemetrySnapshot() {
    return this.diagnostics.telemetry || null;
  }

  // Extend diagnostics object at runtime with telemetry & counters (non-breaking access pattern)
  // (We keep the original diagnostics shape comment untouched.
  // Closing augmentation: ensure class ends cleanly (file was previously truncated during migration edits).
}

// Minimal world snapshot interface (internal placeholder for phase 1 & later updates)
interface WorldSnapshot {
  resources: Partial<Record<ResourceType, number>>;
  units: Phaser.GameObjects.GameObject[];
  workers: Phaser.GameObjects.GameObject[];
  militaryStrength: number;
  enemyMilitaryStrength: number;
  housingCapacity: number;
  mapAnalysis: MapAnalysis | null;
}
