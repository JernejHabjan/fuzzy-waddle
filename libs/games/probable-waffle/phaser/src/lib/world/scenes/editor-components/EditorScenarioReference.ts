import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EditorScenarioReference {
  constructor(gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject = gameObject;
    (gameObject as any)["__EditorScenarioReference"] = this;

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  static getComponent(gameObject: Phaser.GameObjects.GameObject): EditorScenarioReference | undefined {
    return (gameObject as any)["__EditorScenarioReference"];
  }

  private gameObject: Phaser.GameObjects.GameObject;
  public scenarioId = "";
  public tags = "";

  /* START-USER-CODE */
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
