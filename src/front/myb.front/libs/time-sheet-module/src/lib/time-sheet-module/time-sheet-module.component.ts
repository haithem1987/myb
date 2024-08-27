import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import {
  BreadcrumbComponent,
  ToastsContainerComponent,
} from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-time-sheet-module',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    RouterOutlet,
    NavbarComponent,
    ToastsContainerComponent,
  ],
  templateUrl: './time-sheet-module.component.html',
  styleUrl: './time-sheet-module.component.css',
})
export class TimeSheetModuleComponent implements OnInit {
  ngOnInit() {}
}
