import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-settings-page',
  standalone: true,
  imports: [CommonModule, SettingsComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {}
