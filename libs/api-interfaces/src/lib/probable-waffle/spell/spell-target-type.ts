export enum SpellTargetType {
  // target a position on the ground
  Ground = "Ground",
  // target a specific actor (ally or enemy)
  Actor = "Actor",
  // cast on self only
  Self = "Self",
  // target enemy units only
  EnemyUnit = "EnemyUnit",
  // target friendly units only
  FriendlyUnit = "FriendlyUnit"
}
