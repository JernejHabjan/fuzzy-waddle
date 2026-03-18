// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { ResearchComponent } from "../../entity/components/research/research-component";
import { Subscription } from "rxjs";
/* END-USER-IMPORTS */

export default class ProgressBar extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 50.1919575967303, y ?? 5.992859840393066);

    // background
    const background = scene.add.nineslice(
      -13,
      -2,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      74,
      8,
      2,
      2,
      2,
      2
    );
    this.add(background);

    // progress
    const progress = scene.add.rectangle(-49, -2, 72, 4);
    progress.scaleY = 1.4;
    progress.setOrigin(0, 0.5);
    progress.isFilled = true;
    progress.fillColor = 93541;
    this.add(progress);

    // out_of_100
    const out_of_100 = scene.add.text(-10, -3, "", {});
    out_of_100.setOrigin(0.5, 0.5);
    out_of_100.text = " / 100";
    out_of_100.setStyle({ align: "center", fontFamily: "disposabledroid", fontSize: "10px", resolution: 10 });
    this.add(out_of_100);

    // nr
    const nr = scene.add.text(-24, -3, "", {});
    nr.setOrigin(0.5, 0.5);
    nr.text = "1";
    nr.setStyle({ align: "right", fontFamily: "disposabledroid", fontSize: "10px", resolution: 10 });
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
  private readonly maxWidth = 72;
  private productionProgressSubscription?: Subscription;
  private researchProgressSubscription?: Subscription;
  private researchCancelledSubscription?: Subscription;
  private researchCompletedSubscription?: Subscription;

  setProgressBar(actor: Phaser.GameObjects.GameObject) {
    // Clean up any existing subscriptions
    this.cleanActor();

    // Check for ProductionComponent
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent) {
      this.subscribeToProduction(productionComponent);
    }

    // Check for ResearchComponent
    const researchComponent = getActorComponent(actor, ResearchComponent);
    if (researchComponent) {
      this.subscribeToResearch(researchComponent);
    }

    // If neither component exists, hide the progress bar
    if (!productionComponent && !researchComponent) {
      this.visible = false;
    }
  }

  private subscribeToProduction(productionComponent: ProductionComponent) {
    // Subscribe to production progress updates
    this.productionProgressSubscription = productionComponent.productionProgressObservable.subscribe((event) => {
      const { progressInPercentage } = event;
      this.handleProgressUpdate(progressInPercentage);
    });

    // Set initial state based on whether production is ongoing
    if (productionComponent.isProducing) {
      const percentage = productionComponent.getCurrentProgress() ?? 0;
      this.handleProgressUpdate(percentage);
    } else {
      this.visible = false;
    }
  }

  private subscribeToResearch(researchComponent: ResearchComponent) {
    // Subscribe to research progress updates
    this.researchProgressSubscription = researchComponent.researchProgress.subscribe((event) => {
      const { progress } = event;
      this.handleProgressUpdate(progress);
    });

    // Subscribe to research cancelled - hide progress bar
    this.researchCancelledSubscription = researchComponent.researchCancelled.subscribe(() => {
      this.visible = false;
    });

    // Subscribe to research completed - hide progress bar
    this.researchCompletedSubscription = researchComponent.researchCompleted.subscribe(() => {
      this.visible = false;
    });

    // Set initial state based on whether research is ongoing
    if (researchComponent.currentResearchType) {
      const progress = researchComponent.getResearchProgress(researchComponent.currentResearchType);
      this.handleProgressUpdate(progress);
    } else {
      this.visible = false;
    }
  }

  private handleProgressUpdate(progressInPercentage: number) {
    this.visible = progressInPercentage > 0 && progressInPercentage < 100;
    this.setPercentage(progressInPercentage);
  }

  cleanActor() {
    this.productionProgressSubscription?.unsubscribe();
    this.researchProgressSubscription?.unsubscribe();
    this.researchCancelledSubscription?.unsubscribe();
    this.researchCompletedSubscription?.unsubscribe();
    this.visible = false;
  }

  private setPercentage(percentage: number) {
    if (!this.visible) return;
    this.progress.width = this.maxWidth * (percentage / 100);
    this.nr.text = Math.round(percentage).toString();
  }

  override destroy(fromScene?: boolean) {
    this.cleanActor(); // Clean up subscription
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
