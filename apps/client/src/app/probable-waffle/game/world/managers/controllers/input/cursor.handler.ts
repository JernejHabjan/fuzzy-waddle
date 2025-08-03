import { LockedCursorHandler } from "./locked-cursor.handler";

export enum CursorType {
  Add = "add",
  AttackEnemy = "attackEnemy",
  AttackFriends = "attackFriends",
  AttackGreen = "attackGreen",
  AttackRed = "attackRed",
  AttackYellow = "attackYellow",
  BuildGreen = "buildGreen",
  BuildRed = "buildRed",
  CannotTarget = "cannotTarget",
  CannotUse = "cannotUse",
  ChopGreen = "chopGreen",
  ChopRed = "chopRed",
  DefaultEnemy = "defaultEnemy",
  DefaultFriends = "defaultFriends",
  Default = "default",
  Impossible = "impossible",
  MagicUseBlue = "magicUseBlue",
  MagicUseGreen = "magicUseGreen",
  MagicUseRed = "magicUseRed",
  MagicUseViolet = "magicUseViolet",
  MiniAttackGreen1 = "miniAttackGreen1",
  MiniAttackGreen = "miniAttackGreen",
  MiniAttackRed1 = "miniAttackRed1",
  MiniAttackRed = "miniAttackRed",
  MiniAttackYellow = "miniAttackYellow",
  MiniBuildGreen = "miniBuildGreen",
  MiniBuildRed = "miniBuildRed",
  MiniCannot = "miniCannot",
  MiniChopGreen = "miniChopGreen",
  MiniChopRed = "miniChopRed",
  MiniDefaultAdd = "miniDefaultAdd",
  MiniDefaultSubtract = "miniDefaultSubtract",
  MiniEatFood = "miniEatFood",
  MiniImpossible = "miniImpossible",
  MiniMoveDown = "miniMoveDown",
  MiniMoveLeft = "miniMoveLeft",
  MiniMoveRight = "miniMoveRight",
  MiniMoveUp = "miniMoveUp",
  MiniPickaxeGreen = "miniPickaxeGreen",
  MiniPickaxeRed = "miniPickaxeRed",
  MiniPossible = "miniPossible",
  MiniPotionBlue = "miniPotionBlue",
  MiniPotionGreen = "miniPotionGreen",
  MiniPotionPurple = "miniPotionPurple",
  MiniPotionRed = "miniPotionRed",
  MiniQuestionGreen = "miniQuestionGreen",
  MiniQuestionYellow = "miniQuestionYellow",
  MiniScytheGreen = "miniScytheGreen",
  MiniScytheRed = "miniScytheRed",
  MiniSettingsGreen = "miniSettingsGreen",
  MiniSettingsRed = "miniSettingsRed",
  MiniSettingsYellow = "miniSettingsYellow",
  MiniShieldGreen = "miniShieldGreen",
  MiniShieldRed = "miniShieldRed",
  MoveDown = "moveDown",
  MoveLeft = "moveLeft",
  MoveRight = "moveRight",
  MoveUp = "moveUp",
  PickaxeGreen = "pickaxeGreen",
  PickaxeRed = "pickaxeRed",
  Possible = "possible",
  PotionBlue = "potionBlue",
  PotionGreen = "potionGreen",
  PotionPurple = "potionPurple",
  PotionRed = "potionRed",
  QuestionGreen = "questionGreen",
  QuestionYellow = "questionYellow",
  ScytheGreen = "scytheGreen",
  ScytheRed = "scytheRed",
  SettingsGreen = "settingsGreen",
  SettingsRed = "settingsRed",
  SettingsYellow = "settingsYellow",
  ShieldGreen = "shieldGreen",
  ShieldRed = "shieldRed",
  Subtract = "subtract",
  TargetMoveA = "targetMoveA",
  TargetMoveB = "targetMoveB"
}

export class CursorHandler {
  // noinspection SpellCheckingInspection
  private readonly cursors: Record<CursorType, string> = {
    [CursorType.Add]: "Cursor Add",
    [CursorType.AttackEnemy]: "Cursor Attack Enemy",
    [CursorType.AttackFriends]: "Cursor Attack Friends",
    [CursorType.AttackGreen]: "Cursor Attack Green",
    [CursorType.AttackRed]: "Cursor Attack Red",
    [CursorType.AttackYellow]: "Cursor Attack Yellow",
    [CursorType.BuildGreen]: "Cursor Build Green",
    [CursorType.BuildRed]: "Cursor Build Red",
    [CursorType.CannotTarget]: "Cursor Cannot Target",
    [CursorType.CannotUse]: "Cursor Cannot Use",
    [CursorType.ChopGreen]: "Cursor Chop Green",
    [CursorType.ChopRed]: "Cursor Chop Red",
    [CursorType.DefaultEnemy]: "Cursor Default Enemy",
    [CursorType.DefaultFriends]: "Cursor Default Friends",
    [CursorType.Default]: "Cursor Default",
    [CursorType.Impossible]: "Cursor impossible",
    [CursorType.MagicUseBlue]: "Cursor Magic Use Blue",
    [CursorType.MagicUseGreen]: "Cursor Magic Use Green",
    [CursorType.MagicUseRed]: "Cursor Magic Use Red",
    [CursorType.MagicUseViolet]: "Cursor Magic Use Violet",
    [CursorType.MiniAttackGreen1]: "Cursor Mini Attack Green-1",
    [CursorType.MiniAttackGreen]: "Cursor Mini Attack Green",
    [CursorType.MiniAttackRed1]: "Cursor Mini Attack Red-1",
    [CursorType.MiniAttackRed]: "Cursor Mini Attack Red",
    [CursorType.MiniAttackYellow]: "Cursor Mini Attack Yellow",
    [CursorType.MiniBuildGreen]: "Cursor Mini Build Green",
    [CursorType.MiniBuildRed]: "Cursor Mini Build Red",
    [CursorType.MiniCannot]: "Cursor Mini Cannot",
    [CursorType.MiniChopGreen]: "Cursor Mini Chop Green",
    [CursorType.MiniChopRed]: "Cursor Mini Chop Red",
    [CursorType.MiniDefaultAdd]: "Cursor Mini Default Add",
    [CursorType.MiniDefaultSubtract]: "Cursor Mini Default Substract",
    [CursorType.MiniEatFood]: "Cursor Mini Eat Food",
    [CursorType.MiniImpossible]: "Cursor Mini Impossible",
    [CursorType.MiniMoveDown]: "Cursor Mini Move Down",
    [CursorType.MiniMoveLeft]: "Cursor Mini Move Left",
    [CursorType.MiniMoveRight]: "Cursor Mini Move Right",
    [CursorType.MiniMoveUp]: "Cursor Mini Move Up",
    [CursorType.MiniPickaxeGreen]: "Cursor Mini Pickaxe Green",
    [CursorType.MiniPickaxeRed]: "Cursor Mini Pickaxe Red",
    [CursorType.MiniPossible]: "Cursor Mini Possible",
    [CursorType.MiniPotionBlue]: "Cursor Mini Potion Blue",
    [CursorType.MiniPotionGreen]: "Cursor Mini Potion Green",
    [CursorType.MiniPotionPurple]: "Cursor Mini Potion Purple",
    [CursorType.MiniPotionRed]: "Cursor Mini Potion Red",
    [CursorType.MiniQuestionGreen]: "Cursor Mini Question Green",
    [CursorType.MiniQuestionYellow]: "Cursor Mini Question Yellow",
    [CursorType.MiniScytheGreen]: "Cursor Mini Scythe Green",
    [CursorType.MiniScytheRed]: "Cursor Mini Scythe Red",
    [CursorType.MiniSettingsGreen]: "Cursor Mini Settings Green",
    [CursorType.MiniSettingsRed]: "Cursor Mini Settings Red",
    [CursorType.MiniSettingsYellow]: "Cursor Mini Settings Yellow",
    [CursorType.MiniShieldGreen]: "Cursor Mini Shield Green",
    [CursorType.MiniShieldRed]: "Cursor Mini Shield Red",
    [CursorType.MoveDown]: "Cursor Move Down",
    [CursorType.MoveLeft]: "Cursor Move Left",
    [CursorType.MoveRight]: "Cursor Move Right",
    [CursorType.MoveUp]: "Cursor Move Up",
    [CursorType.PickaxeGreen]: "Cursor Pickaxe Green",
    [CursorType.PickaxeRed]: "Cursor Pickaxe Red",
    [CursorType.Possible]: "Cursor possible",
    [CursorType.PotionBlue]: "Cursor Potion Blue",
    [CursorType.PotionGreen]: "Cursor Potion Green",
    [CursorType.PotionPurple]: "Cursor Potion Purple",
    [CursorType.PotionRed]: "Cursor Potion Red",
    [CursorType.QuestionGreen]: "Cursor Question Green",
    [CursorType.QuestionYellow]: "Cursor Question Yellow",
    [CursorType.ScytheGreen]: "Cursor Scythe Green",
    [CursorType.ScytheRed]: "Cursor Scythe Red",
    [CursorType.SettingsGreen]: "Cursor Settings Green",
    [CursorType.SettingsRed]: "Cursor Settings Red",
    [CursorType.SettingsYellow]: "Cursor Settings Yellow",
    [CursorType.ShieldGreen]: "Cursor Shield Green",
    [CursorType.ShieldRed]: "Cursor Shield Red",
    [CursorType.Subtract]: "Cursor Subtract",
    [CursorType.TargetMoveA]: "Cursor Target Move A",
    [CursorType.TargetMoveB]: "Cursor Target Move B"
  };

  private currentCursor?: string;

  constructor(private readonly scene: Phaser.Scene) {
    new LockedCursorHandler(scene, this);
    this.setupCursor();
  }

  private setupCursor() {
    this.setCursor(CursorType.Default);
  }

  setCursor(cursorType: CursorType) {
    const cursorName = this.cursors[cursorType];
    this.currentCursor = this.getRawCursorUrl(cursorName);
    this.scene.input.setDefaultCursor(this.getCursorUrl(cursorName));
  }

  private getRawCursorUrl(cursor: string): string {
    return `assets/probable-waffle/input/cursors/${cursor}.cur`;
  }

  private getCursorUrl(cursor: string): string {
    return `url("${this.getRawCursorUrl(cursor)}"), auto`;
  }

  getCurrentCursorUrl(): string {
    return this.currentCursor || this.getRawCursorUrl(this.cursors.default);
  }
}
