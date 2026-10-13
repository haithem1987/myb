import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NavBarComponent } from '../LandingPage/NavBar/NavBar.component';

interface HomeCard {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'myb-front-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NavBarComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  @ViewChild('heroSection', { static: true })
  private heroSection!: ElementRef<HTMLElement>;

  readonly problems: HomeCard[] = [
    { icon: 'bi-shield-check', title: 'HOME.PROBLEMS.ERROR_TITLE', text: 'HOME.PROBLEMS.ERROR_TEXT' },
    { icon: 'bi-hourglass-split', title: 'HOME.PROBLEMS.TIME_TITLE', text: 'HOME.PROBLEMS.TIME_TEXT' },
    { icon: 'bi-people', title: 'HOME.PROBLEMS.TRANSPARENCY_TITLE', text: 'HOME.PROBLEMS.TRANSPARENCY_TEXT' },
  ];

  readonly solutions: Array<HomeCard & { image: string; alt: string }> = [
    { icon: 'bi-buildings', title: 'HOME.SOLUTION.UNITS_TITLE', text: 'HOME.SOLUTION.UNITS_TEXT', image: '/assets/docs/myb-documents-overview.png', alt: 'HOME.SOLUTION.UNITS_ALT' },
    { icon: 'bi-folder2-open', title: 'HOME.SOLUTION.DOCUMENTS_TITLE', text: 'HOME.SOLUTION.DOCUMENTS_TEXT', image: '/assets/docs/myb-digital-transition.png', alt: 'HOME.SOLUTION.DOCUMENTS_ALT' },
    { icon: 'bi-receipt', title: 'HOME.SOLUTION.FUNDS_TITLE', text: 'HOME.SOLUTION.FUNDS_TEXT', image: '/assets/docs/myb-documents-overview.png', alt: 'HOME.SOLUTION.FUNDS_ALT' },
    { icon: 'bi-calendar2-check', title: 'HOME.SOLUTION.MEETINGS_TITLE', text: 'HOME.SOLUTION.MEETINGS_TEXT', image: '/assets/docs/myb-digital-transition.png', alt: 'HOME.SOLUTION.MEETINGS_ALT' },
  ];

  readonly steps: HomeCard[] = [
    { icon: 'bi-house-add', title: 'HOME.STEPS.CREATE_TITLE', text: 'HOME.STEPS.CREATE_TEXT' },
    { icon: 'bi-person-plus', title: 'HOME.STEPS.INVITE_TITLE', text: 'HOME.STEPS.INVITE_TEXT' },
    { icon: 'bi-check2-square', title: 'HOME.STEPS.MANAGE_TITLE', text: 'HOME.STEPS.MANAGE_TEXT' },
  ];

  readonly securityItems: HomeCard[] = [
    { icon: 'bi-geo-alt', title: 'HOME.SECURITY.HOSTING_TITLE', text: 'HOME.SECURITY.HOSTING_TEXT' },
    { icon: 'bi-lock', title: 'HOME.SECURITY.PRIVACY_TITLE', text: 'HOME.SECURITY.PRIVACY_TEXT' },
    { icon: 'bi-cloud-check', title: 'HOME.SECURITY.BACKUP_TITLE', text: 'HOME.SECURITY.BACKUP_TEXT' },
    { icon: 'bi-chat-dots', title: 'HOME.SECURITY.SUPPORT_TITLE', text: 'HOME.SECURITY.SUPPORT_TEXT' },
  ];

  readonly faqs = ['TRIAL', 'PAYMENT', 'DATA', 'SUPPORT', 'COST', 'CANCEL'];
  readonly testimonials: HomeCard[] = [];
  annualBilling = false;
  showMobileCta = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showMobileCta = this.heroSection.nativeElement.getBoundingClientRect().bottom <= 64;
  }

  setBillingPeriod(annual: boolean): void {
    this.annualBilling = annual;
  }
}