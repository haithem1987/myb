import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-no-result',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './no-result.component.html',
  styleUrl: './no-result.component.css',
})
export class NoResultComponent {}
