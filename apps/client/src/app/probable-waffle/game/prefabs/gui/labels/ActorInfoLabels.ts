// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import ActorIcon from "./ActorIcon";
import { pwActorDefinitions } from "../../definitions/actor-definitions";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { BehaviorSubject, Subscription } from "rxjs";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { SingleSelectionHandler } from "../../../player/human-controller/single-selection.handler";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { IdComponent } from "../../../entity/components/id-component";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
import type { ActorIconClickAction } from "./actor-icon-click-action";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { SharedQueueItemType } from "../../../entity/components/queue/shared-queue-item-type";
import type { SharedQueueItem } from "../../../entity/components/queue/shared-queue-item";
/* END-USER-IMPORTS */

export default class ActorInfoLabels extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // actorIcon1
    const actorIcon1 = new ActorIcon(scene, 10, 9);
    this.add(actorIcon1);

    // actorIcon
    const actorIcon = new ActorIcon(scene, 32, 9);
    this.add(actorIcon);

    // actorIcon_1
    const actorIcon_1 = new ActorIcon(scene, 54, 9);
    this.add(actorIcon_1);

    // actorIcon_2
    const actorIcon_2 = new ActorIcon(scene, 76, 9);
    this.add(actorIcon_2);

    // actorIcon_3
    const actorIcon_3 = new ActorIcon(scene, 98, 9);
    this.add(actorIcon_3);

    // actorIcon_4
    const actorIcon_4 = new ActorIcon(scene, 120, 9);
    this.add(actorIcon_4);

    // actorIcon_5
    const actorIcon_5 = new ActorIcon(scene, 144, 9);
    this.add(actorIcon_5);

    // actorIcon_6
    const actorIcon_6 = new ActorIcon(scene, 166, 9);
    this.add(actorIcon_6);

    // actorIcon_7
    const actorIcon_7 = new ActorIcon(scene, 10, 32);
    this.add(actorIcon_7);

    // actorIcon_8
    const actorIcon_8 = new ActorIcon(scene, 32, 32);
    this.add(actorIcon_8);

    // actorIcon_9
    const actorIcon_9 = new ActorIcon(scene, 54, 32);
    this.add(actorIcon_9);

    // actorIcon_10
    const actorIcon_10 = new ActorIcon(scene, 76, 32);
    this.add(actorIcon_10);

    // actorIcon_11
    const actorIcon_11 = new ActorIcon(scene, 98, 32);
    this.add(actorIcon_11);

    // actorIcon_12
    const actorIcon_12 = new ActorIcon(scene, 120, 32);
    this.add(actorIcon_12);

    // actorIcon_13
    const actorIcon_13 = new ActorIcon(scene, 144, 32);
    this.add(actorIcon_13);

    // actorIcon_14
    const actorIcon_14 = new ActorIcon(scene, 166, 32);
    this.add(actorIcon_14);

    // lists
    const icons = [
      actorIcon1,
      actorIcon,
      actorIcon_1,
      actorIcon_2,
      actorIcon_3,
      actorIcon_4,
      actorIcon_5,
      actorIcon_6,
      actorIcon_7,
      actorIcon_8,
      actorIcon_9,
      actorIcon_10,
      actorIcon_11,
      actorIcon_12,
      actorIcon_13,
      actorIcon_14
    ];

    this.icons = icons;

    /* START-USER-CTR-CODE */
    this.subscribeToClickEvents();
    this.mainSceneWithActors = (scene as HudProbableWaffle).probableWaffleScene!;
    /* END-USER-CTR-CODE */
  }

  private icons: ActorIcon[];

  /* START-USER-CODE */
  private readonly mainSceneWithActors?: ProbableWaffleScene;
  private visibilityChanged = new BehaviorSubject<boolean>(false);
  private queueChangedSubscription?: Subscription;
  private clickSubscriptions: Subscription[] = [];
  private actor?: Phaser.GameObjects.GameObject;

  cleanActor() {
    this.queueChangedSubscription?.unsubscribe();
    this.visible = false;
    this.actor = undefined;
  }

  get visibilityChangedObservable() {
    return this.visibilityChanged.asObservable();
  }

  override destroy(fromScene?: boolean) {
    this.cleanActor();
    this.clickSubscriptions.forEach((sub) => sub.unsubscribe());
    super.destroy(fromScene);
  }

  setLabelsForDisplayingActorsQueues(actor: Phaser.GameObjects.GameObject) {
    this.actor = actor;
    // Clean up any existing subscriptions
    this.queueChangedSubscription?.unsubscribe();

    // Get the SharedQueueComponent that was registered by ProductionComponent/ResearchComponent
    const sharedQueue = getActorComponent(actor, QueueComponent);
    if (sharedQueue) {
      // Subscribe to unified queue changes
      this.queueChangedSubscription = sharedQueue.queueChangedObservable.subscribe((items) => {
        this.handleQueueUpdate(items);
      });

      // Initial display
      this.handleQueueUpdate(sharedQueue.items);
    } else {
      // Actor has no queue (e.g. a unit) - clear any previously displayed icons
      this.handleQueueUpdate([]);
    }
  }

  private handleQueueUpdate(items: SharedQueueItem[]) {
    const actor = this.actor;
    if (!actor) return;

    // Get production component to determine max queue size
    const queueComponent = getActorComponent(actor, QueueComponent);
    const totalQueueSize = queueComponent
      ? queueComponent.queueDefinition.queueCount * queueComponent.queueDefinition.capacityPerQueue
      : items.length;

    // Update icons based on unified queue items
    let activeItems = 0;
    this.icons.forEach((icon, index) => {
      if (index >= totalQueueSize) {
        icon.visible = false;
        return;
      }

      const item = items[index];
      if (item) {
        // Set icon based on queue item type
        if (item.type === SharedQueueItemType.Research) {
          icon.setActorIcon(
            {
              iconIndex: index,
              researchType: item.researchData
            },
            item.iconData.key,
            item.iconData.frame,
            item.iconData.origin ?? { x: 0.5, y: 0.5 }
          );
        } else if (item.type === SharedQueueItemType.Production) {
          icon.setActorIcon(
            {
              iconIndex: index
            },
            item.iconData.key,
            item.iconData.frame,
            item.iconData.origin ?? { x: 0.5, y: 0.5 }
          );
        }
        icon.visible = true;
        activeItems++;
      } else {
        // Empty queue slot - show slot number
        icon.setNumber(index + 1);
        icon.visible = true;
      }
    });

    this.visibilityChanged.next(activeItems > 0);
  }

  setLabelsForDisplayingActors(
    selectedActors: Phaser.GameObjects.GameObject[],
    highlightActors?: Phaser.GameObjects.GameObject[]
  ) {
    this.icons.forEach((icon, index) => {
      if (index >= selectedActors.length) {
        icon.visible = false;
        icon.setHighlight(false);
        return;
      }
      const actor = selectedActors[index];
      if (!actor) throw new Error("Actor not found");
      const actorName = actor.name;
      const actorDefinition = pwActorDefinitions[actorName as ObjectNames];
      const infoComponent = actorDefinition.components!.info!;
      const actorIdComponent = getActorComponent(actor, IdComponent);
      if (!actorIdComponent || !infoComponent.smallImage) return;
      icon.setActorIcon(
        {
          actorObjectId: actorIdComponent.id
        },
        infoComponent.smallImage.key,
        infoComponent.smallImage.frame,
        infoComponent.smallImage.origin
      );
      icon.visible = true;

      // Set highlight if this actor is in the highlight list
      if (highlightActors) {
        const isHighlighted = highlightActors.includes(actor);
        icon.setHighlight(isHighlighted);
      } else {
        icon.setHighlight(false);
      }
    });

    this.visibilityChanged.next(selectedActors.length > 0);
  }

  private subscribeToClickEvents() {
    this.icons.forEach((icon) => {
      const sub = icon.onClick.subscribe((action) => {
        this.tryHandleIconClickActor(action);
        this.tryHandleIconClickProduction(action);
        this.tryHandleIconClickResearch(action);
      });
      this.clickSubscriptions.push(sub);
    });
  }

  private tryHandleIconClickActor(action: ActorIconClickAction) {
    if (!action.definition.actorObjectId) return;
    if (!this.mainSceneWithActors) throw new Error("Main scene with actors not found");
    const singleSelectionHandler = getSceneComponent(this.mainSceneWithActors, SingleSelectionHandler);
    if (!singleSelectionHandler) throw new Error("SingleSelectionHandler not found");
    singleSelectionHandler.sendSelection(
      "left",
      [action.definition.actorObjectId],
      action.keys.shift,
      action.keys.ctrl
    );
  }

  private tryHandleIconClickProduction(action: ActorIconClickAction) {
    if (action.definition.iconIndex === undefined) return;
    const actor = this.actor;
    if (!actor) return;

    // Get the unified queue item at this index from SharedQueueComponent
    const sharedQueue = getActorComponent(actor, QueueComponent);
    const queueItem = sharedQueue?.items[action.definition.iconIndex];
    if (!queueItem) return;

    // Only handle production items
    if (queueItem.type !== SharedQueueItemType.Production) return;
    if (!queueItem.productionData) return;

    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (!productionComponent) return;

    productionComponent.cancelProduction(queueItem.productionData);
  }

  private tryHandleIconClickResearch(action: ActorIconClickAction) {
    if (action.definition.iconIndex === undefined) return;
    const actor = this.actor;
    if (!actor) return;

    // Get the unified queue item at this index from SharedQueueComponent
    const sharedQueue = getActorComponent(actor, QueueComponent);
    const queueItem = sharedQueue?.items[action.definition.iconIndex];
    if (!queueItem) return;

    // Only handle research items
    if (queueItem.type !== SharedQueueItemType.Research) return;
    if (!queueItem.researchData) return;

    const researchComponent = getActorComponent(actor, ResearchComponent);
    if (!researchComponent) return;

    // Cancel the research if it's currently in progress
    if (researchComponent.currentResearchType === queueItem.researchData) {
      researchComponent.cancelResearch();
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
