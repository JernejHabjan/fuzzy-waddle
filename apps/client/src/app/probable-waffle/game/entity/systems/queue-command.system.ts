import { Subscription } from "rxjs";
import { getActorComponent } from "../../data/actor-component";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { CommandBusService } from "../../world/services/command-bus.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { HealthComponent } from "../components/combat/components/health-component";
import { IdComponent } from "../components/id-component";
import type {
  CancelProductionCommand,
  CancelResearchCommand,
  ProductionCommand,
  ResearchCommand
} from "../../data/commands/game-command";
import { ProductionComponent } from "../components/production/production-component";
import { QueueComponent } from "../components/queue/queue-component";
import { SharedQueueItemType } from "../components/queue/shared-queue-item-type";
import { ResearchComponent } from "../components/research/research-component";
import { ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/api-interfaces";

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
      if (!this.gameObject.active) return;
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId || !cmd.actorIds.includes(actorId)) return;

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
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) return;

    const actorDefinition = getPwActorDefinition(cmd.actorName, null);
    const costData = actorDefinition?.components?.productionCost;
    if (!costData) {
      return;
    }

    productionComponent.startProduction({
      actorName: cmd.actorName,
      costData
    });
  }

  private handleCancelProductionCommand(cmd: CancelProductionCommand) {
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!productionComponent || !sharedQueue) return;

    const queueItem = sharedQueue.items[cmd.queueIndex];
    if (!queueItem || queueItem.type !== SharedQueueItemType.Production || !queueItem.productionData) {
      return;
    }

    productionComponent.cancelProduction(queueItem.productionData);
  }

  private handleResearchCommand(cmd: ResearchCommand) {
    const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
    if (!researchComponent) return;
    researchComponent.startResearch(cmd.researchType);
  }

  private handleCancelResearchCommand(_cmd: CancelResearchCommand) {
    const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
    if (!researchComponent) return;
    researchComponent.cancelResearch();
  }

  private destroy() {
    this.commandBusSubscription?.unsubscribe();
  }
}
