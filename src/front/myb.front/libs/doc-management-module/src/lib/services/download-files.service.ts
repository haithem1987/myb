import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadFilesService {

 
    downloadDocument(file: string, documentName: string): void {
        console.log('Attempting to download document:', documentName);
        console.log('Document file:', file);
    
        if (file && documentName) {
          try {
            const base64String = file.split(',')[1];
            if (base64String) {
              const blob = this.b64toBlob(base64String, 'application/pdf');
              const link = window.document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = documentName;
              link.click();
              URL.revokeObjectURL(link.href);
            } else {
              console.error('Base64 string is missing or malformed.');
            }
          } catch (error) {
            console.error('Error while processing base64 string:', error);
          }
        } else {
          console.error('File data or document name is undefined');
        }
      }
    
      viewDocument(file: string, documentName: string): void {
        console.log('Attempting to view document:', documentName);
        console.log('Document file:', file);
    
        if (file && documentName) {
          try {
            const base64String = file.split(',')[1];
            if (base64String) {
              const contentType = this.getContentType(documentName);
              const blob = this.b64toBlob(base64String, contentType);
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            } else {
              console.error('Base64 string is missing or malformed.');
            }
          } catch (error) {
            console.error('Error while processing base64 string:', error);
          }
        } else {
          console.error('File data or document name is undefined');
        }
      }
    
      private b64toBlob(
        b64Data: string,
        contentType: string = '',
        sliceSize: number = 512
      ): Blob {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
    
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
    
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
    
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
    
        return new Blob(byteArrays, { type: contentType });
      }
    
      private getContentType(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'pdf':
            return 'application/pdf';
          case 'png':
            return 'image/png';
          case 'jpeg':
          case 'jpg':
            return 'image/jpeg';
          case 'xls':
            return 'application/vnd.ms-excel';
          case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          case 'docx':
            return 'application/msword';
    
          // Add more cases for other file types if needed
          default:
            return 'application/octet-stream';
        }
      }
}
