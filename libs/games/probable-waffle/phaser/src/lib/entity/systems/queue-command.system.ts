import Phaser from "phaser";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../data/actor-component";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { HealthComponent } from "../components/combat/components/health-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type {
  CancelProductionCommand,
  CancelResearchCommand,
  ProductionCommand,
  ResearchCommand
} from "../../data/commands/game-command";
import { ProductionComponent } from "../components/production/production-component";
import { QueueComponent } from "../components/queue/queue-component";
import { SharedQueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/shared-queue-item-type";
import { ResearchComponent } from "../components/research/research-component";
import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import { OwnerComponent } from "../components/owner-component";

export class QueueCommandSystem {
  private commandBusSubscription?: Subscription;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToCommandBusEvents();
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private listenToCommandBusEvents() {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    if (!commandBus) {
      console.error("QueueCommandSystem: CommandBusService not found — queue commands will not be received");
      return;
    }

    this.commandBusSubscription = commandBus.command$.subscribe((cmd) => {
      if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId || !cmd.actorIds.includes(actorId)) return;
      const owner = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
      if (owner !== cmd.playerNumber) {
        commandBus.reportOutcome(cmd, "rejected", "invalid_owner", [actorId]);
        return;
      }

      switch (cmd.type) {
        case ProbableWaffleGameCommandTypes.Production:
          this.handleProductionCommand(cmd);
          break;
        case ProbableWaffleGameCommandTypes.CancelProduction:
          this.handleCancelProductionCommand(cmd);
          break;
        case ProbableWaffleGameCommandTypes.Research:
          this.handleResearchCommand(cmd);
          break;
        case ProbableWaffleGameCommandTypes.CancelResearch:
          this.handleCancelResearchCommand(cmd);
          break;
      }
    });
  }

  private handleProductionCommand(cmd: ProductionCommand) {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService)!;
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) {
      commandBus.reportOutcome(cmd, "rejected", "unsupported_action");
      return;
    }

    const actorDefinition = getPwActorDefinition(cmd.actorName, null);
    const costData = actorDefinition?.components?.productionCost;
    if (!costData) {
      commandBus.reportOutcome(cmd, "rejected", "unsupported_action", cmd.actorIds, [], "missing_production_cost");
      return;
    }

    const error = productionComponent.startProduction({
      actorName: cmd.actorName,
      costData
    }, cmd.execution ? { execution: cmd.execution, playerNumber: cmd.playerNumber, actorIds: cmd.actorIds } : undefined);
    if (error) {
      const reason = String(error).toLowerCase().includes("resource") ? "insufficient_resources" : "application_failed";
      commandBus.reportOutcome(cmd, "rejected", reason, cmd.actorIds, [], String(error));
      return;
    }
    commandBus.reportOutcome(cmd, "applied", "applied", cmd.actorIds, [`queue:${cmd.actorIds[0]}:${cmd.execution?.commandId}`]);
    commandBus.reportOutcome(cmd, "active", "applied", cmd.actorIds, [`queue:${cmd.actorIds[0]}:${cmd.execution?.commandId}`]);
  }

  private handleCancelProductionCommand(cmd: CancelProductionCommand) {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService)!;
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!productionComponent || !sharedQueue) {
      commandBus.reportOutcome(cmd, "rejected", "unsupported_action");
      return;
    }

    const queueItem = sharedQueue.items[cmd.queueIndex];
    if (!queueItem || queueItem.type !== SharedQueueItemType.Production || !queueItem.productionData) {
      commandBus.reportOutcome(cmd, "rejected", "invalid_target", cmd.actorIds, [], "queue_item_missing");
      return;
    }

    productionComponent.cancelProduction(queueItem.productionData);
    commandBus.reportOutcome(cmd, "cancelled", "cancelled");
  }

  private handleResearchCommand(cmd: ResearchCommand) {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService)!;
    const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
    if (!researchComponent) {
      commandBus.reportOutcome(cmd, "rejected", "unsupported_action");
      return;
    }
    const eligibility = researchComponent.canStartResearch(cmd.researchType);
    if (
      !eligibility.canStart ||
      !researchComponent.startResearch(
        cmd.researchType,
        cmd.execution ? { execution: cmd.execution, playerNumber: cmd.playerNumber, actorIds: cmd.actorIds } : undefined
      )
    ) {
      const reason = eligibility.reason?.toLowerCase().includes("resource")
        ? "insufficient_resources"
        : eligibility.reason?.toLowerCase().includes("already")
          ? "duplicate_command"
          : "application_failed";
      commandBus.reportOutcome(cmd, "rejected", reason, cmd.actorIds, [], eligibility.reason);
      return;
    }
    commandBus.reportOutcome(cmd, "applied", "applied", cmd.actorIds, [`research:${cmd.researchType}`]);
    commandBus.reportOutcome(cmd, "active", "applied", cmd.actorIds, [`research:${cmd.researchType}`]);
  }

  private handleCancelResearchCommand(cmd: CancelResearchCommand) {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService)!;
    const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
    if (!researchComponent || !researchComponent.isResearching) {
      commandBus.reportOutcome(cmd, "rejected", "invalid_target");
      return;
    }
    researchComponent.cancelResearch();
    commandBus.reportOutcome(cmd, "cancelled", "cancelled");
  }

  private destroy() {
    this.commandBusSubscription?.unsubscribe();
  }
}
