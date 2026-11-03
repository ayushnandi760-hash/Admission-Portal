/**
 * src/app/core/services/document.service.ts
 *
 * Angular service managing document uploads, listing, deletion, and downloads.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/user.model';
import { DocumentItem } from '../../shared/models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/documents`;

  /**
   * Get all documents attached to current student's application
   */
  getMyDocuments(applicationId?: string): Observable<ApiResponse<DocumentItem[]>> {
    const url = applicationId ? `${this.baseUrl}/my?applicationId=${applicationId}` : `${this.baseUrl}/my`;
    return this.http.get<ApiResponse<DocumentItem[]>>(url);
  }

  /**
   * Upload a new document file via multipart/form-data
   */
  uploadDocument(formData: FormData): Observable<ApiResponse<DocumentItem>> {
    return this.http.post<ApiResponse<DocumentItem>>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Delete an uploaded document (only allowed if application is in draft)
   */
  deleteDocument(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Download a document by ID as a binary Blob
   */
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}

