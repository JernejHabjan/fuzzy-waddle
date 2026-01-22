export enum SpellType {
  // Damage spells
  Snowstorm = 'snowstorm', // AOE freeze + DoT
  Firestorm = 'firestorm', // Persistent AOE burn zone

  // Control spells
  FrostNova = 'frostNova', // AOE slow (no stun)

  // Healing spells
  HealingLight = 'healingLight', // Single target instant heal
  HealingRain = 'healingRain', // AOE heal over time zone

  // Summon spells
  HealingTotem = 'healingTotem' // Spawns healing totem prefab
}
