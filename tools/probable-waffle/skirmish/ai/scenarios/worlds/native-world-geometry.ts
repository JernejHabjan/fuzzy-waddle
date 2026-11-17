/** Exact 50×50 isometric tile centers, matching IsoHelper and the frozen test map's 64×32 tiles. */
export function tile(x, y, z = 0) {
  return { x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z };
}

export function melee(faction) {
  return faction === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale";
}

export function producer(faction) {
  return faction === "Tivara" ? "AnkGuard" : "InfantryInn";
}
