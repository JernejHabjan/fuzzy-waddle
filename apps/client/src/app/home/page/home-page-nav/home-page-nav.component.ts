import { Component, inject } from "@angular/core";
import { AuthService } from "../../../auth/auth.service";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: "probable-waffle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"]
})
export class HomePageNavComponent {
  protected readonly faUser = faUser;
  protected readonly faGoogle = faGoogle;

  protected readonly authService = inject(AuthService);
}
