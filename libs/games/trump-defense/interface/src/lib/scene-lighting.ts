import { AmbientLight, DirectionalLight, PointLight, Scene, SpotLight } from "three";
import type { LevelDefinition, SceneLight } from "@fuzzy-waddle/trump-defense-gameplay";

const position = (light: DirectionalLight | PointLight | SpotLight, data: SceneLight): void => {
  light.position.set(...data.position);
};

export function addSceneLights(scene: Scene, level: LevelDefinition): void {
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
    }
    scene.add(light);
  }
}
