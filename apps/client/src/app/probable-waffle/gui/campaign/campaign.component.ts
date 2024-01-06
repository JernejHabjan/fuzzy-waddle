import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { ComingSoonComponent } from "../coming-soon/coming-soon.component";

@Component({
  selector: "fuzzy-waddle-campaign",
  templateUrl: "./campaign.component.html",
  styleUrls: ["./campaign.component.scss"],
  standalone: true,
  imports: [CommonModule, HomeNavComponent, ComingSoonComponent]
})
export class CampaignComponent {}
