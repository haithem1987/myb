import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AppsSectionComponent } from './apps-section/apps-section.component';
import { NavBarComponent } from './NavBar/NavBar.component';
import { HeroSectionComponent } from './HeroSection/HeroSection.component';
import { FeaturesSectionComponent } from './FeaturesSection/FeaturesSection.component';
import { FooterSectionComponent } from './FooterSection/FooterSection.component';
import { ContactInfo, FooterSection } from './FooterSection/footer-data.model';
import { OverviewSectionComponent } from './overviewSection/overviewSection.component';

@Component({
  selector: 'myb-front-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    AppsSectionComponent,
    NavBarComponent,
    HeroSectionComponent,
    FeaturesSectionComponent,
    FooterSectionComponent,
    OverviewSectionComponent,
  ],
  templateUrl: './LandingPage.component.html',
  styleUrl: './LandingPage.component.css',
})
export class LandingPageComponent implements OnDestroy {
  contactInfo: ContactInfo = {
    location: 'Paris, France',
    email: 'Forlink@gmail.com',
    phone: '+216 22 222 222',
  };

  aboutSection: FooterSection = {
    title: '',
    content: '',
    module2: '',
    module3: '',
  };

  servicesSection: FooterSection = {
    title: '',
    content: '',
    module2: 'TimeSheet',
    module3: 'Documents',
  };

  copyRightText: string = '';

  private destroy$ = new Subject<void>();

  constructor(private translate: TranslateService) {
    this.updateFooterTranslations();

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateFooterTranslations();
    });
  }

  private updateFooterTranslations(): void {
    this.translate
      .get([
        'FOOTER_ABOUT_TITLE',
        'FOOTER_ABOUT_CONTENT',
        'FOOTER_SERVICES_TITLE',
        'FOOTER_SERVICES_CONTENT',
        'FOOTER_COPYRIGHT',
      ])
      .subscribe((translations: Record<string, string>) => {
        this.aboutSection = {
          ...this.aboutSection,
          title: translations['FOOTER_ABOUT_TITLE'],
          content: translations['FOOTER_ABOUT_CONTENT'],
        };
        this.servicesSection = {
          ...this.servicesSection,
          title: translations['FOOTER_SERVICES_TITLE'],
          content: translations['FOOTER_SERVICES_CONTENT'],
        };
        this.copyRightText = translations['FOOTER_COPYRIGHT'];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
