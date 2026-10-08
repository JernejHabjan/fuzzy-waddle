import { BasePlayer, type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { FactionType } from "./faction-type";
import type { PlayerStateResources } from "./player-state-resources";
import type { ProbableWafflePlayerStateData } from "./probable-waffle-player-state-data";
import type { ProbableWafflePlayerControllerData } from "./probable-waffle-player-controller-data";
import type { ProbableWafflePlayerState } from "./probable-waffle-player-state";
import type { ProbableWafflePlayerController } from "./probable-waffle-player-controller";
import { PlayerResourceObservation } from "./player-resource-observation";

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
    PlayerResourceObservation.run(this, "add", resources, () => {
      Object.entries(resources).forEach(([resourceType, amount]) => {
        this.addResource(resourceType as ResourceType, amount);
      });
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
    PlayerResourceObservation.run(this, "pay", resources, () => {
      Object.entries(resources).forEach(([resourceType, amount]) => {
        PlayerResourceObservation.leaf(this, () => this.payResources(resourceType as ResourceType, amount));
      });
    });
  }

  payResources(resourceType: ResourceType, amount: number): void {
    PlayerResourceObservation.run(this, "pay", { [resourceType]: amount }, () => {
      const resourceAmount = this.playerState.data.resources[resourceType] || 0;
      if (resourceAmount - amount < 0) {
        throw new Error("Not enough resources");
      }
      this.playerState.data.resources[resourceType] = resourceAmount - amount;
    }, true);
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
