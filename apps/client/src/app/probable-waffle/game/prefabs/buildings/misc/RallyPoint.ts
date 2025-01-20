// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { getActorSystem } from "../../../data/actor-system";
import { MovementSystem } from "../../../entity/systems/movement.system";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;
import { GameObjects } from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { Subscription } from "rxjs";

export default class RallyPoint extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 11, y ?? 32, texture || "factions", frame ?? "buildings/misc/rally.png");

    this.setOrigin(0.5, 1);

    /* START-USER-CTR-CODE */
    this.visible = false;

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private owner: GameObject | null = null;
  // Location to send new actors to
  public tileVec3?: Vector3Simple | null = null;
  public worldVec3?: Vector3Simple | null = null;
  // Actor to send new actors to
  public actor?: GameObject | null = null;

  private selectionChangedSubscription?: Subscription;
  private selectionComponent: SelectableComponent | undefined;

  init(owner: GameObjects.GameObject) {
    this.owner = owner;

    this.owner.scene.add.existing(this);

    this.selectionComponent = getActorComponent(this.owner, SelectableComponent);
    if (this.selectionComponent) {
      this.selectionChangedSubscription = this.selectionComponent.selectionChanged.subscribe(() => {
        this.handleVisibility();
      });
    }
  }

  private handleVisibility() {
    const selected = this.selectionComponent?.getSelected();
    this.visible = !!(selected && (this.tileVec3 || this.actor));
  }

  navigateGameObjectToRallyPoint(newGameObject: Phaser.GameObjects.GameObject) {
    const movementSystem = getActorSystem<MovementSystem>(newGameObject, MovementSystem);
    if (!movementSystem) return;
    if (this.tileVec3) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToLocation(this.tileVec3);
      return;
    }
    if (this.actor) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToActor(this.actor);
    }
  }

  /* END-USER-CODE */
  setLocation(tileVec3: Vector3Simple, worldVec3: Vector3Simple) {
    this.tileVec3 = tileVec3;
    this.worldVec3 = worldVec3;
    this.actor = null;
    this.x = worldVec3.x;
    this.y = worldVec3.y;
    this.z = worldVec3.z;
    this.handleVisibility();
  }

  setActor(gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) {
    this.actor = gameObject;
    this.tileVec3 = null;
    this.worldVec3 = null;
    this.x = gameObject.x;
    this.y = gameObject.y;
    this.z = gameObject.z;
    this.handleVisibility();
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
  }
}

/* END OF COMPILED CODE */

// You can write more code here
