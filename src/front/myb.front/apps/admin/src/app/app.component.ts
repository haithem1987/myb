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
    // Initialize language with localStorage persistence
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Add supported languages
    this.translate.addLangs(['fr', 'en']);
    
    // Set French as the default language
    this.translate.setDefaultLang('fr');
    
    // Check localStorage for saved language preference
    const savedLang = localStorage.getItem('language');
    
    if (savedLang && this.translate.getLangs().includes(savedLang)) {
      // Use saved language preference
      this.translate.use(savedLang);
    } else {
      // No saved preference, use French as default
      this.translate.use('fr');
      localStorage.setItem('language', 'fr');
    }

    // Subscribe to language changes to save preference
    this.translate.onLangChange.subscribe((event) => {
      localStorage.setItem('language', event.lang);
    });
  }
}

