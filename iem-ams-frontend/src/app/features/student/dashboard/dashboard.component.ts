/**
 * src/app/features/student/dashboard/dashboard.component.ts
 *
 * Student main dashboard view:
 * - Displays greeting & live application status
 * - Interactive Review Timeline tracking all stages of application processing
 * - Links to Single-Page Full Application View with PDF download
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService } from '../../../core/services/application.service';
import { DocumentService } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Application } from '../../../shared/models/application.model';
import { DocumentItem } from '../../../shared/models/document.model';
import { AppNotification } from '../../../shared/models/notification.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  authService = inject(AuthService);
  appService = inject(ApplicationService);
  docService = inject(DocumentService);
  notifService = inject(NotificationService);

  application: Application | null = null;
  documents: DocumentItem[] = [];
  notifications: AppNotification[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadApplication();
  }

  loadApplication(): void {
    this.isLoading = true;
    this.appService.getMyApplication().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.application = res.data;
        if (this.application?._id) {
          this.loadDocuments(this.application._id);
        }
        this.loadNotifications();
      },
      error: () => {
        this.isLoading = false;
        this.application = null;
        this.loadNotifications();
      }
    });
  }

  loadDocuments(applicationId: string): void {
    this.docService.getMyDocuments(applicationId).subscribe({
      next: (res) => {
        this.documents = res.data || [];
      },
      error: () => {
        this.documents = [];
      }
    });
  }

  loadNotifications(): void {
    this.notifService.getMyNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data?.notifications || [];
      },
      error: () => {
        this.notifications = [];
      }
    });
  }

  get isSubmitted(): boolean {
    return !!this.application && this.application.status !== 'draft';
  }

  get isAccepted(): boolean {
    return this.application?.status === 'accepted';
  }

  get isRejected(): boolean {
    return this.application?.status === 'rejected';
  }

  get isUnderReview(): boolean {
    return this.application?.status === 'under_review' || this.application?.status === 'submitted';
  }

  scrollToTimeline(): void {
    const el = document.getElementById('review-timeline');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
