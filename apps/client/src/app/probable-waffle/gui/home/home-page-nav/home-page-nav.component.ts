import { Component } from "@angular/core";
import { environment } from "../../../../../environments/environment";

@Component({
  selector: "probable-waffle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"]
})
export class HomePageNavComponent {
  protected enabledCampaign = !environment.production; // todo
  protected enabledProgress = !environment.production; // todo
  protected enabledOptions: boolean = !environment.production; // todo
}
