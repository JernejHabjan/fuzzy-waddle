import { Blackboard } from "../../ai/blackboard";
import { ObjectNames, ResourceType, type Vector2Simple, type Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import type { MapAnalysis } from "./ai-behavior/map-analyzer";
import { ReservationPool } from "./resource-reservations";
import GameObject = Phaser.GameObjects.GameObject;

export class PlayerAiBlackboard extends Blackboard {
  constructor(
    public resources: Record<ResourceType, number> = {
      // todo this is not updated from world yet
      ambrosia: 1000,
      food: 1000,
      minerals: 1000,
      stone: 1000,
      wood: 1000
    },
    public units: Phaser.GameObjects.GameObject[] = [],
    public workers: Phaser.GameObjects.GameObject[] = [],
    public defendingUnits: GameObject[] = [], // Units assigned for base defense
    public visibleEnemies: GameObject[] = [], // Enemies visible to the player
    public enemiesNearBase: GameObject[] = [], // Enemies within a certain range of the base
    public enemyBase: any = null, // Reference to the enemy base
    public primaryTarget: GameObject | null = null, // The main target to attack (an enemy unit or building)
    public mapFullyExplored: boolean = false,
    public trainingBuildings: Phaser.GameObjects.GameObject[] = [], // Buildings that can train new units
    public productionBuildings: any[] = [], // Buildings that produce resources or military units
    public defensiveStructures: any[] = [], // Defensive buildings like towers, walls, etc.
    public desiredProductionBuildings: number = 5, // Desired number of production buildings
    public desiredDefensiveStructures: number = 3, // Desired number of defensive buildings
    public housingCapacity: number = 0, // Total housing capacity for the player's units
    public baseSize: number = 0, // Current size of the player's base (based on expansion)
    public desiredBaseSize: number = 3, // Desired size of the player's base (expansion goal)
    public upgradeBuilding: Phaser.GameObjects.GameObject | null = null, // Building responsible for upgrades (tech or unit)
    public militaryStrength: number = 0, // Overall military power
    public enemyMilitaryStrength: number = 0, // Estimated enemy military strength
    public enemyFlankOpen: boolean = false, // Is the enemy's flank open for an attack?
    public enemiesInCombat: any[] = [], // Enemies currently engaged in combat
    public selectedStructure: any = null, // The structure currently selected by the player
    public currentStrategy: string = "defensive", // Current strategy: "aggressive", "defensive", "economic"
    // Map analysis/cache (phase 1)
    public mapAnalysis: MapAnalysis | null = null,
    public baseCenterTile: Vector3Simple | null = null,
    public suggestedBuildTiles: Vector2Simple[] = [],
    // Planned building types (phase 2 planning output)
    public plannedBuildingTypes: string[] = [],
    // Logistics / tech (new lightweight fields)
    public activeTechUpgrades: number = 0,
    public lastTechUpgradeAt: number = 0
    // public nextReservedBuilding?: { name: string; tile: Vector2Simple } // (optional future use)
  ) {
    super();
    // --- Phase 1 Augmentation: Construct modular slice objects (non-breaking). ---
    // These slices mirror existing primitive fields to enable future refactors without
    // renaming legacy public properties.
    this.economy = {
      resources: this.resources,
      // Placeholder income/surplus structures (populated via updateFromWorld)
      incomePerSecond: { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 },
      lastIncomeSampleAt: 0,
      lastIncomeSnapshot: { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 },
      reserved: { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 },
      get available() {
        const out: Record<ResourceType, number> = { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 };
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
      desiredProductionBuildings: this.desiredProductionBuildings,
      desiredDefensiveStructures: this.desiredDefensiveStructures,
      housingCapacity: this.housingCapacity,
      supply: {
        used: 0,
        max: this.housingCapacity,
        pendingFromQueued: 0,
        projectedUsedAt: (horizonMs: number) => 0 // updated later
      },
      queueSnapshots: [],
      plannedStructures: [], // will be used by later prompts
      prereqQueue: [] // pending prerequisite build/produce tasks
    };

    this.army = {
      militaryStrength: this.militaryStrength,
      enemyMilitaryStrength: this.enemyMilitaryStrength,
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
      desiredBaseSize: this.desiredBaseSize,
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

  availableStructures(): Array<any> {
    // Example: Return available structures that can be built
    return [
      { name: "Barracks", cost: 150 },
      { name: "Farm", cost: 100 },
      { name: "Tower", cost: 200 }
    ];
  }

  getMostNeededResource(): { type: ResourceType; amount: number } | null {
    // Example heuristic based on wood only (placeholder)
    // Enhanced: now examines all tracked resources and returns the lowest stock (excluding zero-total case).
    let lowest: { type: ResourceType; amount: number } | null = null;
    for (const key in this.resources) {
      const r = key as ResourceType;
      const amt = this.resources[r] ?? 0;
      if (lowest === null || amt < lowest.amount) {
        lowest = { type: r, amount: amt };
      }
    }
    if (!lowest) return null;
    // Target buffer logic (very naive): request enough to bring to tier thresholds
    if (lowest.amount < 200) return { type: lowest.type, amount: 300 };
    if (lowest.amount < 500) return { type: lowest.type, amount: 200 };
    return null;
  }

  getTotalResources(): number {
    let total = 0;
    for (const key in this.resources) {
      total += this.resources[key as ResourceType] ?? 0;
    }
    return total;
  }

  hasAtLeastResources(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const key in cost) {
      const r = key as ResourceType;
      const needed = cost[r] ?? 0;
      if ((this.resources[r] ?? 0) < needed) return false;
    }
    return true;
  }

  // Optional storage for debugging adaptive thresholds (not currently populated; reserved for future use)
  public debugAdaptiveThresholds?: Record<string, number>;

  getData(): Record<string, any> {
    throw new Error("Method not implemented.");
  }
  setData(data: Partial<Record<string, any>>, scene: Phaser.Scene): void {
    throw new Error("Method not implemented.");
  }

  // Slices
  public readonly economy!: {
    resources: Record<ResourceType, number>;
    incomePerSecond: Record<ResourceType, number>;
    lastIncomeSampleAt: number;
    lastIncomeSnapshot: Record<ResourceType, number>;
    reserved: Record<ResourceType, number>;
    readonly available: Record<ResourceType, number>;
  };
  public readonly production!: {
    trainingBuildings: Phaser.GameObjects.GameObject[];
    productionBuildings: any[]; // align w/ existing field type
    defensiveStructures: any[];
    desiredProductionBuildings: number;
    desiredDefensiveStructures: number;
    housingCapacity: number;
    supply: {
      used: number;
      max: number;
      pendingFromQueued: number;
      projectedUsedAt: (horizonMs: number) => number;
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
    desiredBaseSize: number;
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

  /** Getter mapping for future pivot; returns current military strength (own). */
  getMilitaryStrength(): number {
    return this.militaryStrength;
  }
  /** Getter returning enemy strength estimate. */
  getEnemyStrength(): number {
    return this.enemyMilitaryStrength;
  }
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

  /** Returns a shallow copy of current free (unreserved) resources. */
  getFreeResources(): Record<ResourceType, number> {
    const out: Record<ResourceType, number> = { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 };
    for (const k in out) {
      const r = k as ResourceType;
      out[r] = (this.resources[r] ?? 0) - (this.economy.reserved[r] ?? 0);
    }
    return out;
  }

  /** Aggregated income estimate across all resources for a future horizon (ms). Placeholder linear extrapolation. */
  getAggregateIncomeEstimate(horizonMs: number, now: number = performance.now()): number {
    const cache = this.diagnostics.caches.aggregateIncome;
    if (cache.horizonMs === horizonMs && now - cache.lastComputedAt < 250) return cache.value;
    const seconds = horizonMs / 1000;
    let total = 0;
    for (const k in this.economy.incomePerSecond) {
      const r = k as ResourceType;
      total += (this.economy.incomePerSecond[r] || 0) * seconds;
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

  /** Returns true if strategy shift cooldown is satisfied given interval. */
  isStrategyCooldownReady(now: number, intervalMs: number): boolean {
    return now - this.cooldowns.strategyShift >= intervalMs;
  }

  /** Mark a strategy shift attempt time without locking (used for rejected attempts metrics later). */
  markStrategyShiftAttempt(now: number): void {
    // Placeholder for future telemetry; intentionally minimal now.
    // Could accumulate attempt counts inside diagnostics later.
  }

  /** Update blackboard slices from a world snapshot. Keeps legacy fields in sync. */
  updateFromWorld(snapshot: Partial<WorldSnapshot>, now: number): void {
    // Update primitive canonical fields first.
    if (snapshot.resources) {
      for (const k in snapshot.resources) {
        const r = k as ResourceType;
        const v = snapshot.resources[r];
        if (typeof v === "number") this.resources[r] = v;
      }
    }
    if (snapshot.units) this.units = snapshot.units;
    if (snapshot.workers) this.workers = snapshot.workers;
    if (typeof snapshot.militaryStrength === "number") this.militaryStrength = snapshot.militaryStrength;
    if (typeof snapshot.enemyMilitaryStrength === "number") this.enemyMilitaryStrength = snapshot.enemyMilitaryStrength;
    if (typeof snapshot.housingCapacity === "number") this.housingCapacity = snapshot.housingCapacity;
    if (snapshot.mapAnalysis !== undefined) this.mapAnalysis = snapshot.mapAnalysis;

    // Economy income sampling (simple delta over time placeholder)
    if (snapshot.resources) {
      const econ = this.economy;
      if (econ.lastIncomeSampleAt > 0) {
        const dt = (now - econ.lastIncomeSampleAt) / 1000;
        if (dt > 0) {
          for (const k in econ.resources) {
            const r = k as ResourceType;
            const diff = (econ.resources[r] ?? 0) - (econ.lastIncomeSnapshot[r] ?? 0);
            econ.incomePerSecond[r] = diff / dt;
          }
        }
      }
      econ.lastIncomeSampleAt = now;
      for (const k in econ.resources) {
        const r = k as ResourceType;
        econ.lastIncomeSnapshot[r] = econ.resources[r];
      }
    }

    // Sync slices to primitives (one-direction for now)
    Object.assign(this.army, {
      militaryStrength: this.militaryStrength,
      enemyMilitaryStrength: this.enemyMilitaryStrength
    });
    Object.assign(this.production, {
      trainingBuildings: this.trainingBuildings,
      productionBuildings: this.productionBuildings,
      defensiveStructures: this.defensiveStructures,
      desiredProductionBuildings: this.desiredProductionBuildings,
      desiredDefensiveStructures: this.desiredDefensiveStructures,
      housingCapacity: this.housingCapacity,
      supply: {
        ...this.production.supply,
        max: this.housingCapacity
      }
    });
    Object.assign(this.map, {
      analysis: this.mapAnalysis,
      baseCenterTile: this.baseCenterTile,
      suggestedBuildTiles: this.suggestedBuildTiles
    });
    Object.assign(this.strategy, {
      current: this.currentStrategy,
      desiredBaseSize: this.desiredBaseSize,
      baseSize: this.baseSize
    });
    Object.assign(this.logistics, {
      workers: this.workers,
      activeTechUpgrades: this.activeTechUpgrades,
      lastTechUpgradeAt: this.lastTechUpgradeAt
    });

    this.diagnostics.lastUpdateAt = now;
  }

  //Additional diagnostics & reservation pool fields appended below.
  private reservationPool = new ReservationPool();

  /** Unified spendable calculation: current free (unreserved) minus prospective cost. */
  getSpendable(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const k in cost) {
      const r = k as ResourceType;
      const need = cost[r] || 0;
      const available = (this.resources[r] || 0) - (this.economy.reserved[r] || 0);
      if (available < need) return false;
    }
    return true;
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
      const available = (this.resources[r] || 0) - (this.economy.reserved[r] || 0);
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
    for (const r of Object.keys(this.resources) as ResourceType[]) {
      if ((this.resources[r] || 0) - (totals[r] || 0) < 0) {
        // eslint-disable-next-line no-console
        console.warn("Reservation over-allocation detected", r, this.resources[r], totals[r]);
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
