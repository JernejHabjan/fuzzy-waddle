import { Mesh, MeshPhongMaterial, SRGBColorSpace, Texture, TextureLoader, type Group } from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import type { VisualAsset } from "@fuzzy-waddle/trump-defense-gameplay";
import { assetUrl } from "./asset-paths";

/** The original small OBJ meshes use one diffuse/specular texture per model. */
export class ModelBank {
  private readonly loader = new OBJLoader();
  private readonly textures = new TextureLoader();
  private readonly entries = new Map<string, Promise<Group>>();
  private readonly ownedTextures = new Set<Texture>();
  private disposed = false;

  async load(asset: VisualAsset): Promise<void> {
    const key = `${asset.model}|${asset.texture}|${asset.specular ?? ""}`;
    if (!this.entries.has(key)) this.entries.set(key, this.loadModel(asset));
    const group = await this.entries.get(key);
    if (!group) return;
    if (this.disposed) {
      group.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          if (object.material instanceof MeshPhongMaterial) object.material.dispose();
        }
      });
      for (const texture of this.ownedTextures) texture.dispose();
      return;
    }
    this.resolved.set(key, group);
  }

  private async loadModel(asset: VisualAsset): Promise<Group> {
    const [group, diffuse, specular] = await Promise.all([
      this.loader.loadAsync(assetUrl(asset.model)),
      this.textures.loadAsync(assetUrl(asset.texture)),
      asset.specular ? this.textures.loadAsync(assetUrl(asset.specular)) : Promise.resolve(null)
    ]);
    diffuse.colorSpace = SRGBColorSpace;
    this.ownedTextures.add(diffuse);
    if (specular) this.ownedTextures.add(specular);
    const material = new MeshPhongMaterial({
      map: diffuse,
      specularMap: specular,
      shininess: 28,
      alphaTest: 0.1
    });
    group.traverse((object) => {
      if (object instanceof Mesh) object.material = material;
    });
    return group;
  }

  create(asset: VisualAsset): Group {
    const key = `${asset.model}|${asset.texture}|${asset.specular ?? ""}`;
    const cached = this.resolved.get(key);
    if (!cached) throw new Error(`Model ${asset.model} was not loaded.`);
    return cached.clone(true);
  }

  private readonly resolved = new Map<string, Group>();

  async prepare(assets: VisualAsset[]): Promise<void> {
    await Promise.all(assets.map((asset) => this.load(asset)));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set<Mesh["geometry"]>();
    const materials = new Set<MeshPhongMaterial>();
    for (const group of this.resolved.values()) {
      group.traverse((object) => {
        if (object instanceof Mesh) {
          geometries.add(object.geometry);
          if (object.material instanceof MeshPhongMaterial) materials.add(object.material);
        }
      });
    }
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of this.ownedTextures) texture.dispose();
    this.entries.clear();
    this.resolved.clear();
    this.ownedTextures.clear();
  }
}
