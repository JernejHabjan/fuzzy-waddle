import {
  CubeTexture,
  CubeTextureLoader,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three";
import type { GameState, GridPoint, LevelDefinition, SceneProp } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";
import { ModelBank } from "./model-bank";
import { addSceneLights } from "./scene-lighting";

type EntityView = { visual: string; object: Group };

/** The scene is a disposable view of immutable level data and current gameplay entities. */
export class ThreeScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.5, 500);
  private readonly models = new ModelBank();
  private readonly observer: ResizeObserver;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly ground = new Plane(new Vector3(0, 1, 0), 0);
  private readonly selected = new Mesh(
    new PlaneGeometry(7, 7),
    new MeshBasicMaterial({ color: "#f7d567", transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false })
  );
  private readonly entityViews = new Map<number, EntityView>();
  private readonly projectiles = new Map<number, Group>();
  private readonly hearts: Group[] = [];
  private lightEffects: Group | null = null;
  private readonly target = new Vector3(64, 0, -48);
  private skybox: CubeTexture | null = null;
  private wall: Group | null = null;
  private wallBaseY = 0;
  private level: LevelDefinition | null = null;
  private disposed = false;
  private mapWidth = 128;
  private mapDepth = 96;
  /** Distance is kept separately so wheel input can change zoom and tilt in one step. */
  private cameraDistance = 150;
  /** Orbit inclination is adjusted by the same wheel direction as camera distance. */
  private cameraAngle = Math.PI / 4;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.host.appendChild(this.renderer.domElement);
    this.camera.position.set(64, 105, 74);
    this.cameraDistance = this.camera.position.distanceTo(this.target);
    this.camera.lookAt(this.target);
    this.selected.rotation.x = -Math.PI / 2;
    this.selected.position.y = 0.4;
    this.selected.visible = false;
    this.scene.add(this.selected);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.host);
    this.resize();
  }

  async load(level: LevelDefinition): Promise<void> {
    this.level = level;
    this.mapWidth = level.grid.width * level.grid.tileSize;
    this.mapDepth = level.grid.height * level.grid.tileSize;
    const cameraScale = Math.max(this.mapWidth / 128, this.mapDepth / 96);
    this.target.set(this.mapWidth / 2, 0, -this.mapDepth / 2);
    this.cameraDistance = 150 * cameraScale;
    this.cameraAngle = Math.PI / 4;
    this.updateCameraPosition();
    const { terrain, wall, pathTile, props, visuals, skybox } = level.scene;
    const loader = new CubeTextureLoader();
    const [, background] = await Promise.all([
      this.models.prepare([terrain, wall, pathTile, ...props, ...Object.values(visuals)]),
      loader.loadAsync(skybox.map(assetUrl))
    ]);
    if (this.disposed) {
      background.dispose();
      this.models.dispose();
      return;
    }
    this.skybox = background;
    this.scene.background = background;
    this.lightEffects = addSceneLights(this.scene, level);
    this.place(terrain);
    for (const prop of props) this.place(prop);
    this.wall = this.place(wall);
    this.wallBaseY = wall.position[1];
    for (const key of new Set(level.paths.ground.map(([x, z]) => `${x},${z}`))) {
      const [x, z] = key.split(",").map(Number);
      const tile = this.models.create(pathTile);
      tile.position.set(x ?? 0, 0.3, -(z ?? 0));
      this.scene.add(tile);
    }
  }

  private place(prop: SceneProp): Group {
    const object = this.models.create(prop);
    object.position.set(...prop.position);
    object.rotation.y = prop.rotationY ?? 0;
    object.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(object);
    return object;
  }

  sync(state: GameState): void {
    if (!this.level) return;
    for (const [id, view] of this.entityViews) {
      const entity = state.entities.get(id);
      if (!entity || entity.visual !== view.visual) {
        this.scene.remove(view.object);
        this.entityViews.delete(id);
      }
    }
    for (const entity of state.entities.values()) {
      let view = this.entityViews.get(entity.id);
      if (!view) {
        const asset = this.level.scene.visuals[entity.visual];
        const object = this.models.create(asset);
        object.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        view = { visual: entity.visual, object };
        this.entityViews.set(entity.id, view);
        this.scene.add(object);
      }
      view.object.position.set(entity.position.x, entity.position.y, entity.position.z);
      view.object.rotation.y = entity.orientation?.y ?? 0;
    }
    this.selected.visible = !!state.selectedTile;
    if (state.selectedTile) this.selected.position.set(state.selectedTile[0], 0.4, -state.selectedTile[1]);
    if (this.wall) this.wall.position.y = this.wallBaseY + state.wallHeight;
    this.syncProjectiles(state);
    this.syncHearts(state.lives);
  }

  /** Reconciles in-flight rocket meshes with simulation-owned projectile effects. */
  private syncProjectiles(state: GameState): void {
    const level = this.level;
    if (!level) return;
    const active = new Set(state.shotEffects.map((effect) => effect.id));
    for (const [id, object] of this.projectiles) {
      if (active.has(id)) continue;
      this.scene.remove(object);
      this.projectiles.delete(id);
    }
    for (const effect of state.shotEffects) {
      let rocket = this.projectiles.get(effect.id);
      if (!rocket) {
        rocket = this.models.create(level.scene.visuals.Rocket);
        this.projectiles.set(effect.id, rocket);
        this.scene.add(rocket);
      }
      const progress = Math.min(1, effect.elapsedMs / effect.durationMs);
      const from = new Vector3(effect.from.x, effect.from.y + 4, effect.from.z);
      const to = new Vector3(effect.to.x, effect.to.y + 4, effect.to.z);
      rocket.position.copy(from).lerp(to, progress);
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      rocket.rotation.y = Math.atan2(-dz, dx);
    }
  }

  /** Shows one original heart model for every life remaining at the map edge. */
  private syncHearts(lives: number): void {
    const asset = this.level?.scene.visuals.Heart;
    if (!asset) return;
    while (this.hearts.length < lives) {
      const heart = this.models.create(asset);
      heart.scale.setScalar(2.2);
      heart.position.set(this.mapWidth / 4 + this.hearts.length * 6, 5, -this.mapDepth - 8);
      this.hearts.push(heart);
      this.scene.add(heart);
    }
    while (this.hearts.length > lives) {
      const heart = this.hearts.pop();
      if (heart) this.scene.remove(heart);
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  pick(event: PointerEvent): GridPoint | null {
    if (!this.level) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new Vector3();
    if (!this.raycaster.ray.intersectPlane(this.ground, point)) return null;
    const { tileSize, width, height } = this.level.grid;
    const x = Math.round(point.x / tileSize) * tileSize;
    const z = Math.round(-point.z / tileSize) * tileSize;
    return x >= 0 && x < width * tileSize && z >= 0 && z < height * tileSize ? [x, z] : null;
  }

  pan(dx: number, dz: number): void {
    const xMargin = this.mapWidth * 0.35;
    const zMargin = this.mapDepth * 0.25;
    const x = Math.max(-xMargin, Math.min(this.mapWidth + xMargin, this.target.x + dx));
    const z = Math.max(-this.mapDepth - zMargin, Math.min(zMargin, this.target.z + dz));
    this.target.set(x, 0, z);
    this.updateCameraPosition();
  }

  zoom(direction: number): void {
    const mapScale = Math.max(this.mapWidth / 128, this.mapDepth / 96);
    const steps = Math.max(-3, Math.min(3, direction / 120));
    this.cameraDistance = Math.max(45 * mapScale, Math.min(230 * mapScale, this.cameraDistance * 1.1 ** steps));
    // The legacy wheel changed camera height and pitch together; orbiting preserves that coupled feel.
    this.cameraAngle = Math.max(0.2, Math.min(1.25, this.cameraAngle + (steps * Math.PI) / 36));
    this.updateCameraPosition();
  }

  get cameraX(): number {
    return this.target.x;
  }

  private updateCameraPosition(): void {
    const horizontal = Math.cos(this.cameraAngle) * this.cameraDistance;
    this.camera.position.set(
      this.target.x,
      Math.sin(this.cameraAngle) * this.cameraDistance,
      this.target.z + horizontal
    );
    this.camera.lookAt(this.target);
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.observer.disconnect();
    for (const group of [this.lightEffects]) {
      group?.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          if (object.material instanceof MeshBasicMaterial) object.material.dispose();
        }
      });
    }
    this.selected.geometry.dispose();
    (this.selected.material as MeshBasicMaterial).dispose();
    this.models.dispose();
    this.skybox?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
