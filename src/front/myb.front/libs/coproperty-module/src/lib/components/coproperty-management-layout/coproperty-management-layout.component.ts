import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserDropdownComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-coproperty-management-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UserDropdownComponent],
  templateUrl: './coproperty-management-layout.component.html',
  styleUrls: ['./coproperty-management-layout.component.scss']
})
export class CopropertyManagementLayoutComponent {}
