import GameObject = Phaser.GameObjects.GameObject;

export interface VisionDefinition {
  range: number;
}
export class VisionComponent {
  constructor(
    private readonly gameObject: GameObject,
    private readonly visionDefinition: VisionDefinition
  ) {}
}
