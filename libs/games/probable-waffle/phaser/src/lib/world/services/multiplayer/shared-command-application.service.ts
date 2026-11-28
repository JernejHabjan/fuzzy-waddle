import Phaser from "phaser";
import { ProbableWaffleGameCommandTypes, type ConcedeCommand, type ConstructCommand } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "./command-bus.service";
import { applySharedConstructionCommand } from "./apply-shared-construction-command";

/**
 * Applies scene-level command effects that cannot be owned by one existing actor
 * system. Actor-local move/action/queue/spell/unload commands remain with their
 * components but report through the same command bus outcome channel.
 */
export class SharedCommandApplicationService {
  private commandSubscription?: Subscription;
  private readonly appliedSiteKeys = new Map<string, string>();
  private readonly siteCompletionSubscriptions: Subscription[] = [];

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly concedePlayer: (playerNumber: number) => boolean
  ) {
    const commandBus = getSceneService(scene, CommandBusService);
    if (!commandBus) throw new Error("SharedCommandApplicationService requires CommandBusService");
    this.commandSubscription = commandBus.command$.subscribe((command) => {
      if (command.type === ProbableWaffleGameCommandTypes.Construct) this.applyConstruct(command);
      if (command.type === ProbableWaffleGameCommandTypes.Concede) this.applyConcede(command);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private applyConstruct(command: ConstructCommand): void {
    applySharedConstructionCommand(this.scene, command, this.appliedSiteKeys, this.siteCompletionSubscriptions);
  }

  private applyConcede(command: ConcedeCommand): void {
    const commandBus = getSceneService(this.scene, CommandBusService)!;
    if (!this.concedePlayer(command.playerNumber)) {
      commandBus.reportOutcome(command, "rejected", "application_failed", [], [], "mode_rejected_concession");
      return;
    }
    commandBus.reportOutcome(command, "completed", "applied", [], [], command.reason);
  }

  private destroy(): void {
    this.commandSubscription?.unsubscribe();
    this.siteCompletionSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
