export enum SpellTargetType {
  Ground = 'ground', // target a position on the ground
  Actor = 'actor', // target a specific actor (ally or enemy)
  Self = 'self', // cast on self only
  EnemyUnit = 'enemyUnit', // target enemy units only
  FriendlyUnit = 'friendlyUnit' // target friendly units only
}
