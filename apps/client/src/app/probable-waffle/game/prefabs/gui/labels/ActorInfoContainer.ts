// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import ActorInfoLabel from "./ActorInfoLabel";
import ProgressBar from "../ProgressBar";
import ActorDetails from "./ActorDetails";
import ActorInfoLabels from "./ActorInfoLabels";
/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../scenes/hud-scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCurrentPlayerNumber, getSelectedActors, listenToSelectionEvents } from "../../../data/scene-data";
import { type PrefabDefinition, pwActorDefinitions } from "../../../data/actor-definitions";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/combat/components/health-component";
import { ConstructionSiteComponent } from "../../../entity/building/construction/construction-site-component";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
/* END-USER-IMPORTS */

export default class ActorInfoContainer extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 215, y ?? 81);

    // actor_info_bg
    const actor_info_bg = scene.add.nineslice(
      -214.40086364746094,
      -80.93078633145431,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      64,
      48,
      3,
      3,
      3,
      3
    );
    actor_info_bg.scaleX = 3.3669208029108955;
    actor_info_bg.scaleY = 1.6660351475342665;
    actor_info_bg.setOrigin(0, 0);
    this.add(actor_info_bg);

    // preventDefaultScript
    new OnPointerDownScript(actor_info_bg);

    // actorInfoLabel
    const actorInfoLabel = new ActorInfoLabel(scene, -188, -63);
    actorInfoLabel.scaleX = 0.5;
    actorInfoLabel.scaleY = 0.5;
    this.add(actorInfoLabel);
    actorInfoLabel.text.setStyle({});

    // progress_bar
    const progress_bar = new ProgressBar(scene, -49, -56);
    this.add(progress_bar);

    // actorDetails
    const actorDetails = new ActorDetails(scene, -196, -43);
    this.add(actorDetails);

    // actorInfoLabels
    const actorInfoLabels = new ActorInfoLabels(scene, -206, -54);
    this.add(actorInfoLabels);

    this.actorInfoLabel = actorInfoLabel;
    this.progress_bar = progress_bar;
    this.actorDetails = actorDetails;
    this.actorInfoLabels = actorInfoLabels;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (scene as HudProbableWaffle).probableWaffleScene!;
    this.subscribeToPlayerSelection();
    this.subscribeToActorInfoLabelEvents();
    this.hideAllLabels();
    /* END-USER-CTR-CODE */
  }

  private actorInfoLabel: ActorInfoLabel;
  private progress_bar: ProgressBar;
  private actorDetails: ActorDetails;
  private actorInfoLabels: ActorInfoLabels;

  /* START-USER-CODE */
  private actorKillSubscription?: Subscription;
  private actorConstructionSubscription?: Subscription;
  private selectionChangedSubscription?: Subscription;
  private actorInfoLabelsVisibilitySubscription?: Subscription;
  private readonly mainSceneWithActors: ProbableWaffleScene;

  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      const selectedActors = getSelectedActors(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllLabels();
        return;
      }
      const actor = selectedActors[0];
      const definition = pwActorDefinitions[actor.name as ObjectNames];
      this.setActorInfoLabel(definition);
      if (selectedActors.length === 1) {
        this.setActorDetailLabels(actor);
        this.subscribeToActorKillEvent(actor);
        this.subscribeToActorConstructionEvent(actor);
        return;
      }
      // multi-selection
      this.actorInfoLabels.setLabelsForDisplayingActors(selectedActors);
      this.actorDetails.hideAll();
      this.progress_bar.cleanActor();
    });
  }

  private setActorDetailLabels(actor: Phaser.GameObjects.GameObject) {
    const definition = pwActorDefinitions[actor.name as ObjectNames];
    this.actorDetails.showActorAttributes(actor, definition);
    if (this.canShowIcons(actor)) {
      this.progress_bar.setProgressBar(actor);
      this.actorInfoLabels.setLabelsForDisplayingActorsQueues(actor);
    }
  }

  private setActorInfoLabel(actorDefinition: PrefabDefinition) {
    const infoDefinition = actorDefinition.components?.info;
    this.actorInfoLabel.setText(infoDefinition?.name ?? "");
    this.actorInfoLabel.setIcon(infoDefinition?.smallImage?.key, infoDefinition?.smallImage?.frame);
    this.actorInfoLabel.visible = true;
  }

  /**
   * Toggles the visibility of the actor info labels and the actor details.
   * When actor is training or producing, the actor info labels are visible, otherwise the actor details are visible.
   */
  private subscribeToActorInfoLabelEvents() {
    this.actorInfoLabelsVisibilitySubscription = this.actorInfoLabels.visibilityChangedObservable.subscribe(
      (visible) => {
        this.actorInfoLabels.visible = visible;
        this.actorDetails.visible = !visible;
      }
    );
  }
  private hideAllLabels() {
    this.actorInfoLabel.visible = false;
    this.actorInfoLabels.cleanActor();
    this.progress_bar.cleanActor();
    this.actorDetails.hideAll();
  }

  private subscribeToActorKillEvent(actor: Phaser.GameObjects.GameObject) {
    this.actorKillSubscription?.unsubscribe();
    this.actorKillSubscription = getActorComponent(actor, HealthComponent)?.healthChanged.subscribe((newHealth) => {
      if (newHealth <= 0) {
        this.hideAllLabels();
      }
    });
  }

  private subscribeToActorConstructionEvent(actor: Phaser.GameObjects.GameObject) {
    this.actorConstructionSubscription?.unsubscribe();
    this.actorConstructionSubscription = getActorComponent(
      actor,
      ConstructionSiteComponent
    )?.constructionProgressPercentageChanged.subscribe((progress) => {
      if (progress === 100) {
        // show actions again
        this.setActorDetailLabels(actor);
      }
    });
  }

  private canShowIcons(actor: Phaser.GameObjects.GameObject) {
    const currentPlayerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    const actorPlayerNr = getActorComponent(actor, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.actorKillSubscription?.unsubscribe();
    this.actorConstructionSubscription?.unsubscribe();
    this.actorInfoLabelsVisibilitySubscription?.unsubscribe();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
