// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/building/production/production-component";
import { Subscription } from "rxjs";
/* END-USER-IMPORTS */

export default class ProgressBar extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 50.1919575967303, y ?? 5.992859840393066);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // background
    const background = scene.add.nineslice(
      -25.191959456710947,
      -2.992859833650245,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      50,
      5,
      2,
      2,
      2,
      2
    );
    this.add(background);

    // progress
    const progress = scene.add.rectangle(-49, -3, 48, 2);
    progress.scaleY = 1.4;
    progress.setOrigin(0, 0.5);
    progress.isFilled = true;
    progress.fillColor = 93541;
    this.add(progress);

    // out_of_100
    const out_of_100 = scene.add.text(-22.191959456710947, -2.992859833650245, "", {});
    out_of_100.setOrigin(0.5, 0.5);
    out_of_100.text = " / 100";
    out_of_100.setStyle({ align: "center", fontSize: "4px", resolution: 4 });
    this.add(out_of_100);

    // nr
    const nr = scene.add.text(-32.19195945671095, -2.992859833650245, "", {});
    nr.setOrigin(0.5, 0.5);
    nr.text = "1";
    nr.setStyle({ align: "right", fontSize: "4px", resolution: 4 });
    this.add(nr);

    this.progress = progress;
    this.nr = nr;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private progress: Phaser.GameObjects.Rectangle;
  private nr: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly maxWidth = 48;
  private productionProgressSubscription?: Subscription;

  setProgressBar(actor: Phaser.GameObjects.GameObject) {
    // todo make this generic progress bar, this setter should pass in subject and currentPercentage, so we can subscribe to it
    // Retrieve the ProductionComponent from the actor
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (!productionComponent) {
      this.cleanActor();
      return;
    }

    // Clean up any existing subscription
    this.productionProgressSubscription?.unsubscribe();

    // Subscribe to production progress updates
    this.productionProgressSubscription = productionComponent.productionProgressObservable.subscribe((event) => {
      const { progressInPercentage } = event;
      this.handleProductionProgressUpdate(progressInPercentage);
    });

    // Set initial state based on whether production is ongoing
    if (productionComponent.isProducing()) {
      const percentage = productionComponent.getCurrentProgress() ?? 0;
      this.handleProductionProgressUpdate(percentage);
    } else {
      this.visible = false;
      // do not clear subscription
    }
  }

  private handleProductionProgressUpdate(progressInPercentage: number) {
    this.visible = progressInPercentage > 0 && progressInPercentage < 100;
    this.setPercentage(progressInPercentage);
  }

  cleanActor() {
    this.productionProgressSubscription?.unsubscribe();
    this.visible = false;
  }

  private setPercentage(percentage: number) {
    if (!this.visible) return;
    this.progress.width = this.maxWidth * (percentage / 100);
    this.nr.text = Math.round(percentage).toString();
  }

  destroy(fromScene?: boolean) {
    this.cleanActor(); // Clean up subscription
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
