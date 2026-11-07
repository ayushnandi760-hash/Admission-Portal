/**
 * src/app/features/student/view-application/view-application.component.ts
 *
 * Single-Page Full Application View Component:
 * - Displays the entire admission dossier in a unified single page
 * - Provides single-click "Download PDF / Print" functionality
 * - Displays all 6 form sections + all uploaded documents with download links
 * - Clean @media print CSS for downloading high-fidelity PDF
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { Application } from '../../../shared/models/application.model';
import { DocumentItem } from '../../../shared/models/document.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-view-application',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './view-application.component.html',
  styleUrls: ['./view-application.component.css'],
})
export class ViewApplicationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appService = inject(ApplicationService);
  private docService = inject(DocumentService);
  public authService = inject(AuthService);

  application: Application | null = null;
  documents: DocumentItem[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id');
    this.loadApplication(appId);
  }

  loadApplication(appId: string | null): void {
    this.isLoading = true;
    const req$ = appId
      ? this.appService.getApplicationById(appId)
      : this.appService.getMyApplication();

    req$.subscribe({
      next: (res) => {
        if (res.data) {
          this.application = res.data;
          this.loadDocuments(res.data._id);
        } else {
          this.isLoading = false;
          this.errorMessage = 'No admission application found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load application details.';
      },
    });
  }

  loadDocuments(applicationId: string): void {
    this.docService.getMyDocuments(applicationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.documents = res.data || [];
      },
      error: () => {
        this.isLoading = false;
        this.documents = [];
      },
    });
  }

  downloadDoc(doc: DocumentItem): void {
    this.docService.downloadDocument(doc._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Could not download document file.');
      },
    });
  }

  formatBytes(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  downloadPdf(): void {
    window.print();
  }
}
