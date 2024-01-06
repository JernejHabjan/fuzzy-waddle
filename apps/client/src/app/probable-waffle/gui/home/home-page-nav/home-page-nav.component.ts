import { Component } from "@angular/core";
import { environment } from "../../../../../environments/environment";
import { CommonModule } from "@angular/common";
import { HomeNavComponent } from "../../../../shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: "probable-waffle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"],
  standalone: true,
  imports: [CommonModule, HomeNavComponent, RouterLink]
})
export class HomePageNavComponent {
  protected enabledCampaign = !environment.production; // todo
  protected enabledProgress = !environment.production; // todo
  protected enabledOptions: boolean = !environment.production; // todo
}
