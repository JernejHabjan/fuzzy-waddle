import {
  AmbientLight,
  CircleGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3
} from "three";
import type { LevelDefinition, SceneLight } from "@fuzzy-waddle/trump-defense-gameplay";

const position = (light: DirectionalLight | PointLight | SpotLight, data: SceneLight): void => {
  light.position.set(...data.position);
};

export function addSceneLights(scene: Scene, level: LevelDefinition): Group {
  const visibleEffects = new Group();
  const { ambient, directional, points, spots } = level.scene;
  scene.add(new AmbientLight(ambient.color, ambient.intensity));
  const sun = new DirectionalLight(directional.color, directional.intensity);
  position(sun, directional);
  if (directional.target) {
    sun.target.position.set(...directional.target);
    scene.add(sun.target);
  }
  scene.add(sun);
  for (const data of points) {
    const light = new PointLight(data.color, data.intensity, data.distance ?? 0, 2);
    position(light, data);
    scene.add(light);
  }
  for (const data of spots) {
    const light = new SpotLight(data.color, data.intensity, data.distance ?? 0, data.angle ?? Math.PI / 6, 0.25, 2);
    position(light, data);
    if (data.target) {
      light.target.position.set(...data.target);
      scene.add(light.target);
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      light.shadow.camera.far = data.distance ?? 100;
      addSpotlightVisual(visibleEffects, light, data);
    }
    scene.add(light);
  }
  scene.add(visibleEffects);
  return visibleEffects;
}

/** Standard meshes make legacy spotlight locations legible without custom shader effects. */
function addSpotlightVisual(group: Group, light: SpotLight, data: SceneLight): void {
  if (!data.target) return;
  const target = new Vector3(...data.target);
  addLightPool(group, target, data.color, 11, 0.12);
  addLightPool(group, target, data.color, 6, 0.2);
  const sourceMarker = new Mesh(new SphereGeometry(1.6, 10, 8), new MeshBasicMaterial({ color: data.color }));
  sourceMarker.position.set(...data.position);
  group.add(sourceMarker);
  light.castShadow = true;
}

function addLightPool(group: Group, position: Vector3, color: string, radius: number, opacity: number): void {
  const pool = new Mesh(
    new CircleGeometry(radius, 32),
    new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(position.x, 0.45, position.z);
  group.add(pool);
}
