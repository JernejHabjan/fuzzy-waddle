import { Component, input } from "@angular/core";

import { RouterLink } from "@angular/router";

@Component({
  selector: "fuzzy-waddle-home-nav",
  templateUrl: "./home-nav.component.html",
  styleUrls: ["./home-nav.component.scss"],
  imports: [RouterLink]
})
export class HomeNavComponent {
  readonly routerLink = input<string>("/");
  readonly title = input<string>("Fuzzy Waddle");
  readonly imgSrc = input<string>("assets/icons/fuzzy-waddle.svg");
}
