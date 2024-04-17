import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppsSectionComponent } from './apps-section/apps-section.component';
import { NavBarComponent } from './NavBar/NavBar.component';
import { HeroSectionComponent } from './HeroSection/HeroSection.component';
import { FeaturesSectionComponent } from './FeaturesSection/FeaturesSection.component';
import { FooterSectionComponent } from './FooterSection/FooterSection.component';
import { ContactInfo, FooterSection } from './FooterSection/footer-data.model';

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
  ],
  templateUrl: './LandingPage.component.html',
  styleUrl: './LandingPage.component.css',
})
export class LandingPageComponent {
  contactInfo: ContactInfo = {
    location: 'Beijing, China',
    email: 'mohamed@gmail.com',
    phone: '+216 22 222 222',
  };

  aboutSection: FooterSection = {
    title: 'About',
    content: 'some text some text some text some text some text',
  };

  servicesSection: FooterSection = {
    title: 'Services',
    content: 'some text some text some text some text some text',
  };

  copyRightText: string = '© M.Y.B 2024, all rights reserved';
}
