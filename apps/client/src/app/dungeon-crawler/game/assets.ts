export enum AssetsDungeon {
  "tiles" = "tiles",
  "dungeon" = "dungeon",
  "faune" = "faune",
  "lizard" = "lizard",
  "treasure" = "treasure",
  "heartEmpty" = "heartEmpty",
  "heartFull" = "heartFull",
  "knife" = "knife"
}

// visible in tiled (tileset name)
export enum DungeonTilesetNames {
  "dungeion" = "dungeion"
}

// layers of tile map (visible in tiled)
export enum DungeonTilesetLayers {
  "Walls" = "Walls",
  "Ground" = "Ground"
}

// custom names for animations
export enum AnimationsFaune {
  "default" = "walk-down-3.png",
  "idleDown" = "faune-idle-down",
  "idleUp" = "faune-idle-up",
  "idleSide" = "faune-idle-side",
  "runDown" = "faune-run-down",
  "runUp" = "faune-run-up",
  "runSide" = "faune-run-side",
  "faint" = "faune-faint"
}

export enum AnimationsChest {
  "open" = "chest-open",
  "close" = "chest-close"
}

export enum AnimationsLizard {
  "default" = "lizard_m_idle_anim_f0.png",
  "idle" = "idle",
  "run" = "run"
}

export enum DungeonCrawlerSceneEventTypes {
  "playerHealthChanged" = "playerHealthChanged"
}
