import GameObject = Phaser.GameObjects.GameObject;
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectTransform,
  onSceneInitialized
} from "../../../data/game-object-helper";
import { BehaviorSubject, Subscription } from "rxjs";
import Phaser from "phaser";
import { listenToSelectionEvents } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "./id-component";
import { ActorTranslateComponent } from "./actor-translate-component";
import { HealthComponent } from "../../combat/components/health-component";

export type SelectableDefinition = {
  offsetY?: number;
};

export class SelectableComponent {
  private selected: boolean = false;
  private selectionCircle!: Phaser.GameObjects.Graphics;
  private actorMovedSubscription?: Subscription;
  private selectionChangedSubscription?: Subscription;
  selectionChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  constructor(
    private readonly gameObject: GameObject,
    private readonly selectableDefinition?: SelectableDefinition
  ) {
    this.createSelectionCircle();
    onSceneInitialized(gameObject.scene, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    this.listenToSelectionEvents();
  }

  private init = () => {
    this.subscribeActorMove();
  };

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMoved.subscribe(this.update);
  }

  private createSelectionCircle() {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;
    const ellipse = new Phaser.Geom.Ellipse(0, 0, bounds.width, bounds.width / 2);
    ellipse.y = this.selectableDefinition?.offsetY ?? 0;
    const graphics = this.gameObject.scene.add.graphics();
    graphics.lineStyle(2, 0xffffff); // todo color from player
    graphics.strokeEllipseShape(ellipse);
    graphics.visible = false;
    this.selectionCircle = graphics;
    this.gameObject.scene.add.existing(graphics);
  }
  setSelected(selected: boolean) {
    if (this.selected === selected) return;
    this.selected = selected;
    this.selectionCircle.visible = selected;
    if (selected) this.update();
    this.selectionChanged.next(selected);
  }

  getSelected(): boolean {
    return this.selected;
  }

  private update = () => {
    this.setPosition();
    this.setDepth();
  };

  private setPosition() {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) throw new Error("Transform not found");
    if (transform.x === undefined || transform.y === undefined) return;
    this.selectionCircle.setPosition(transform.x, transform.y); // todo
  }

  private setDepth() {
    const gameObjectDepth = getGameObjectDepth(this.gameObject);
    if (gameObjectDepth !== null) this.selectionCircle.depth = gameObjectDepth - 1;
  }

  private listenToSelectionEvents() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.gameObject.scene)?.subscribe((payload) => {
      const gameObjectId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (!gameObjectId) return;
      switch (payload.property) {
        case "selection.added":
          const selection = payload.data.playerStateData!.selection!;
          if (selection.includes(gameObjectId)) this.setSelected(true);
          break;
        case "selection.removed":
          const removed = payload.data.playerStateData!.selection!;
          if (removed.includes(gameObjectId)) this.setSelected(false);
          break;
        case "selection.set":
          const set = payload.data.playerStateData!.selection!;
          this.setSelected(set.includes(gameObjectId));
          break;
        case "selection.cleared":
          this.setSelected(false);
          break;
      }
    });
  }

  private destroy = () => {
    this.selectionCircle.destroy();
    this.actorMovedSubscription?.unsubscribe();
    this.selectionChangedSubscription?.unsubscribe();
  };
}
