// You can write more code here

/* START OF COMPILED CODE */
/* START-USER-IMPORTS */
import PlayerGroup from "./PlayerGroup";
import HudProbableWaffle from "../../../scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { CrossSceneCommunicationService } from "../../../world/services/CrossSceneCommunicationService";
import { ActorGroupEvent, SelectionGroupsComponent } from "../../../world/components/selection-groups.component";
import { Subscription } from "rxjs";
/* END-USER-IMPORTS */

export default class GroupContainer extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 16);

    // playerGroup
    const playerGroup = new PlayerGroup(scene, 0, -16);
    this.add(playerGroup);

    // playerGroup_1
    const playerGroup_1 = new PlayerGroup(scene, 49, -16);
    this.add(playerGroup_1);

    // playerGroup_2
    const playerGroup_2 = new PlayerGroup(scene, 98, -16);
    this.add(playerGroup_2);

    // playerGroup_3
    const playerGroup_3 = new PlayerGroup(scene, 147, -16);
    this.add(playerGroup_3);

    // playerGroup_4
    const playerGroup_4 = new PlayerGroup(scene, 196, -16);
    this.add(playerGroup_4);

    // playerGroup_5
    const playerGroup_5 = new PlayerGroup(scene, 245, -16);
    this.add(playerGroup_5);

    // playerGroup_6
    const playerGroup_6 = new PlayerGroup(scene, 294, -16);
    this.add(playerGroup_6);

    // playerGroup_7
    const playerGroup_7 = new PlayerGroup(scene, 343, -16);
    this.add(playerGroup_7);

    // playerGroup_8
    const playerGroup_8 = new PlayerGroup(scene, 392, -16);
    this.add(playerGroup_8);

    // lists
    const buttons = [
      playerGroup,
      playerGroup_1,
      playerGroup_2,
      playerGroup_3,
      playerGroup_4,
      playerGroup_5,
      playerGroup_6,
      playerGroup_7,
      playerGroup_8
    ];

    this.buttons = buttons;

    /* START-USER-CTR-CODE */
    this.init();
    /* END-USER-CTR-CODE */
  }

  private buttons: PlayerGroup[];

  /* START-USER-CODE */
  private mainSceneWithActors!: ProbableWaffleScene;
  private crossSceneCommunicationService?: CrossSceneCommunicationService;
  private selectionChangedSubscription?: Subscription;
  private init() {
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    this.crossSceneCommunicationService = getSceneService(this.mainSceneWithActors, CrossSceneCommunicationService);
    this.crossSceneCommunicationService?.on(SelectionGroupsComponent.GroupSelectedEvent, this.groupSelectedEvent, this);
    this.crossSceneCommunicationService?.on(
      SelectionGroupsComponent.GroupCreatedEvent,
      this.groupCreatedOrUpdatedEvent,
      this
    );
    this.crossSceneCommunicationService?.on(
      SelectionGroupsComponent.GroupUpdatedEvent,
      this.groupCreatedOrUpdatedEvent,
      this
    );
    this.listenToSelectionEvents();
    this.buttons.forEach((button, index) => button.init(this.mainSceneWithActors, index + 1));
    this.hideButtons();
  }

  private listenToSelectionEvents() {
    this.selectionChangedSubscription = this.mainSceneWithActors.communicator.allScenes?.subscribe((p) => {
      if (!p.name.startsWith("selection.")) return;
      this.selectionChanged();
    });
  }

  private selectionChanged() {
    this.deselectAllGroups(); // todo
  }

  private groupSelectedEvent(payload: ActorGroupEvent) {
    const group = this.buttons[payload.groupKey - 1];
    // deselect all groups
    this.buttons.forEach((button) => button.deselect());
    // select the clicked group
    group.select();
  }

  private groupCreatedOrUpdatedEvent(payload: ActorGroupEvent) {
    const group = this.buttons[payload.groupKey - 1];
    group.setVisible(true);
    group.setGroupActor(payload.leadActor);
    group.setCount(payload.count);
  }

  private hideButtons() {
    this.buttons.forEach((button) => button.setVisible(false));
  }

  private deselectAllGroups() {
    this.buttons.forEach((button) => button.deselect());
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.crossSceneCommunicationService?.off(
      SelectionGroupsComponent.GroupSelectedEvent,
      this.groupSelectedEvent,
      this
    );
    this.crossSceneCommunicationService?.off(
      SelectionGroupsComponent.GroupCreatedEvent,
      this.groupCreatedOrUpdatedEvent,
      this
    );
    this.crossSceneCommunicationService?.off(
      SelectionGroupsComponent.GroupUpdatedEvent,
      this.groupCreatedOrUpdatedEvent,
      this
    );
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
