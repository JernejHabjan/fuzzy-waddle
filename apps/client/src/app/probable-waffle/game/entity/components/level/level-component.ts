import type { LevelDefinition } from "./level-definition";

export class LevelComponent {
  static readonly LevelChangedEvent = "LevelChanged";

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private levelData: LevelDefinition
  ) {}

  setData(data: Partial<LevelDefinition>) {
    if (data.level !== undefined) {
      this.levelData.level = data.level;
      this.gameObject.emit(LevelComponent.LevelChangedEvent, this.levelData.level);
    }
    if (data.maxLevel !== undefined) {
      this.levelData.maxLevel = data.maxLevel;
    }
  }

  getData(): LevelDefinition {
    return { level: this.levelData.level, maxLevel: this.levelData.maxLevel };
  }

  get currentLevel(): number {
    return this.levelData.level;
  }

  get maxLevel(): number {
    return this.levelData.maxLevel ?? 1;
  }

  canLevelUp(): boolean {
    return this.currentLevel < this.maxLevel;
  }
}
