import { Observable, Subject } from "rxjs";
import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectDirectionBetweenTiles } from "../../systems/movement.system";
import { getGameObjectTransform } from "../../../data/game-object-helper";

export type MoveDirection =
  | "north"
  | "south"
  | "east"
  | "west"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest"
  | undefined;

export interface ActorTranslateDefinition {
  usePathfinding?: boolean;
  /**
   * Tile step duration specifies how long (in ms) unit requires to cross 1 tile
   */
  tileStepDuration?: number;
}

export class ActorTranslateComponent {
  private _actorMoved: Subject<Vector3Simple> = new Subject<Vector3Simple>();
  currentDirection?: MoveDirection;
  private onDirectionChanged: Subject<MoveDirection> = new Subject<MoveDirection>();
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly actorTranslateDefinition: ActorTranslateDefinition
  ) {}

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
    const newDirection = getGameObjectDirectionBetweenTiles(transform, targetTransform);
    this.directionChanged(newDirection);
  }

  private directionChanged(newDirection: MoveDirection) {
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
  }
}
