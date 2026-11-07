/**
 * src/app/features/admin/application-detail/application-detail.component.ts
 *
 * Full candidate dossier and evaluation review panel for administrators:
 * - Displays complete personal details, address, and academic records
 * - Lists and enables download of all attached student verification documents
 * - Provides decision panel to change status ('under_review', 'accepted', 'rejected')
 * - Writes official reviewer notes that reflect on the student's dashboard
 * - Displays dedicated confirmation page upon decision save with countdown redirect to dashboard
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Application, ApplicationStatus } from '../../../shared/models/application.model';
import { DocumentItem, getDocumentLabel } from '../../../shared/models/document.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);

  applicationId = '';
  application: Application | null = null;
  documents: DocumentItem[] = [];

  isLoading = true;
  isUpdating = false;
  isDecisionSubmitted = false;
  successMessage = '';
  errorMessage = '';
  emailPreviewUrl = '';
  emailDelivered = false;
  recipientEmail = '';
  emailErrorMessage = '';

  // Decision controls
  selectedStatus: ApplicationStatus = 'under_review';
  adminRemarks = '';

  // Countdown timer to move to dashboard
  countdownSeconds = 8;
  countdownTimer: any = null;

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.applicationId) {
      this.loadDossier();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  loadDossier(): void {
    this.isLoading = true;
    this.adminService.getApplicationDetail(this.applicationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.application = res.data.application;
        this.documents = res.data.documents || [];
        this.selectedStatus = this.application.status;
        this.adminRemarks = this.application.adminRemarks || '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load applicant dossier.';
      }
    });
  }

  updateDecision(): void {
    if (!this.application) return;

    this.isUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService
      .updateStatus(this.application._id, this.selectedStatus, this.adminRemarks)
      .subscribe({
        next: (res: any) => {
          this.isUpdating = false;
          this.application = res.data;
          this.emailPreviewUrl = res.data?.emailPreviewUrl || '';
          this.emailDelivered = res.data?.emailDelivered ?? false;
          this.recipientEmail = res.data?.recipientEmail || this.application?.applicant?.email || '';
          this.emailErrorMessage = res.data?.emailErrorMessage || '';
          this.successMessage =
            res.message ||
            `Application status updated to "${res.data.status?.toUpperCase()}". Notification email dispatched to ${this.recipientEmail}.`;
          this.isDecisionSubmitted = true;
          this.startCountdown();
          window.scrollTo({ top: 0, behavior: 'instant' });
        },
        error: (err) => {
          this.isUpdating = false;
          this.errorMessage = err.error?.message || 'Failed to update application decision.';
        }
      });
  }

  startCountdown(): void {
    this.clearTimer();
    this.countdownSeconds = 5;
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.moveToDashboard();
      }
    }, 1000);
  }

  cancelCountdown(): void {
    this.clearTimer();
  }

  clearTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  moveToDashboard(): void {
    this.clearTimer();
    this.router.navigate(['/admin/dashboard']);
  }

  downloadDoc(doc: DocumentItem): void {
    this.adminService.downloadDocument(doc._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Failed to download document.';
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDocTypeLabel(type: string): string {
    return getDocumentLabel(type);
  }
}
