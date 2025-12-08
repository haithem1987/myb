import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactInfo, FooterSection } from './footer-data.model';

@Component({
  selector: 'myb-front-footer-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './FooterSection.component.html',
  styleUrl: './FooterSection.component.css',
})
export class FooterSectionComponent {
  @Input() contactInfo!: ContactInfo;
  @Input() aboutSection!: FooterSection;
  @Input() servicesSection!: FooterSection;
  @Input() copyRightText!: string;
}
