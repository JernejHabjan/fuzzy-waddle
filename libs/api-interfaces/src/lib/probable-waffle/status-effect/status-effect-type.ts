export enum StatusEffectType {
  Stunned = 'stunned', // Cannot move, attack, or use abilities
  Frozen = 'frozen', // Same as stunned but with frost visuals
  Slowed = 'slowed', // Reduced movement speed (can still act)
  Burning = 'burning', // DoT fire damage + visual
  Poisoned = 'poisoned', // DoT poison damage + visual
  Regenerating = 'regenerating' // Heal over time
}
