/**
 * src/app/core/services/admin.service.ts
 *
 * Angular service handling all administrative operations:
 * - Fetching admission statistics (KPI aggregations)
 * - Querying, searching, and filtering applications
 * - Retrieving full candidate dossiers with attached documents
 * - Updating application review statuses and remarks
 * - Downloading candidate verification documents
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/user.model';
import { Application, ApplicationStatus } from '../../shared/models/application.model';
import { DocumentItem } from '../../shared/models/document.model';

export interface AdminStats {
  byStatus: { _id: string; count: number }[];
  byProgram: { _id: string; count: number }[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationsListResponse {
  applications: Application[];
  pagination: PaginationInfo;
}

export interface ApplicationDetailResponse {
  application: Application;
  documents: DocumentItem[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  /**
   * Fetch aggregate counts by status and academic program
   */
  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.baseUrl}/stats`);
  }

  /**
   * List all applications with optional filtering and pagination
   */
  getApplications(params: {
    status?: string;
    program?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<ApiResponse<ApplicationsListResponse>> {
    let httpParams = new HttpParams();

    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.program) httpParams = httpParams.set('program', params.program);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ApiResponse<ApplicationsListResponse>>(`${this.baseUrl}/applications`, {
      params: httpParams
    });
  }

  /**
   * Get full applicant file and attached documents
   */
  getApplicationDetail(id: string): Observable<ApiResponse<ApplicationDetailResponse>> {
    return this.http.get<ApiResponse<ApplicationDetailResponse>>(`${this.baseUrl}/applications/${id}`);
  }

  /**
   * Update review status and write official reviewer remarks
   */
  updateStatus(
    id: string,
    status: ApplicationStatus,
    adminRemarks?: string
  ): Observable<ApiResponse<Application>> {
    return this.http.patch<ApiResponse<Application>>(`${this.baseUrl}/applications/${id}/status`, {
      status,
      adminRemarks
    });
  }

  /**
   * Download any candidate's verification file as a binary Blob
   */
  downloadDocument(docId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${docId}/download`, {
      responseType: 'blob'
    });
  }
}
