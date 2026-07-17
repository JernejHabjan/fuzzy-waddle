import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export class EconomyManager {
  constructor(private readonly blackboard: PlayerAiBlackboard) {}

  update(now: number) {
    this.updateIncome(now);
  }

  private updateIncome(now: number) {
    const economy = this.blackboard.economy;
    const elapsedSeconds = (now - economy.lastIncomeSampleAt) / 1000;
    if (elapsedSeconds < 5) return; // sample every 5 seconds

    for (const key in economy.resources) {
      const resourceType = key as ResourceType;
      const currentAmount = economy.resources[resourceType];
      const lastAmount = economy.lastIncomeSnapshot[resourceType] ?? 0;
      const diff = currentAmount - lastAmount;

      const instantaneousRate = diff / elapsedSeconds;
      economy.incomeInstant[resourceType] = instantaneousRate;

      // simple moving average for smoothed income
      const oldSmoothed = economy.incomeSmoothed[resourceType] || 0;
      const newSmoothed = oldSmoothed * 0.9 + instantaneousRate * 0.1;

      economy.incomeSmoothed[resourceType] = newSmoothed;
      economy.lastIncomeSnapshot[resourceType] = currentAmount;
    }
    economy.lastIncomeSampleAt = now;
  }
}
