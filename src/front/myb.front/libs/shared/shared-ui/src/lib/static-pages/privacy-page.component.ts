import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-privacy-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './privacy-page.component.html',
  styleUrl: './privacy-page.component.css',
})
export class PrivacyPageComponent {}
