import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export type DisplayGame = {
  name: string;
  description: string;
  image: string;
  route: string;
};

@Component({
  selector: 'fuzzy-waddle-home-page',
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
  constructor(public router: Router) {}
  navigateProfile() {
    this.router.navigate(['profile']);
  }
}
