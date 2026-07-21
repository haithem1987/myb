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
    content: `M.Y.B (Manage Your Business) is an all-in-one platform designed to simplify business operations. From invoicing to time management and document handling, M.Y.B offers intuitive tools that enhance productivity for companies of all sizes, helping you focus on growth.`,
    module2: '',
    module3: '',
  };

  servicesSection: FooterSection = {
    title: '',
    content: 'Timesheet | Invoice | Document',
    module2: 'TimeSheet',
    module3: 'Documents',
  };

  copyRightText: string = '';

  private destroy$ = new Subject<void>();

  constructor(private translate: TranslateService) {
    this.translate
      .get([
        'FOOTER_ABOUT_TITLE',
        'FOOTER_SERVICES_TITLE',
        'FOOTER_COPYRIGHT',
        'FOOTER_TAGLINE',
      ])
      .subscribe((translations: any) => {
        this.aboutSection = {
          ...this.aboutSection,
          title: translations['FOOTER_ABOUT_TITLE'],
        };
        this.servicesSection = {
          ...this.servicesSection,
          title: translations['FOOTER_SERVICES_TITLE'],
        };
        this.copyRightText = translations['FOOTER_COPYRIGHT'];
      });

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.translate
        .get([
          'FOOTER_ABOUT_TITLE',
          'FOOTER_SERVICES_TITLE',
          'FOOTER_COPYRIGHT',
        ])
        .subscribe((translations: any) => {
          this.aboutSection = {
            ...this.aboutSection,
            title: translations['FOOTER_ABOUT_TITLE'],
          };
          this.servicesSection = {
            ...this.servicesSection,
            title: translations['FOOTER_SERVICES_TITLE'],
          };
          this.copyRightText = translations['FOOTER_COPYRIGHT'];
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
