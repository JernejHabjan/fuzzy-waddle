import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { Subscription } from "rxjs";

export class GameObjectSelectionHandler {
  private sub!: Subscription;
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindSelectionInput();
    this.scene.onDestroy.subscribe(() => this.destroy());
  }

  private bindSelectionInput() {
    this.sub = this.scene.communicator.selection!.on.subscribe((selection) => {
      switch (selection.type) {
        case "deselect":
          console.log("deselect");
          break;
        case "singleSelect":
          console.log("singleSelect", selection.data!.selected);
          break;
        case "terrainSelect":
          console.log("terrainSelect", selection.data!.terrainSelected);
          break;
        case "multiSelect":
          console.log("multiSelect", selection.data!.selectedArea);
          break;
        case "multiSelectPreview":
          // not logging as it's too many log events console.log("multiSelectPreview");
          break;
        default:
          throw new Error("unknown selection type");
      }
    });
  }

  private destroy() {
    this.sub.unsubscribe();
  }
}
