import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class LandingPageComponent {
  contactInfo: ContactInfo = {
    location: 'Paris, France',
    email: 'Forlink@gmail.com',
    phone: '+216 22 222 222',
  };

  aboutSection: FooterSection = {
    title: 'About',
    content: `M.Y.B (Manage Your Business) is an all-in-one platform designed to simplify business operations. From invoicing to time management and document handling, M.Y.B offers intuitive tools that enhance productivity for companies of all sizes, helping you focus on growth.`,
    module2: '',
    module3: '',
  };

  servicesSection: FooterSection = {
    title: 'Services',
    content: 'Timesheet | Invoice | Document',
    module2: 'TimeSheet',
    module3: 'Documents',
  };

  copyRightText: string = '© M.Y.B 2024, all rights reserved';
}
