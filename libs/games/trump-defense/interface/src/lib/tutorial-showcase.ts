import { Box3, BoxHelper, Group, PerspectiveCamera, Vector3 } from "three";
import type {
  LevelDefinition,
  TutorialShowcaseSelection,
  TutorialVisualKind
} from "@fuzzy-waddle/trump-defense-gameplay";
import { ModelBank } from "./model-bank";

/** Isolates tutorial model normalization and idle rotation from the map renderer. */
export class TutorialShowcase {
  readonly root = new Group();
  private readonly modelsInShowcase: Group[] = [];
  private selectionBounds: BoxHelper | null = null;

  constructor(
    private readonly models: ModelBank,
    private readonly camera: PerspectiveCamera
  ) {}

  /** Centers one authored level model in the skybox for an unobstructed briefing view. */
  set(level: LevelDefinition | null, visual: TutorialShowcaseSelection): void {
    this.disposeSelectionBounds();
    this.root.clear();
    this.modelsInShowcase.length = 0;
    this.root.visible = !!level && !!visual;
    if (!level || !visual) return;
    const visuals: readonly TutorialVisualKind[] = typeof visual === "string" ? [visual] : visual;
    visuals.forEach((kind, index) => this.addVisual(level, kind, index, visuals.length));
    this.camera.position.set(0, 10, visuals.length > 1 ? 52 : 45);
    this.camera.lookAt(0, 10, 0);
  }

  /** Centers individual assets and outlines build tiles to mirror map selection. */
  private addVisual(level: LevelDefinition, visual: TutorialVisualKind, index: number, count: number): void {
    const asset =
      visual === "Wall"
        ? level.scene.wall
        : visual === "BuildTile"
          ? level.scene.buildableTile
          : level.scene.visuals[visual];
    const model = this.models.create(asset);
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const defense = Object.values(level.rules.towers).find(
      (tower) => tower.visual === visual || tower.upgradedVisual === visual
    );
    // Keep base and upgraded defenses at the same scale so an upgrade never appears to shrink.
    const referenceBounds = defense
      ? new Box3().setFromObject(this.models.create(level.scene.visuals[defense.visual]))
      : bounds;
    const size = referenceBounds.getSize(new Vector3());
    const scale = 8 / Math.max(size.x, size.y, size.z, 1);
    const item = new Group();
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    item.position.set(count > 1 ? (index - (count - 1) / 2) * 14 : 0, 10, 0);
    // Build sites are authored as ground planes; face the briefing camera so the tile reads clearly.
    if (visual === "BuildTile") item.rotation.x = Math.PI / 2;
    item.add(model);
    this.root.add(item);
    if (visual === "BuildTile") {
      this.selectionBounds = new BoxHelper(item, 0xf7d567);
      this.root.add(this.selectionBounds);
    }
    this.modelsInShowcase.push(item);
  }

  /** Rotates only the tutorial model; simulation state remains untouched. */
  rotate(): void {
    for (const model of this.modelsInShowcase) model.rotation.y += 0.012;
    this.selectionBounds?.update();
  }

  /** Releases the helper-owned render buffers when the enclosing scene is disposed. */
  dispose(): void {
    this.disposeSelectionBounds();
    this.modelsInShowcase.length = 0;
    this.root.clear();
  }

  /** Drops the Three.js helper's GPU buffers before replacing or disposing the scene. */
  private disposeSelectionBounds(): void {
    if (!this.selectionBounds) return;
    this.selectionBounds.geometry.dispose();
    this.selectionBounds.material.dispose();
    this.selectionBounds = null;
  }
}
