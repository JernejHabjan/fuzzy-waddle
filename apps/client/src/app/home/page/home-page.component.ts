import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../auth/auth.service';
import { DbAccessTestService } from '../../data-access/db-access-test/db-access-test.service';

export type DisplayGame = {
  name: string;
  description: string;
  image: string;
  route: string;
};

@Component({
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  faUser = faUser;
  probableWaffle: DisplayGame = {
    name: 'Probable Waffle',
    description: 'A real-time strategy game',
    image: 'probable-waffle.jpg',
    route: 'probable-waffle'
  };
  displayGames: DisplayGame[] = [
    this.probableWaffle,
    {
      name: 'Little Muncher',
      description: 'Infinite scroller',
      image: 'little-muncher.jpg',
      route: 'little-muncher'
    }
  ];
  constructor(public router: Router, public authService: AuthService, public dbAccessTestService: DbAccessTestService) {}
  async toProfile() {
    await this.router.navigate(['profile']);
  }
}
