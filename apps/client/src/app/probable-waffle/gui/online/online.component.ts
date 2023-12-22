import { Component } from "@angular/core";

@Component({
  selector: "fuzzy-waddle-online",
  templateUrl: "./online.component.html",
  styleUrls: ["./online.component.scss"]
})
export class OnlineComponent {
  protected selectedTab: string = "join";

  protected selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
