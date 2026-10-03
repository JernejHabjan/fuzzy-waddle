import { BoxHelper, Group, Object3D } from "three";
import { tileKey, type GameState, type LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";
import { ModelBank } from "./model-bank";

/** Owns build-site markers and the legacy wireframe selection bounds for one map. */
export class LevelGridVisuals {
  private readonly selectedBounds = new BoxHelper(new Object3D(), 0xf7d567);
  private readonly buildableTiles = new Map<string, Group>();

  constructor(
    private readonly root: Group,
    private readonly models: ModelBank
  ) {
    this.selectedBounds.visible = false;
    this.root.add(this.selectedBounds);
  }

  /** Places a model on every buildable tile and its path counterpart on every route cell. */
  load(level: LevelDefinition): void {
    const pathTiles = new Set([...level.paths.ground, ...level.paths.flying].map(tileKey));
    for (const key of pathTiles) {
      const [x, z] = key.split(",").map(Number);
      const tile = this.models.create(level.scene.pathTile);
      tile.position.set(x ?? 0, 0.3, -(z ?? 0));
      this.root.add(tile);
    }
    for (let z = 0; z < level.grid.height * level.grid.tileSize; z += level.grid.tileSize) {
      for (let x = 0; x < level.grid.width * level.grid.tileSize; x += level.grid.tileSize) {
        const key = `${x},${z}`;
        if (pathTiles.has(key)) continue;
        const tile = this.models.create(level.scene.buildableTile);
        tile.position.set(x, 0.3, -z);
        this.buildableTiles.set(key, tile);
        this.root.add(tile);
      }
    }
  }

  /** Matches the original game by outlining the selected tile model or its owned defense. */
  syncSelection(state: GameState, entities: ReadonlyMap<number, { object: Group }>): void {
    for (const [key, tile] of this.buildableTiles) tile.visible = !state.occupied.has(key);
    const tile = state.selectedTile;
    if (!tile) {
      this.selectedBounds.visible = false;
      return;
    }
    const key = tileKey(tile);
    const tower = [...state.entities.values()].find((entity) => entity.tower && tileKey(entity.tower.tile) === key);
    const selectedObject = tower ? entities.get(tower.id)?.object : this.buildableTiles.get(key);
    if (!selectedObject) {
      this.selectedBounds.visible = false;
      return;
    }
    this.selectedBounds.setFromObject(selectedObject);
    this.selectedBounds.visible = true;
  }

  /** Releases the helper's standalone geometry and material at scene teardown. */
  dispose(): void {
    this.selectedBounds.geometry.dispose();
    this.selectedBounds.material.dispose();
  }
}
