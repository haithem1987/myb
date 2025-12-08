import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgbProgressbarConfig,
  NgbProgressbarModule,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'myb-front-progress-bar',
  standalone: true,
  imports: [CommonModule, NgbProgressbarModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
})
export class ProgressBarComponent implements OnInit {
  @Input() value: number = 0;
  @Input() type: 'success' | 'info' | 'warning' | 'danger' = 'info';
  @Input() striped: boolean = false;
  @Input() animated: boolean = false;
  @Input() showValue: boolean = false;
  @Input() max: number = 100;
  @Input() height: string = '10px';

  constructor(config: NgbProgressbarConfig) {
    // Customize default values of progress bars used by this component tree
    config.max = 100;
    config.striped = false;
    config.animated = false;
    config.type = 'info';
  }
  ngOnInit() {
    // This sets the max value from the input
    this.max = this.max || 100;
  }
}
