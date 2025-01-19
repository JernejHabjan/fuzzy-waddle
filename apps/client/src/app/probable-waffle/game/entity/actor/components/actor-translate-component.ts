import { Observable, Subject } from "rxjs";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";

export interface ActorTranslateDefinition {
  usePathfinding?: boolean;
  /**
   * tile step duration specifies how long (in ms) unit requires to cross 1 tile
   */
  tileStepDuration?: number;
}

export class ActorTranslateComponent {
  private _actorMoved: Subject<Vector3Simple> = new Subject<Vector3Simple>();
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly actorTranslateDefinition: ActorTranslateDefinition
  ) {}

  get actorMoved(): Observable<Vector3Simple> {
    return this._actorMoved.asObservable();
  }

  /**
   * This should be called by movement system - action to move actor to position is broadcast to all players in the game.
   * This is to update all listeners in clients world about small movement changes - not to broadcast this across network
   */
  moveActorToPosition(position: Vector3Simple) {
    this._actorMoved.next(position);
  }
}
