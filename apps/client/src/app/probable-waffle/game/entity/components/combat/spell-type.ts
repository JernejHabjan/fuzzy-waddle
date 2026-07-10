export enum SpellType {
  // Damage spells
  Snowstorm = "snowstorm", // AOE freeze + DoT
  Firestorm = "firestorm", // Persistent AOE burn zone
  BansheeScream = "bansheeScream", // AOE stun
  BansheeTeleport = "BansheeTeleport", // Teleport
  MedusaGaze = "MedusaGaze", // AOE stun
  WendigoStomp = "WendigoStomp", // AOE stun
  WendigoBranches = "WendigoBranches", // AOE line of attack

  // Control spells
  FrostNova = "frostNova", // AOE slow (no stun)

  // Healing spells
  HealingLight = "healingLight", // Single target instant heal
  HealingRain = "healingRain", // AOE heal over time zone

  // Summon spells
  HealingTotem = "healingTotem" // Spawns healing totem prefab
}
