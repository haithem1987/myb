import { Component, OnInit } from '@angular/core';
import '@angular/localize/init';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { NxWelcomeComponent } from './nx-welcome.component';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
import {
  NotificationService,
  ToastsContainerComponent,
} from '@myb-front/shared-ui';
@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule, ToastsContainerComponent],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(
    private keycloakService: KeycloakService,
    private router: Router,
    private translate: TranslateService,
    private location: Location,
    private notificationService: NotificationService
  ) {
    this.translate.addLangs(['en', 'fr']);
    this.translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    const browserLang: any = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
    this.notificationService.startConnection();
  }
  private removeQueryParamsFromUrl(): void {
    const urlWithoutParams = this.location.path().split('?')[0];
    this.location.replaceState(urlWithoutParams);
  }
  private logUserProfile(): void {
    const profile = this.keycloakService.getProfile();
    console.log('User Profile:', profile);
  }
}
