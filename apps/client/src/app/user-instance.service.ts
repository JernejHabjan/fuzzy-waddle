import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserInstanceService {
  isLoggedIn = false;
  getPageTheme = () => 'light';
  getPreferredGames = () => ['probable-waffle'];
}
