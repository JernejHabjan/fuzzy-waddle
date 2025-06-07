import { Observable, Subject } from "rxjs";
import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectDirectionBetweenTiles } from "../../systems/movement.system";
import { getGameObjectTransform, onObjectReady } from "../../../data/game-object-helper";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { NavigationService } from "../../../scenes/services/navigation.service";
import { getActorComponent } from "../../../data/actor-component";
import { RepresentableComponent } from "./representable-component";

export type IsoDirection = "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest";

export interface ActorTranslateDefinition {
  usePathfinding?: boolean;
  /**
   * Tile step duration specifies how long (in ms) unit requires to cross 1 tile
   */
  tileStepDuration?: number;
  isFlying?: boolean;
}

export class ActorTranslateComponent {
  private _actorMoved: Subject<Vector3Simple> = new Subject<Vector3Simple>();
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
  get currentTileWorldXY(): Vector2Simple {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return { x: 0, y: 0 };
    return { x: transform.x, y: transform.y };
  }

  get actorMoved(): Observable<Vector3Simple> {
    return this._actorMoved.asObservable();
  }

  updateDirection(newTileWorldXY: Vector2Simple) {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return;
    const newDirection = getGameObjectDirectionBetweenTiles(transform, newTileWorldXY);
    if (this.currentDirection === newDirection) return;
    this.directionChanged(newDirection);
  }

  turnTowardsGameObject(targetGameObject: Phaser.GameObjects.GameObject) {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return;
    const targetTransform = getGameObjectTransform(targetGameObject);
    if (!targetTransform) return;
    this.turnTowardsPosition({ x: targetTransform.x, y: targetTransform.y });
  }

  turnTowardsPosition(targetWorldXY: Vector2Simple) {
    const transform = getGameObjectTransform(this.gameObject);
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
  moveActorToPosition(worldPosition: Vector3Simple) {
    this._actorMoved.next(worldPosition);
    if (this.representableComponent) {
      this.representableComponent.worldTransform = worldPosition;
    }
  }
}
