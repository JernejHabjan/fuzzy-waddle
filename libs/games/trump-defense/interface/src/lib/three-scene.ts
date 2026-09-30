import {
  BufferGeometry,
  CubeTexture,
  CubeTextureLoader,
  DoubleSide,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Group
} from "three";
import type { GameState, GridPoint, LevelDefinition, SceneProp } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";
import { ModelBank } from "./model-bank";
import { addSceneLights } from "./scene-lighting";

type EntityView = { visual: string; object: Group };
type ShotView = { line: Line; expires: number };

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
  private readonly shots: ShotView[] = [];
  private readonly target = new Vector3(64, 0, -48);
  private skybox: CubeTexture | null = null;
  private wall: Group | null = null;
  private wallBaseY = 0;
  private level: LevelDefinition | null = null;
  private disposed = false;
  private mapWidth = 128;
  private mapDepth = 96;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.style.display = "block";
    this.host.appendChild(this.renderer.domElement);
    this.camera.position.set(64, 105, 74);
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
    this.camera.position.set(this.target.x, 105 * cameraScale, this.target.z + 122 * cameraScale);
    this.camera.lookAt(this.target);
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
    addSceneLights(this.scene, level);
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
        view = { visual: entity.visual, object };
        this.entityViews.set(entity.id, view);
        this.scene.add(object);
      }
      view.object.position.set(entity.position.x, entity.position.y, entity.position.z);
    }
    this.selected.visible = !!state.selectedTile;
    if (state.selectedTile) this.selected.position.set(state.selectedTile[0], 0.4, -state.selectedTile[1]);
    if (this.wall) this.wall.position.y = this.wallBaseY + state.wallHeight;
    for (const shot of state.shotEffects) this.addShot(shot.from, shot.to);
  }

  private addShot(
    from: Vector3 | { x: number; y: number; z: number },
    to: Vector3 | { x: number; y: number; z: number }
  ): void {
    const line = new Line(
      new BufferGeometry().setFromPoints([new Vector3(from.x, from.y + 5, from.z), new Vector3(to.x, to.y + 5, to.z)]),
      new LineBasicMaterial({ color: "#ffbd52" })
    );
    this.scene.add(line);
    this.shots.push({ line, expires: performance.now() + 120 });
  }

  render(): void {
    const now = performance.now();
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      if (!shot || shot.expires > now) continue;
      this.scene.remove(shot.line);
      shot.line.geometry.dispose();
      (shot.line.material as LineBasicMaterial).dispose();
      this.shots.splice(i, 1);
    }
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
    this.camera.position.x += x - this.target.x;
    this.camera.position.z += z - this.target.z;
    this.target.set(x, 0, z);
    this.camera.lookAt(this.target);
  }

  zoom(direction: number): void {
    const offset = this.camera.position.clone().sub(this.target);
    const mapScale = Math.max(this.mapWidth / 128, this.mapDepth / 96);
    const distance = Math.max(45 * mapScale, Math.min(230 * mapScale, offset.length() * (direction > 0 ? 1.1 : 0.9)));
    this.camera.position.copy(this.target).add(offset.setLength(distance));
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
    for (const shot of this.shots) {
      shot.line.geometry.dispose();
      (shot.line.material as LineBasicMaterial).dispose();
    }
    this.selected.geometry.dispose();
    (this.selected.material as MeshBasicMaterial).dispose();
    this.models.dispose();
    this.skybox?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
