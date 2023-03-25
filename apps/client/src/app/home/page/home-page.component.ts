import { Component } from '@angular/core';
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
  probableWaffle: DisplayGame = {
    name: 'Probable Waffle',
    description: 'A real-time strategy game',
    image: 'probable-waffle.webp',
    route: 'probable-waffle'
  };
  displayGames: DisplayGame[] = [
    this.probableWaffle,
    {
      name: 'Little Muncher',
      description: 'Infinite scroller',
      image: 'little-muncher.webp',
      route: 'little-muncher'
    }
  ];

  constructor(public authService: AuthService, public dbAccessTestService: DbAccessTestService) {}
}
