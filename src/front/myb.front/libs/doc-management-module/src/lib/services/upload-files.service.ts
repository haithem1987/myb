import { Injectable } from '@angular/core';
import { AsyncSubject, Observable } from 'rxjs';



export interface SelectedFiles {
  ImageName: string;
  Image?: string;
  file: any;
  url?: string;
}
@Injectable({
  providedIn: 'root'
})
export class UploadFilesService {

 
  constructor() { }

  public toBase64(files: File[], selectedFiles: SelectedFiles[]): Observable<SelectedFiles[]> {
    const result = new AsyncSubject<SelectedFiles[]>();

    if (files?.length) {
      Object.keys(files)?.forEach((file, i) => {
        const url = URL.createObjectURL(files[i]);
        const reader = new FileReader();
        reader.readAsDataURL(files[i]);
        reader.onload = (e) => {
          selectedFiles = selectedFiles?.filter(f => f?.ImageName != files[i]?.name);
          selectedFiles.push({ ImageName: files[i]?.name, file: files[i], Image: reader?.result as string, url: url});
          result.next(selectedFiles);

          if (files?.length === (i + 1)) {
            result.complete();
          }
          
          console.log('result',selectedFiles);
          // selectedFiles.forEach((selectedFile) => {
          //   const fileSize = selectedFile.file.size; // Accessing the size property of the file
          //   console.log("File Size:", fileSize);
            
          // });


        };
      });
      return result;
    } else {
      result.next([]);
      result.complete();
      return result;
    }
  }
}
