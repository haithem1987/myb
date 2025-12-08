import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'myb-front-overview-section',
  standalone: true,
  imports: [CommonModule,TranslateModule],
  templateUrl: './overviewSection.component.html',
  styleUrl: './overviewSection.component.css',
})
export class OverviewSectionComponent {}
