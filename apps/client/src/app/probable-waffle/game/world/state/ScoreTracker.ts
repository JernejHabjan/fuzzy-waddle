import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import {
  type PlayerNumber,
  type PlayerScoreData,
  type GameScoreSnapshot,
  type PlayerScoreSnapshot,
  STANDARD_METRICS,
  type ProbableWafflePlayer,
  ProbableWafflePlayerType,
  GameResultStatus
} from "@fuzzy-waddle/api-interfaces";
import { getPlayersFromScene } from "../../../../shared/game/phaser/scene/base.scene";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import { ScenePlayerHelpers } from "../../data/scene-player-helpers";
import { throttle } from "../../library/throttle";
import { getActorComponent, hasActorComponent } from "../../data/actor-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import type { Subscription } from "rxjs";

/**
 * Tracks player scores throughout the game for the score screen.
 * Similar to GameModeConditionChecker, runs continuously and collects statistics.
 */
export class ScoreTracker {
  private currentPlayerNumber!: PlayerNumber;
  private players!: ProbableWafflePlayer[];
  private stopped: boolean = false;
  private snapshotInterval = 5000; // Create snapshot every 5 seconds
  private lastSnapshotTime = 0;
  private resourceSubscription?: Subscription;

  constructor(private readonly scene: ProbableWaffleScene) {
    this.initializePlayerScores();

    // Start checking after 1 second delay
    this.scene.time.delayedCall(1000, this.startTracking, [], this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private startTracking() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleUpdate, this);
    this.scene.events.on(HealthComponent.KilledEvent, this.onActorKilled, this);
    this.scene.events.on("score.damage", this.onDamage, this);
    this.scene.events.on("score.unit_produced", this.onUnitProduced, this);
    this.scene.events.on("score.building_constructed", this.onBuildingConstructed, this);
    this.subscribeToResourceEvents();
  }

  private throttleUpdate = throttle(this.update.bind(this), 1000);

  /**
   * Initialize score data for all players
   */
  private initializePlayerScores() {
    const players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);
    const scoreData = new Map<PlayerNumber, PlayerScoreData>();

    players.forEach((player: ProbableWafflePlayer) => {
      const playerNumber = player.playerNumber;
      if (!playerNumber) return;

      scoreData.set(playerNumber, {
        playerNumber,
        playerName: player.playerController.data.playerDefinition?.player.playerName || `Player ${playerNumber}`,
        playerType:
          player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI ? "AI" : "Human",
        teamNumber: player.playerController.data.playerDefinition?.team,
        factionType: player.factionType?.toString() || "Unknown",
        gameResult: GameResultStatus.Quit, // Default, will be updated by GameModeConditionChecker
        eliminated: false,
        finalScore: 0,
        metrics: {},
        userId: player.playerController.data.userId ?? undefined
      });
    });

    if (this.scene.baseGameData.gameInstance.gameState) {
      this.scene.baseGameData.gameInstance.gameState.data.scoreData = scoreData;
      this.scene.baseGameData.gameInstance.gameState.data.scoreSnapshots = [];
    }
  }

  /**
   * Main update loop - tracks live metrics
   */
  private update() {
    if (!this.scene.scene || !this.scene.scene.isActive()) return;
    if (this.stopped) return;

    this.currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
    this.players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);

    this.updateLiveMetrics();
    this.createSnapshotIfNeeded();
  }

  /**
   * Update metrics that change during gameplay
   */
  private updateLiveMetrics() {
    const { actorsByPlayer } = ScenePlayerHelpers.getActorsByPlayer(this.scene);

    this.players.forEach((player) => {
      const playerNumber = player.playerNumber;
      if (!playerNumber) return;

      const actors = actorsByPlayer.get(playerNumber) || [];
      const units = actors.filter((actor) => !this.isBuilding(actor));
      const buildings = actors.filter((actor) => this.isBuilding(actor));

      // Update current counts
      const currentUnits = units.length;
      const currentBuildings = buildings.length;

      // Track max values
      const currentMax = this.getMetric(playerNumber, STANDARD_METRICS.MAX_ARMY_SIZE) || 0;
      if (currentUnits > currentMax) {
        this.setMetric(playerNumber, STANDARD_METRICS.MAX_ARMY_SIZE, currentUnits);
      }

      const currentMaxBuildings = this.getMetric(playerNumber, STANDARD_METRICS.MAX_BUILDING_COUNT) || 0;
      if (currentBuildings > currentMaxBuildings) {
        this.setMetric(playerNumber, STANDARD_METRICS.MAX_BUILDING_COUNT, currentBuildings);
      }

      // Update final resources
      const resources = player.getResources();
      this.setMetric(playerNumber, STANDARD_METRICS.FINAL_RESOURCES_MINERALS, resources.minerals || 0);
      this.setMetric(playerNumber, STANDARD_METRICS.FINAL_RESOURCES_STONE, resources.stone || 0);
      this.setMetric(playerNumber, STANDARD_METRICS.FINAL_RESOURCES_WOOD, resources.wood || 0);
    });
  }

  /**
   * Create a snapshot for timeline charts
   */
  private createSnapshotIfNeeded() {
    const now = Date.now();
    if (now - this.lastSnapshotTime < this.snapshotInterval) return;
    this.lastSnapshotTime = now;

    const { actorsByPlayer } = ScenePlayerHelpers.getActorsByPlayer(this.scene);
    const playerScores = new Map<PlayerNumber, PlayerScoreSnapshot>();

    this.players.forEach((player) => {
      const playerNumber = player.playerNumber;
      if (!playerNumber) return;

      const actors = actorsByPlayer.get(playerNumber) || [];
      const units = actors.filter((actor) => !this.isBuilding(actor));
      const buildings = actors.filter((actor) => this.isBuilding(actor));
      const resources = player.getResources();

      playerScores.set(playerNumber, {
        unitsCount: units.length,
        buildingsCount: buildings.length,
        totalResources: (resources.minerals || 0) + (resources.stone || 0) + (resources.wood || 0),
        armyValue: units.length * 10 // Simplified army value calculation
      });
    });

    const snapshot: GameScoreSnapshot = {
      timestamp: now,
      playerScores
    };

    if (this.scene.baseGameData.gameInstance.gameState) {
      this.scene.baseGameData.gameInstance.gameState.data.scoreSnapshots?.push(snapshot);
    }
  }

  /**
   * Check if an actor is a building
   */
  private isBuilding(actor: Phaser.GameObjects.GameObject): boolean {
    return hasActorComponent(actor, ConstructionSiteComponent);
  }

  /**
   * Set a metric value for a player
   */
  public setMetric(playerNumber: PlayerNumber, metricKey: string, value: number) {
    if (!this.scene.baseGameData.gameInstance.gameState) return;

    const scoreData = this.scene.baseGameData.gameInstance.gameState.data.scoreData;
    if (!scoreData) return;

    const playerScore = scoreData.get(playerNumber);
    if (!playerScore) return;

    playerScore.metrics[metricKey] = value;
  }

  /**
   * Get a metric value for a player
   */
  public getMetric(playerNumber: PlayerNumber, metricKey: string): number | undefined {
    if (!this.scene.baseGameData.gameInstance.gameState) return undefined;

    const scoreData = this.scene.baseGameData.gameInstance.gameState.data.scoreData;
    if (!scoreData) return undefined;

    const playerScore = scoreData.get(playerNumber);
    if (!playerScore) return undefined;

    return playerScore.metrics[metricKey];
  }

  /**
   * Increment a metric value for a player
   */
  public incrementMetric(playerNumber: PlayerNumber, metricKey: string, amount: number = 1) {
    if (!this.scene.baseGameData.gameInstance.gameState) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState;
    const scoreData = gameState.data.scoreData;
    if (!scoreData) return;

    const playerScore = scoreData.get(playerNumber);
    if (!playerScore) return;

    const current = playerScore.metrics[metricKey] || 0;
    this.setMetric(playerNumber, metricKey, current + amount);
  }

  /**
   * Set the game result for a player
   */
  public setPlayerResult(playerNumber: PlayerNumber, result: GameResultStatus) {
    if (!this.scene.baseGameData.gameInstance.gameState) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState;
    const scoreData = gameState.data.scoreData;
    if (!scoreData) return;

    const playerScore = scoreData.get(playerNumber);
    if (!playerScore) return;

    playerScore.gameResult = result;
  }

  /**
   * Mark a player as eliminated
   */
  public setPlayerEliminated(playerNumber: PlayerNumber, eliminatedAt: number) {
    if (!this.scene.baseGameData.gameInstance.gameState) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState;
    const scoreData = gameState.data.scoreData;
    if (!scoreData) return;

    const playerScore = scoreData.get(playerNumber);
    if (!playerScore) return;

    playerScore.eliminated = true;
    playerScore.eliminatedAt = eliminatedAt;
  }

  /**
   * Calculate final score based on metrics
   */
  public calculateFinalScore(playerNumber: PlayerNumber): number {
    if (!this.scene.baseGameData.gameInstance.gameState) return 0;

    const gameState = this.scene.baseGameData.gameInstance.gameState;
    const scoreData = gameState.data.scoreData;
    const metrics = scoreData?.get(playerNumber)?.metrics;
    if (!metrics) return 0;

    let score = 0;

    // Units: 10 points per unit produced, 15 per kill
    score += (metrics[STANDARD_METRICS.UNITS_PRODUCED] || 0) * 10;
    score += (metrics[STANDARD_METRICS.UNITS_KILLED] || 0) * 15;

    // Buildings: 50 points per building, 75 per enemy building destroyed
    score += (metrics[STANDARD_METRICS.BUILDINGS_CONSTRUCTED] || 0) * 50;
    score += (metrics[STANDARD_METRICS.BUILDINGS_DESTROYED] || 0) * 75;

    // Resources: 1 point per 10 resources collected
    const totalResourcesCollected =
      (metrics[STANDARD_METRICS.RESOURCES_COLLECTED_MINERALS] || 0) +
      (metrics[STANDARD_METRICS.RESOURCES_COLLECTED_STONE] || 0) +
      (metrics[STANDARD_METRICS.RESOURCES_COLLECTED_WOOD] || 0);
    score += Math.floor(totalResourcesCollected / 10);

    // Combat: 1 point per 100 damage dealt
    score += Math.floor((metrics[STANDARD_METRICS.DAMAGE_DEALT] || 0) / 100);

    return score;
  }

  /**
   * Finalize all scores before going to score screen
   */
  public finalizeScores() {
    if (!this.scene.baseGameData.gameInstance.gameState) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState;
    const scoreData = gameState.data.scoreData;
    if (!scoreData) return;

    scoreData.forEach((playerScore, playerNumber) => {
      playerScore.finalScore = this.calculateFinalScore(playerNumber);
    });
  }

  /**
   * Stop tracking
   */
  public stop() {
    this.stopped = true;
  }

  /**
   * Listen for resource.added and resource.removed events on the communicator to track all players
   */
  private subscribeToResourceEvents() {
    const communicator = this.scene.baseGameData.communicator;
    this.resourceSubscription = communicator.playerChanged?.on.subscribe((event) => {
      const playerNumber = event.data.playerNumber;
      const resources = event.data.playerStateData?.resources;
      if (playerNumber === undefined || !resources) return;

      if (event.property === "resource.added") {
        if (resources.minerals)
          this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_COLLECTED_MINERALS, resources.minerals);
        if (resources.stone)
          this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_COLLECTED_STONE, resources.stone);
        if (resources.wood)
          this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_COLLECTED_WOOD, resources.wood);
      } else if (event.property === "resource.removed") {
        if (resources.minerals)
          this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_SPENT_MINERALS, resources.minerals);
        if (resources.stone)
          this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_SPENT_STONE, resources.stone);
        if (resources.wood) this.incrementMetric(playerNumber, STANDARD_METRICS.RESOURCES_SPENT_WOOD, resources.wood);
      }
    });
  }

  private onActorKilled(gameObject: Phaser.GameObjects.GameObject) {
    if (!gameObject || !gameObject.active) return;
    const isBuilding = this.isBuilding(gameObject);
    const victimOwner = getActorComponent(gameObject, OwnerComponent)?.getOwner();
    const hc = getActorComponent(gameObject, HealthComponent);
    const attackerOwner = hc?.latestDamage?.damageInitiator
      ? getActorComponent(hc.latestDamage.damageInitiator, OwnerComponent)?.getOwner()
      : undefined;

    if (victimOwner !== undefined) {
      this.incrementMetric(victimOwner, isBuilding ? STANDARD_METRICS.BUILDINGS_LOST : STANDARD_METRICS.UNITS_LOST);
    }
    if (attackerOwner !== undefined && attackerOwner !== victimOwner) {
      this.incrementMetric(
        attackerOwner,
        isBuilding ? STANDARD_METRICS.BUILDINGS_DESTROYED : STANDARD_METRICS.UNITS_KILLED
      );
    }
  }

  private onDamage(
    gameObject: Phaser.GameObjects.GameObject,
    damage: number,
    damageInitiator?: Phaser.GameObjects.GameObject
  ) {
    const victimOwner = getActorComponent(gameObject, OwnerComponent)?.getOwner();
    if (victimOwner !== undefined) {
      this.incrementMetric(victimOwner, STANDARD_METRICS.DAMAGE_RECEIVED, damage);
    }
    if (damageInitiator) {
      const attackerOwner = getActorComponent(damageInitiator, OwnerComponent)?.getOwner();
      if (attackerOwner !== undefined) {
        this.incrementMetric(attackerOwner, STANDARD_METRICS.DAMAGE_DEALT, damage);
      }
    }
  }

  private onUnitProduced(playerNumber: PlayerNumber) {
    if (playerNumber !== undefined) {
      this.incrementMetric(playerNumber, STANDARD_METRICS.UNITS_PRODUCED);
    }
  }

  private onBuildingConstructed(gameObject: Phaser.GameObjects.GameObject) {
    const owner = getActorComponent(gameObject, OwnerComponent)?.getOwner();
    if (owner !== undefined) {
      this.incrementMetric(owner, STANDARD_METRICS.BUILDINGS_CONSTRUCTED);
    }
  }

  /**
   * Cleanup
   */
  private destroy() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.throttleUpdate, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(HealthComponent.KilledEvent, this.onActorKilled, this);
    this.scene.events.off("score.damage", this.onDamage, this);
    this.scene.events.off("score.unit_produced", this.onUnitProduced, this);
    this.scene.events.off("score.building_constructed", this.onBuildingConstructed, this);
    this.resourceSubscription?.unsubscribe();
    this.stopped = true;
  }
}
