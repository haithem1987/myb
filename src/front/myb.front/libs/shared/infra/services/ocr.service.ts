import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private http = inject(HttpClient);
  constructor() {}

  private ocrEndpoint = `${API_CONFIG.ocr}/ocr`;

  performOCR(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files[]', file);
    });
    return this.http.post<any>(this.ocrEndpoint, formData);
  }
}