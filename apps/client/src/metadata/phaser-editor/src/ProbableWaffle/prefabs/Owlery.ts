// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Owlery extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 32, y ?? 176);

		this.setInteractive(new Phaser.Geom.Polygon("-29.409920175439797 -50.418387226250445 -30.78131747765149 -66.32659593190608 -21.181536362169638 -86.62327600463915 2.1322177754291545 -94.85165981790931 24.897412992143266 -82.50908409800407 32.57723788452874 -66.87515485279076 32 -48 27.36592813612431 -40.81860611076859 27.640207596566654 87.54418137624592 13.926234574449715 95.2240062686314 -13.227432009341815 95.77256518951606 -26.118566650131733 85.89850461359188 -25.295728268804716 -42.46428287342262"), Phaser.Geom.Polygon.Contains);

		// owlery_building
		const owlery_building = scene.add.image(0, -80, "factions", "buildings/skaduwee/owlery/owlery.png");
		this.add(owlery_building);

		// owl
		const owl = scene.add.sprite(3, -133.43393355052257, "factions", "buildings/skaduwee/owlery/owlery-owl/owlery-owl-0.png");
		owl.play("skaduwee_owlery_buildings/skaduwee/owlery/owlery-owl/owlery-owl");
		this.add(owl);

		/* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      owlery_building.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
