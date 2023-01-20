import { Component, NgZone, OnInit } from '@angular/core';
import { UserInstanceService } from './auth/user-instance.service';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';


@Component({
  selector: 'fuzzy-waddle-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{


  constructor(public userInstanceService: UserInstanceService, private ngZone: NgZone, private router: Router) {
  }

  ngOnInit(): void {
    // @ts-ignore
    window.onGoogleLibraryLoad = () => {
      console.log('Google\'s One-tap sign in script loaded!');

// @ts-ignore
      google.accounts.id.initialize({
        // Ref: https://developers.google.com/identity/gsi/web/reference/js-reference#IdConfiguration
        client_id: environment.googleClientId,
        callback: (res)=>this.userInstanceService.handleCredentialResponse(res), // Whatever function you want to trigger...
        auto_select: true,
        cancel_on_tap_outside: false
      });
// @ts-ignore
      window.google.accounts.id.renderButton(
// @ts-ignore
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }  // customization attributes
      );

      // OPTIONAL: In my case I want to redirect the user to an specific path.
      // @ts-ignore
      google.accounts.id.prompt((notification: PromptMomentNotification) => {
        console.log('Google prompt event triggered...');

        if (notification.getDismissedReason() === 'credential_returned') {
          this.ngZone.run(() => {
            // todo do we need navigate? this.router.navigate([''], { replaceUrl: true });
            console.log('Welcome back!');
          });
        }
      });
    };
  }


}
