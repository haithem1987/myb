import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FunctionsUtilsService {
  getApprovalStatus(isApproved: boolean): {
    text: string;
    badgeClass: string;
  } {
    if (isApproved) {
      return { text: 'Approuvé', badgeClass: 'bg-success' };
    } else {
      return { text: 'En attente', badgeClass: 'bg-warning' };
    }
  }
}
