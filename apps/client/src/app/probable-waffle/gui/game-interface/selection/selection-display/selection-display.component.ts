import { Component, OnDestroy, OnInit } from "@angular/core";
import { GameObjectSelection, SceneCommunicatorService } from "../../../../communicators/scene-communicator.service";
import { Subscription } from "rxjs";

@Component({
  selector: "fuzzy-waddle-selection-display",
  templateUrl: "./selection-display.component.html",
  styleUrls: ["./selection-display.component.scss"]
})
export class SelectionDisplayComponent implements OnInit, OnDestroy {
  selection: GameObjectSelection[] = [];
  private selectionSubscription!: Subscription;

  ngOnDestroy(): void {
    this.selectionSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.selectionSubscription = SceneCommunicatorService.selectionChangedSubject.subscribe((selection) => {
      this.selection = selection;
    });
  }

  formatAtlasFileName(filename: string) {
    // replace "_" with " "
    return filename.replace(/_/g, " ");
  }

  select(s: GameObjectSelection) {
    this.selection = [s];
  }
}
