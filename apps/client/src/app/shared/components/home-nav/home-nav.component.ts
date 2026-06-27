import { Component, computed, input } from "@angular/core";

import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "fuzzy-waddle-home-nav",
  templateUrl: "./home-nav.component.html",
  styleUrls: ["./home-nav.component.scss"],
  imports: [RouterLink, FaIconComponent]
})
export class HomeNavComponent {
  readonly routerLink = input<string>("/");
  readonly title = input<string>("Fuzzy Waddle");
  readonly imgSrc = input<string>("assets/icons/fuzzy-waddle.svg");
  readonly showBack = input(false);
  readonly hasActions = input(false);
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly isRootLink = computed(() => {
    const link = this.routerLink().trim();
    return link === "" || link === "/";
  });
}
