import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HolidayService {
  private holidaysUrl =
    'https://calendrier.api.gouv.fr/jours-feries/metropole.json';

  constructor(private http: HttpClient) {}

  getHolidays(): Observable<{ [date: string]: string }> {
    return this.http.get<{ [date: string]: string }>(this.holidaysUrl);
  }
}
