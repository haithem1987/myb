import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-terms-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './terms-page.component.html',
  styleUrl: './terms-page.component.css',
})
export class TermsPageComponent {}
