// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { onSceneInitialized } from "../../../../data/game-object-helper";
import { Subscription } from "rxjs";
import { SandholdShared } from "./SandholdShared";
/* END-USER-IMPORTS */
import Sandhold from "../Sandhold";
import { ActorDataChangedEvent } from "../../../../data/actor-data";
import { getActorComponent } from "../../../../data/actor-component";
import { ProductionComponent } from "../../../../entity/building/production/production-component";

export default class SandholdLevel1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(
      new Phaser.Geom.Polygon("-154 2 -1 -219 153 0 123 24 119 47 82 64 60 53 5 79 -56 53 -81 58 -119 42 -120 22"),
      Phaser.Geom.Polygon.Contains
    );

    // sandhold_building
    const sandhold_building = scene.add.image(0, -80, "factions", "buildings/tivara/sandhold/sandhold.png");
    this.add(sandhold_building);

    // hover_crystal
    const hover_crystal = scene.add.image(0, -192, "factions", "buildings/tivara/sandhold/sandhold-crystal.png");
    this.add(hover_crystal);

    /* START-USER-CTR-CODE */
    this.sandholdShared = new SandholdShared(this);
    this.sandholdShared.hoverCrystal(scene, hover_crystal);

    onSceneInitialized(scene, this.onInit, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private parent?: Sandhold;
  private queueChangeSubscription?: Subscription;
  private sandholdShared: SandholdShared;
  setup(parent: Sandhold) {
    this.parent = parent;
  }

  private onInit() {
    this.parent!.on(ActorDataChangedEvent, this.actorDataChanged, this);
    this.actorDataChanged();
  }

  actorDataChanged() {
    this.registerProductionCompletedEvent();
  }

  private registerProductionCompletedEvent() {
    if (!this.parent) return;
    const productionComponent = getActorComponent(this.parent, ProductionComponent);
    if (!productionComponent) {
      this.queueChangeSubscription?.unsubscribe();
      return;
    }
    if (this.queueChangeSubscription) {
      // already subscribed
      return;
    }
    this.queueChangeSubscription = productionComponent.queueChangeObservable.subscribe((event) => {
      if (event.type === "completed") {
        if (!this.parent) return;
        this.sandholdShared.spawnCrystal(this.parent.scene);
      }
    });
  }

  destroy(fromScene?: boolean) {
    if (this.queueChangeSubscription) {
      this.queueChangeSubscription.unsubscribe();
    }
    this.parent?.off(ActorDataChangedEvent, this.actorDataChanged, this);
    super.destroy(fromScene);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
