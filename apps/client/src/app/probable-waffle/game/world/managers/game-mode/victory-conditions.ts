export class VictoryCondition {
  static readonly TIME = new VictoryCondition('Time');
  static readonly KILLS = new VictoryCondition('Kills');
  static readonly RESOURCES = new VictoryCondition('Resources');
  static readonly UNITS = new VictoryCondition('Units');
  static readonly BUILDINGS = new VictoryCondition('Buildings');
  static readonly UPGRADES = new VictoryCondition('Upgrades');
  static readonly ALLIES = new VictoryCondition('Allies');
  static readonly ENEMIES = new VictoryCondition('Enemies');
  static readonly ALL = new VictoryCondition('All');
  static readonly NONE = new VictoryCondition('None');
  static readonly CUSTOM = new VictoryCondition('Custom');
  static readonly UNKNOWN = new VictoryCondition('Unknown');

  constructor(public name: string) {}
}

export class VictoryConditions {
  constructor(public victoryCondition: VictoryCondition, public value: number) {}
}
