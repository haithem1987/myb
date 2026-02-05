import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'admin';
  private translate = inject(TranslateService);

  ngOnInit(): void {
    // Set default language and add supported languages
    const browserLang = this.translate.getBrowserLang() || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(browserLang);
  }
}

