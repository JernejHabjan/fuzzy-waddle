import {Component} from '@angular/core';
import {AuthService} from "../../../auth/auth.service";
import {faUser} from '@fortawesome/free-solid-svg-icons';
import {faGoogle} from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'fuzzy-waddle-home-page-nav',
  templateUrl: './home-page-nav.component.html',
  styleUrls: ['./home-page-nav.component.scss']
})
export class HomePageNavComponent {
  faUser = faUser;
  faGoogle = faGoogle;
  constructor(public authService: AuthService) {}
}
