import { Component } from "@angular/core";

import { RouterLink } from "@angular/router";

@Component({
  selector: "fuzzy-waddle-home-nav",
  templateUrl: "./home-nav.component.html",
  styleUrls: ["./home-nav.component.scss"],
  standalone: true,
  imports: [RouterLink]
})
export class HomeNavComponent {}
