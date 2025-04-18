// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.05551516666625,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_left.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.1430606620102317 32.31764883917819 7.771672916088349 27.999566431209445 7.987577036486783 20.802762417928207 15.328317130033653 17.276328451420397 22.525121143314895 19.939145936334455 23.676609785439894 19.57930573567039 23.964481945971144 13.174150163850086 32.25214092239962 8.32127775981779 40.08532293572112 12.0946295618579 39.86941881532269 27.49579015027976 64.00034822622435 39.27972866304985 64.00034822622435 79.87320765351231 31.778287082044027 96.30014078583953 -0.1278715018992287 80.50501277398644"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8339116163194401);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // Write your code here.
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
