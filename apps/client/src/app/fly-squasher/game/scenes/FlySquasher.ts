// You can write more code here

/* START OF COMPILED CODE */

import Croissants from "../prefabs/Croissants";
import Fly from "../prefabs/Fly";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FlySquasher extends Phaser.Scene {

	constructor() {
		super("FlySquasher");

		/* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// croissants
		const croissants = new Croissants(this, 148, 302);
		this.add.existing(croissants);

		// fly
		const fly = new Fly(this, 299, 150);
		this.add.existing(fly);

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

  // Write your code here

  create() {
    this.editorCreate();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
