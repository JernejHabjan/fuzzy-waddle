import { LockedCursorHandler } from "./locked-cursor.handler";

export class CursorHandler {
  private readonly cursors = {
    add: "Cursor Add",
    attackEnemy: "Cursor Attack Enemy",
    attackFriends: "Cursor Attack Friends",
    attackGreen: "Cursor Attack Green",
    attackRed: "Cursor Attack Red",
    attackYellow: "Cursor Attack Yellow",
    buildGreen: "Cursor Build Green",
    buildRed: "Cursor Build Red",
    cannotTarget: "Cursor Cannot Target",
    cannotUse: "Cursor Cannot Use",
    chopGreen: "Cursor Chop Green",
    chopRed: "Cursor Chop Red",
    defaultEnemy: "Cursor Default Enemy",
    defaultFriends: "Cursor Default Friends",
    default: "Cursor Default",
    impossible: "Cursor impossible",
    magicUseBlue: "Cursor Magic Use Blue",
    magicUseGreen: "Cursor Magic Use Green",
    magicUseRed: "Cursor Magic Use Red",
    magicUseViolet: "Cursor Magic Use Violet",
    miniAttackGreen1: "Cursor Mini Attack Green-1",
    miniAttackGreen: "Cursor Mini Attack Green",
    miniAttackRed1: "Cursor Mini Attack Red-1",
    miniAttackRed: "Cursor Mini Attack Red",
    miniAttackYellow: "Cursor Mini Attack Yellow",
    miniBuildGreen: "Cursor Mini Build Green",
    miniBuildRed: "Cursor Mini Build Red",
    miniCannot: "Cursor Mini Cannot",
    miniChopGreen: "Cursor Mini Chop Green",
    miniChopRed: "Cursor Mini Chop Red",
    miniDefaultAdd: "Cursor Mini Default Add",
    miniDefaultSubstract: "Cursor Mini Default Substract",
    miniEatFood: "Cursor Mini Eat Food",
    miniImpossible: "Cursor Mini Impossible",
    miniMoveDown: "Cursor Mini Move Down",
    miniMoveLeft: "Cursor Mini Move Left",
    miniMoveRight: "Cursor Mini Move Right",
    miniMoveUp: "Cursor Mini Move Up",
    miniPickaxeGreen: "Cursor Mini Pickaxe Green",
    miniPickaxeRed: "Cursor Mini Pickaxe Red",
    miniPossible: "Cursor Mini Possible",
    miniPotionBlue: "Cursor Mini Potion Blue",
    miniPotionGreen: "Cursor Mini Potion Green",
    miniPotionPurple: "Cursor Mini Potion Purple",
    miniPotionRed: "Cursor Mini Potion Red",
    miniQuestionGreen: "Cursor Mini Question Green",
    miniQuestionYellow: "Cursor Mini Question Yellow",
    miniScytheGreen: "Cursor Mini Scythe Green",
    miniScytheRed: "Cursor Mini Scythe Red",
    miniSettingsGreen: "Cursor Mini Settings Green",
    miniSettingsRed: "Cursor Mini Settings Red",
    miniSettingsYellow: "Cursor Mini Settings Yellow",
    miniShieldGreen: "Cursor Mini Shield Green",
    miniShieldRed: "Cursor Mini Shield Red",
    moveDown: "Cursor Move Down",
    moveLeft: "Cursor Move Left",
    moveRight: "Cursor Move Right",
    moveUp: "Cursor Move Up",
    pickaxeGreen: "Cursor Pickaxe Green",
    pickaxeRed: "Cursor Pickaxe Red",
    possible: "Cursor possible",
    potionBlue: "Cursor Potion Blue",
    potionGreen: "Cursor Potion Green",
    potionPurple: "Cursor Potion Purple",
    potionRed: "Cursor Potion Red",
    questionGreen: "Cursor Question Green",
    questionYellow: "Cursor Question Yellow",
    scytheGreen: "Cursor Scythe Green",
    scytheRed: "Cursor Scythe Red",
    settingsGreen: "Cursor Settings Green",
    settingsRed: "Cursor Settings Red",
    settingsYellow: "Cursor Settings Yellow",
    shieldGreen: "Cursor Shield Green",
    shieldRed: "Cursor Shield Red",
    subtract: "Cursor Subtract",
    targetMoveA: "Cursor Target Move A",
    targetMoveB: "Cursor Target Move B"
  };

  private currentCursor?: string;

  constructor(private readonly scene: Phaser.Scene) {
    new LockedCursorHandler(scene, this);
    this.setupCursor();
  }

  private setupCursor() {
    this.currentCursor = this.getRawCursorUrl(this.cursors.default);
    this.scene.input.setDefaultCursor(this.getCursorUrl(this.cursors.default));
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
