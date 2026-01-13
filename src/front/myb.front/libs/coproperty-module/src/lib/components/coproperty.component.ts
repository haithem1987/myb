import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-coproperty',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
  ],
  template: `
    <div class="coproperty-container">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class CopropertyComponent {}
