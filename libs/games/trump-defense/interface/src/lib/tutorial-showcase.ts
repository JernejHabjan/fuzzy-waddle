import { Box3, Group, PerspectiveCamera, Vector3 } from "three";
import type { LevelDefinition, TutorialVisualKind } from "@fuzzy-waddle/trump-defense-gameplay";
import { ModelBank } from "./model-bank";

/** Isolates tutorial model normalization and idle rotation from the map renderer. */
export class TutorialShowcase {
  readonly root = new Group();
  private model: Group | null = null;

  constructor(
    private readonly models: ModelBank,
    private readonly camera: PerspectiveCamera
  ) {}

  /** Centers one authored level model in the skybox for an unobstructed briefing view. */
  set(level: LevelDefinition | null, visual: TutorialVisualKind | null): void {
    this.root.clear();
    this.model = null;
    this.root.visible = !!level && !!visual;
    if (!level || !visual) return;
    const asset =
      visual === "Wall"
        ? level.scene.wall
        : visual === "BuildTile"
          ? level.scene.buildableTile
          : level.scene.visuals[visual];
    const model = this.models.create(asset);
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const scale = 8 / Math.max(size.x, size.y, size.z, 1);
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, 10 - center.y * scale, -center.z * scale);
    this.root.add(model);
    this.model = model;
    this.camera.position.set(0, 10, 45);
    this.camera.lookAt(0, 10, 0);
  }

  /** Rotates only the tutorial model; simulation state remains untouched. */
  rotate(): void {
    if (this.model) this.model.rotation.y += 0.012;
  }
}
