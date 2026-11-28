import Phaser from "phaser";
import { BehaviourTree, State } from "mistreevous";
import { Subscription } from "rxjs";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { ShipAnimationComponent } from "../../../entity/components/animation/ship-animation-component";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { NavigationService } from "../../../world/services/navigation.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { getAmbientTargets } from "../behavior/ambient-targets";
import { nearestActor } from "../behavior/nearest-actor";
import { reactToNearby } from "../behavior/proximity-behavior";

const SHARK_TREE = `root { selector { action [AvoidBoat] action [ChasePrey] action [Wander] } }`;
const STEP_TICKS = 10;
const MOVE_INTERVAL_TICKS = 40;
const BOAT_RADIUS = 160;
const PREY_RADIUS = 320;

/** Host chooses destinations; the command relay applies each movement to every simulation peer. */
export class SharkBehavior {
  private readonly tree: BehaviourTree;
  private tickSubscription?: Subscription;
  private lastMoveTick = -MOVE_INTERVAL_TICKS;
  private lastKind = "";
  private tick = 0;
  private previousX: number;
  private previousY: number;
  private destroyed = false;

  constructor(private readonly shark: Phaser.GameObjects.Sprite) {
    this.previousX = shark.x;
    this.previousY = shark.y;
    this.tree = new BehaviourTree(SHARK_TREE, this);
    const clock = getSceneService(shark.scene, SimulationTickService);
    this.tickSubscription = clock?.tick$.subscribe((tick) => {
      if (tick % STEP_TICKS !== 0 || !shark.active) return;
      this.tick = tick;
      this.updateDirection();
      if (shark.scene instanceof ProbableWaffleScene && shark.scene.isHost) {
        this.tree.reset();
        this.tree.step();
      }
    });
    shark.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    shark.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  AvoidBoat(): State {
    const actors = getSceneService(this.shark.scene, ActorIndexSystem)?.getAllIdActors() ?? [];
    const boats = actors.filter((actor): actor is Phaser.GameObjects.Image | Phaser.GameObjects.Sprite =>
      (actor instanceof Phaser.GameObjects.Image || actor instanceof Phaser.GameObjects.Sprite) && actor.active &&
      !!getActorComponent(actor, ShipAnimationComponent)
    );
    return reactToNearby(
      () => nearestActor(this.shark, boats, BOAT_RADIUS, () => true),
      (boat) => {
        const dx = this.shark.x - boat.x;
        const dy = this.shark.y - boat.y;
        const length = Math.hypot(dx, dy) || 1;
        this.moveToWorld("avoid", this.shark.x + (dx || length) / length * BOAT_RADIUS,
          this.shark.y + dy / length * BOAT_RADIUS);
      }
    );
  }

  ChasePrey(): State {
    return reactToNearby(
      () => nearestActor(this.shark, getAmbientTargets(this.shark.scene), PREY_RADIUS, (bird) => bird.active),
      (bird) => this.moveToWorld("chase", bird.x, bird.y)
    );
  }

  Wander(): State {
    // Host-local randomness chooses only a command destination; it never consumes shared simulation RNG.
    if (this.tick - this.lastMoveTick >= MOVE_INTERVAL_TICKS || this.lastKind !== "wander") {
      const angle = Math.random() * Math.PI * 2;
      this.moveToWorld("wander", this.shark.x + Math.cos(angle) * 192, this.shark.y + Math.sin(angle) * 192);
    }
    return State.SUCCEEDED;
  }

  /** The atlas contains eight fin directions; derive the frame from actual displacement. */
  private updateDirection(): void {
    const dx = this.shark.x - this.previousX;
    const dy = this.shark.y - this.previousY;
    this.previousX = this.shark.x;
    this.previousY = this.shark.y;
    if (Math.hypot(dx, dy) < 1) return;
    const directions = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
    const index = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
    this.shark.setFrame(`Shark/fin/${directions[index]}.png`);
  }

  private moveToWorld(kind: string, x: number, y: number): void {
    if (this.lastKind === kind && this.tick - this.lastMoveTick < MOVE_INTERVAL_TICKS) return;
    const scene = this.shark.scene;
    if (!(scene instanceof ProbableWaffleScene) || !scene.isHost) return;
    const tilemap = getSceneComponent(scene, TilemapComponent)?.tilemap;
    const rawTile = tilemap?.getTileAtWorldXY(x, y);
    const navigation = getSceneService(scene, NavigationService);
    const tile = rawTile && navigation?.isTileNavigable(rawTile, MovementTerrainType.Water)
      ? rawTile : rawTile && navigation?.findNearestWaterTile(rawTile, 4);
    const id = getActorComponent(this.shark, IdComponent)?.id;
    const playerNumber = scene.player.playerNumber;
    const bus = getSceneService(scene, CommandBusService);
    if (!tile || !id || playerNumber == null || !bus) return;
    bus.dispatch({
      type: "MOVE", playerNumber, actorIds: [id], queue: false,
      tileVec3: { x: tile.x, y: tile.y, z: 0 }, worldVec3: { x, y, z: 0 }
    });
    this.lastMoveTick = this.tick;
    this.lastKind = kind;
  }

  private destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.tickSubscription?.unsubscribe();
    this.shark.scene?.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.shark.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }
}
