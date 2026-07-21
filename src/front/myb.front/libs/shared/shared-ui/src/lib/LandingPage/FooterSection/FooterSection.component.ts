import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ContactInfo, FooterSection } from './footer-data.model';

@Component({
  selector: 'myb-front-footer-section',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './FooterSection.component.html',
  styleUrl: './FooterSection.component.css',
})
export class FooterSectionComponent implements OnChanges {
  @Input() contactInfo!: ContactInfo;
  @Input() aboutSection!: FooterSection;
  @Input() servicesSection!: FooterSection;
  @Input() copyRightText!: string;

  serviceList: string[] = [];

  ngOnChanges(): void {
    if (this.servicesSection?.content) {
      this.serviceList = this.servicesSection.content.split('|').map(s => s.trim()).filter(Boolean);
    }
  }
}
