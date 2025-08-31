import { Observable, Subject } from "rxjs";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectDirectionBetweenTiles } from "../../systems/movement.system";
import { getGameObjectRenderedTransform, onObjectReady } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { NavigationService } from "../../../world/services/navigation.service";
import { getActorComponent } from "../../../data/actor-component";
import { RepresentableComponent } from "../representable-component";
import type { IsoDirection } from "./iso-directions";

export interface ActorTranslateDefinition {
  /**
   * Tile move duration specifies how long (in ms) unit requires to cross 1 tile
   */
  tileMoveDuration?: number;
}

export class ActorTranslateComponent {
  private _actorMovedLogicalPosition: Subject<Vector3Simple> = new Subject<Vector3Simple>();
  currentDirection?: IsoDirection;
  onDirectionChanged: Subject<IsoDirection> = new Subject<IsoDirection>();
  private representableComponent?: RepresentableComponent;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly actorTranslateDefinition: ActorTranslateDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
  }
  init() {
    this.representableComponent = getActorComponent(this.gameObject, RepresentableComponent);
  }
  get renderedTransform(): Vector2Simple {
    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform) return { x: 0, y: 0 };
    return { x: transform.x, y: transform.y };
  }

  get actorMovedLogicalPosition(): Observable<Vector3Simple> {
    return this._actorMovedLogicalPosition.asObservable();
  }

  updateDirection(newTileWorldXY: Vector2Simple) {
    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform) return;
    const newDirection = getGameObjectDirectionBetweenTiles(transform, newTileWorldXY);
    if (this.currentDirection === newDirection) return;
    this.directionChanged(newDirection);
  }

  turnTowardsGameObject(targetGameObject: Phaser.GameObjects.GameObject) {
    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform) return;
    const targetTransform = getGameObjectRenderedTransform(targetGameObject);
    if (!targetTransform) return;
    this.turnTowardsPosition({ x: targetTransform.x, y: targetTransform.y });
  }

  turnTowardsPosition(targetWorldXY: Vector2Simple) {
    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform) return;
    const newDirection = getGameObjectDirectionBetweenTiles(transform, targetWorldXY);
    this.directionChanged(newDirection);
  }

  turnTowardsTile(targetTileXY: Vector2Simple) {
    const navigationService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navigationService) return;
    const tileWorldXY = navigationService.getTileWorldCenter(targetTileXY);
    if (!tileWorldXY) return;
    this.turnTowardsPosition(tileWorldXY);
  }

  private directionChanged(newDirection: IsoDirection | undefined) {
    if (!newDirection) newDirection = "south";
    this.currentDirection = newDirection;
    this.onDirectionChanged.next(newDirection);
  }

  /**
   * This should be called by movement system - action to move actor to position is broadcast to all players in the game.
   * This is to update all listeners in clients world about small movement changes - not to broadcast this across network
   */
  moveActorToLogicalPosition(logicalPosition: Vector3Simple) {
    this._actorMovedLogicalPosition.next(logicalPosition);
    if (this.representableComponent) {
      this.representableComponent.logicalWorldTransform = logicalPosition;
    }
  }
}
