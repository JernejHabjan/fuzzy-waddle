import * as Phaser from 'phaser';

export class CursorHandler {
  public static readonly penCursor = 'url(https://labs.phaser.io/assets/input/cursors/pen.cur), pointer';
  private input!: Phaser.Input.InputPlugin;

  constructor(input: Phaser.Input.InputPlugin) {
  this.input = input;
  this.setupCursor();
  }

  private setupCursor(){
    this.input.setDefaultCursor('url(https://labs.phaser.io/assets/input/cursors/sc2/SC2-cursor.cur), pointer');
  }

  destroy(){
    this.input.setDefaultCursor('default');
  }
}
