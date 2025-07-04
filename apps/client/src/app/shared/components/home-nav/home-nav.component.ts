import { Component, Input } from "@angular/core";

import { RouterLink } from "@angular/router";

@Component({
  selector: "fuzzy-waddle-home-nav",
  templateUrl: "./home-nav.component.html",
  styleUrls: ["./home-nav.component.scss"],
  imports: [RouterLink]
})
export class HomeNavComponent {
  @Input() routerLink: string = "/";
  @Input() title: string = "Fuzzy Waddle";
  @Input() imgSrc: string = "assets/icons/fuzzy-waddle.svg";
}
