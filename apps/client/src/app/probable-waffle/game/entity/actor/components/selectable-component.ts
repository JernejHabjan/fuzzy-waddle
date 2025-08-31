import GameObject = Phaser.GameObjects.GameObject;
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectRenderedTransform,
  onObjectReady
} from "../../../data/game-object-helper";
import { BehaviorSubject, Subscription } from "rxjs";
import Phaser from "phaser";
import { listenToSelectionEvents } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "./id-component";
import { ActorTranslateComponent } from "./actor-translate-component";
import { HealthComponent } from "../../combat/components/health-component";
import { ContainerComponent } from "../../building/container-component";
import { VisionComponent } from "./vision-component";
import type { SelectableComponentData } from "@fuzzy-waddle/api-interfaces";

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
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    this.listenToSelectionEvents();
  }

  private init = () => {
    this.subscribeActorMove();
  };

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMovedLogicalPosition.subscribe(this.update);
  }

  private createSelectionCircle() {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;
    const ellipse = new Phaser.Geom.Ellipse(0, 0, bounds.width, bounds.width / 2);
    ellipse.y = this.selectableDefinition?.offsetY ?? 0;
    const graphics = this.gameObject.scene.add.graphics();
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeEllipseShape(ellipse);
    graphics.visible = false;
    this.selectionCircle = graphics;
    this.gameObject.scene.add.existing(graphics);
  }
  setSelected(selected: boolean) {
    if (this.selected === selected) return;
    this.selected = selected;
    if (this.selected && !this.selectionCircle) this.createSelectionCircle();
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (visionComponent && !visionComponent.visibilityByCurrentPlayer) selected = false;
    this.selectionCircle.visible = selected;
    if (selected) this.update();
    this.selectionChanged.next(selected);
  }

  getSelected(): boolean {
    return this.selected;
  }

  private update = () => {
    if (!this.selected) return;
    this.setPosition();
    this.setDepth();
  };

  /**
   * sets selection circle position based on the game object's rendered transform.
   */
  private setPosition() {
    const renderedTransform = getGameObjectRenderedTransform(this.gameObject);
    if (!renderedTransform) throw new Error("Transform not found");
    if (renderedTransform.x === undefined || renderedTransform.y === undefined) return;
    this.selectionCircle.setPosition(renderedTransform.x, renderedTransform.y);
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

  setData(data: Partial<SelectableComponentData>) {
    if (data.selected !== undefined) this.setSelected(data.selected);
  }

  getData(): SelectableComponentData {
    return {
      selected: this.getSelected()
    } satisfies SelectableComponentData;
  }

  private gameObjectVisibilityChanged(visible: boolean) {
    if (!this.selectionCircle) return;
    this.selectionCircle.visible = visible;
  }

  private destroy = () => {
    this.selectionCircle?.destroy();
    this.actorMovedSubscription?.unsubscribe();
    this.selectionChangedSubscription?.unsubscribe();
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
  };
}
