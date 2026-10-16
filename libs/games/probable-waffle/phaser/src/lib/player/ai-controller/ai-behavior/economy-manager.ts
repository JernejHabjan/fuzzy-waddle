import type Phaser from "phaser";
import type { PlayerAiBlackboard } from "../player-ai-blackboard";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { GATHERED_RESOURCE_CREDITED } from "../../../entity/components/resource/credit-gathered-resource";
import { getSimulationNow } from "../../../world/services/simulation-time";

/** Estimates delivered units/second from confirmed native receipts, never grants or net stockpile changes. */
export class EconomyManager {
  private readonly pending = { food: 0, wood: 0, stone: 0, minerals: 0 };
  private sampledAt: number;

  constructor(
    private readonly blackboard: PlayerAiBlackboard,
    private readonly scene: Phaser.Scene,
    private readonly playerNumber: number
  ) {
    this.sampledAt = getSimulationNow(scene);
    this.reset();
    scene.events.on(GATHERED_RESOURCE_CREDITED, this.recordDelivery, this);
  }

  private recordDelivery(playerNumber: number, type: ResourceType, amount: number): void {
    if (
      playerNumber === this.playerNumber &&
      Object.values(ResourceType).includes(type) &&
      Number.isFinite(amount) &&
      amount > 0
    )
      this.pending[type] += amount;
  }

  update(now: number): void {
    const elapsedSeconds = (now - this.sampledAt) / 1000;
    if (elapsedSeconds < 5) return;
    for (const type of Object.values(ResourceType)) {
      const rate = this.pending[type] / elapsedSeconds;
      this.blackboard.economy.incomeInstant[type] = rate;
      this.blackboard.economy.incomeSmoothed[type] = this.blackboard.economy.incomeSmoothed[type] * 0.9 + rate * 0.1;
      this.pending[type] = 0;
    }
    this.sampledAt = now;
  }

  /** Derived sampling restarts after restore; saved net-income estimates cannot masquerade as new deliveries.
   * Outstanding cargo counts only when its resumed native delivery actually credits cash.
   */
  reset(): void {
    this.sampledAt = getSimulationNow(this.scene);
    for (const type of Object.values(ResourceType)) {
      this.pending[type] = 0;
      this.blackboard.economy.incomeInstant[type] = 0;
      this.blackboard.economy.incomeSmoothed[type] = 0;
    }
  }

  destroy(): void {
    this.scene.events.off(GATHERED_RESOURCE_CREDITED, this.recordDelivery, this);
  }
}
