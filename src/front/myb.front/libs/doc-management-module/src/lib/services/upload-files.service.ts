import { Injectable } from '@angular/core';
import { AsyncSubject, BehaviorSubject, Observable } from 'rxjs';
import { SelectedFiles } from '../models/SelectedFiles';

@Injectable({
  providedIn: 'root',
})
export class UploadFilesService {
  private selectedFilesSubject = new BehaviorSubject<SelectedFiles[]>([]);
  public selectedFiles$ = this.selectedFilesSubject.asObservable();

  constructor() {}

  public toBase64(files: File[], selectedFiles: SelectedFiles[]): void {
    if (files?.length) {
      Object.keys(files)?.forEach((file, i) => {
        const url = URL.createObjectURL(files[i]);
        const reader = new FileReader();
        reader.readAsDataURL(files[i]);

        reader.onload = (e) => {
          selectedFiles = selectedFiles?.filter(
            (f) => f?.ImageName != files[i]?.name
          );
          selectedFiles.push({
            ImageName: files[i]?.name,
            file: files[i],
            Image: reader?.result as string,
            url: url,
            fileType: files[i].type,
          });
          this.selectedFilesSubject.next(selectedFiles);
        };
      });
    } else {
      this.selectedFilesSubject.next([]);
    }
  }

  public getSelectedFiles(): Observable<SelectedFiles[]> {
    return this.selectedFiles$;
  }
}
