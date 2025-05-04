// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ToxicFrog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 24, y ?? 47, texture || "animals", frame ?? "frog/BlueBlue/idle/ToxicFrogBlueBlue_Idle-0.png");

    this.setInteractive(new Phaser.Geom.Circle(24, 24, 16.15349097742945), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6793875931157105);
    this.play("ToxicFrogBlueBlue_Idle");

    /* START-USER-CTR-CODE */
    this.assignType();
    this.bindClickEvent();
    this.playAnimation("idle");
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private frogType?: ToxicFrogType;
  private assignType() {
    const frogTypes = Object.keys(ToxicFrogAnimPrefixes) as ToxicFrogType[];
    const randomIndex = Math.floor(Math.random() * frogTypes.length);
    this.frogType = frogTypes[randomIndex];
  }

  private bindClickEvent() {
    this.on("pointerdown", this.handlePointerDown, this);
  }

  private handlePointerDown() {
    const actions: ("hop" | "attack")[] = ["hop", "attack"];
    const randomAction = Phaser.Math.RND.pick(actions);
    this.playAnimation(randomAction);
  }

  private playAnimation(type: "idle" | "hop" | "attack") {
    if (!this.frogType) return;

    const prefix = ToxicFrogAnimPrefixes[this.frogType];
    const animKey = `${prefix}_${this.capitalize(type)}`;

    this.play(animKey);

    if (type !== "idle") {
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.playAnimation("idle");
      });
    }
  }
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.off("pointerdown", this.handlePointerDown, this);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

type ToxicFrogType = keyof typeof ToxicFrogAnimPrefixes;
const ToxicFrogAnimPrefixes = {
  BLUEBLUE: "ToxicFrogBlueBlue",
  BLUEBROWN: "ToxicFrogBlueBrown",
  GREENBLUE: "ToxicFrogGreenBlue",
  GREENBROWN: "ToxicFrogGreenBrown",
  PURPLEBLUE: "ToxicFrogPurpleBlue",
  PURPLEWHITE: "ToxicFrogPurpleWhite"
} as const;
// You can write more code here
