import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {
  
  /**
   * Download a file from a URL
   */
  downloadUrl(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    this.downloadUrl(url, filename);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download text content as a file
   */
  downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download JSON as a file
   */
  downloadJson(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadText(json, filename, 'application/json');
  }

  /**
   * Generate and download ICS calendar file
   */
  downloadICS(event: { title: string; start: Date; end: Date; location?: string; description?: string }): void {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MYB//Coproperty Management//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.description ? `DESCRIPTION:${event.description}` : '',
      `UID:${Date.now()}@myb.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');

    this.downloadText(icsContent, `${event.title.replace(/\s+/g, '_')}.ics`, 'text/calendar');
  }

  /**
   * Generate mock PDF (in real app, would call API)
   */
  downloadPDF(filename: string, content: string = 'Mock PDF Content'): void {
    // In production, this would fetch actual PDF from API
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (${content}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000356 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
444
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Open file in new tab (for preview)
   */
  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }
}
