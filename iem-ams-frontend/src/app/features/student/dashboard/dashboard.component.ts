/**
 * src/app/features/student/dashboard/dashboard.component.ts
 *
 * Student main dashboard view.
 * Displays greeting, real-time status of their application, and action pathways.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService } from '../../../core/services/application.service';
import { Application } from '../../../shared/models/application.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  authService = inject(AuthService);
  appService = inject(ApplicationService);

  application: Application | null = null;
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
      },
      error: () => {
        // No application found yet
        this.isLoading = false;
        this.application = null;
      }
    });
  }
}
