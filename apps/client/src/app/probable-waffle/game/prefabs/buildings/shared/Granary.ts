// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Granary extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 64, y ?? 96);

		this.setInteractive(new Phaser.Geom.Polygon("-34.05122565396334 -17.337910058391813 0.6195975292908713 -33.070888645750856 32.085554704008985 -18.211964424356196 32.66825761465191 17.04156166954094 -1.1285112026379238 33.35724316754289 -33.75987419864188 15.584804392933606"), Phaser.Geom.Polygon.Contains);

		// granaryCursor
		const granaryCursor = scene.add.image(0, -16, "outside", "architecture/blocks/doors_left.png");
		granaryCursor.visible = false;
		this.add(granaryCursor);

		// granaryFoundation1
		const granaryFoundation1 = scene.add.image(0, -16, "factions", "buildings/misc/ruins-flat/ruins-flat-1.png");
		granaryFoundation1.visible = false;
		granaryFoundation1.alpha = 0.5;
		this.add(granaryFoundation1);

		// granaryFoundation2
		const granaryFoundation2 = scene.add.image(0, -16, "outside", "architecture/blocks/doors_left.png");
		granaryFoundation2.visible = false;
		granaryFoundation2.alpha = 0.75;
		this.add(granaryFoundation2);

		// granaryLevel1
		const granaryLevel1 = scene.add.image(-0.5838393593655766, 14.490227145160631, "outside", "architecture/blocks/doors_left.png");
		granaryLevel1.setOrigin(0.49543875488244987, 0.7382048987857536);
		this.add(granaryLevel1);

		this.granaryCursor = granaryCursor;
		this.granaryFoundation1 = granaryFoundation1;
		this.granaryFoundation2 = granaryFoundation2;
		this.granaryLevel1 = granaryLevel1;

		/* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
	}

	private granaryCursor: Phaser.GameObjects.Image;
	private granaryFoundation1: Phaser.GameObjects.Image;
	private granaryFoundation2: Phaser.GameObjects.Image;
	private granaryLevel1: Phaser.GameObjects.Image;

	/* START-USER-CODE */
  override name = ObjectNames.Granary;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.granaryCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.granaryCursor.visible = progress === null;
    this.granaryLevel1.visible = progress === 100;
    this.granaryFoundation1.visible = progress !== null && progress < 50;
    this.granaryFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
