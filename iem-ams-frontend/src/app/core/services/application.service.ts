/**
 * src/app/core/services/application.service.ts
 *
 * Angular service handling Student Admission Application CRUD operations.
 * - getProgramsConfig()
 * - getMyApplication()
 * - getApplicationById()
 * - createApplication()
 * - updateApplication()
 * - checkDocumentsStatus()
 * - submitApplication()
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/user.model';
import {
  Application,
  ApplicationPayload,
  ProgramsConfigResponse,
  DocumentsStatusResponse,
} from '../../shared/models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/applications`;

  /**
   * Fetch verified configurable IEM academic programs, sessions, categories & doc rules
   */
  getProgramsConfig(): Observable<ApiResponse<ProgramsConfigResponse>> {
    return this.http.get<ApiResponse<ProgramsConfigResponse>>(`${this.baseUrl}/config/programs`);
  }

  /**
   * Get the authenticated student's active application
   */
  getMyApplication(): Observable<ApiResponse<Application>> {
    return this.http.get<ApiResponse<Application>>(`${this.baseUrl}/my`);
  }

  /**
   * Get an application by its unique database ID
   */
  getApplicationById(id: string): Observable<ApiResponse<Application>> {
    return this.http.get<ApiResponse<Application>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new draft application
   */
  createApplication(payload: ApplicationPayload): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(this.baseUrl, payload);
  }

  /**
   * Update an existing draft application (saves wizard steps)
   */
  updateApplication(id: string, payload: Partial<ApplicationPayload>): Observable<ApiResponse<Application>> {
    return this.http.put<ApiResponse<Application>>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Check uploaded vs missing documents for an application
   */
  checkDocumentsStatus(id: string): Observable<ApiResponse<DocumentsStatusResponse>> {
    return this.http.get<ApiResponse<DocumentsStatusResponse>>(`${this.baseUrl}/${id}/documents-status`);
  }

  /**
   * Finalize and lock the application for admin review
   */
  submitApplication(id: string): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(`${this.baseUrl}/${id}/submit`, {});
  }
}
