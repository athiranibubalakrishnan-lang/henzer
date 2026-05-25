import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface UploadResult {
  success: boolean;
  message: string;
  count?: number;
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent {

  selectedFile: File | null = null;
  uploading   = false;
  result: UploadResult | null = null;
  dragOver    = false;

  constructor(private http: HttpClient, private router: Router) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave() {
    this.dragOver = false;
  }

  private setFile(file: File) {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      this.result = { success: false, message: 'Only Excel files (.xlsx, .xls) are allowed.' };
      return;
    }
    this.selectedFile = file;
    this.result = null;
  }

  clearFile() {
    this.selectedFile = null;
    this.result = null;
  }

  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;
    this.result    = null;

    this.http.post<any>(`${environment.apiUrl}/api/products/bulk-upload`, formData).subscribe({
      next: (res) => {
        this.uploading = false;
        this.result = {
          success: true,
          message: res?.message ?? 'Products uploaded successfully.',
          count:   res?.count ?? res?.uploadedCount ?? null
        };
        this.selectedFile = null;
        // Redirect to view products with success flag after short delay
        setTimeout(() => {
          this.router.navigate(['/view-products'], { queryParams: { uploadSuccess: '1' } });
        }, 800);
      },
      error: (err) => {
        this.uploading = false;
        this.result = {
          success: false,
          message: err?.error?.message ?? err?.error ?? 'Upload failed. Please check your file and try again.'
        };
      }
    });
  }

  goToProducts() {
    this.router.navigate(['/view-products']);
  }
}
