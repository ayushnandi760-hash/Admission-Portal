/**
 * src/app/features/admin/applications-list/applications-list.component.ts
 *
 * Administrator view for managing candidate applications.
 * Features:
 * - Live search by applicant name or email
 * - Filtering by status (Draft, Submitted, Under Review, Accepted, Rejected)
 * - Filtering by academic program (B.Tech, MBA, MCA, M.Tech, BBA)
 * - Pagination controls
 * - Quick link to candidate evaluation detail view
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, PaginationInfo } from '../../../core/services/admin.service';
import { Application, ProgramChoice } from '../../../shared/models/application.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './applications-list.component.html',
  styleUrls: ['./applications-list.component.css']
})
export class ApplicationsListComponent implements OnInit {
  private adminService = inject(AdminService);

  applications: Application[] = [];
  pagination: PaginationInfo = { total: 0, page: 1, limit: 10, totalPages: 1 };

  isLoading = true;
  errorMessage = '';

  // Filters
  searchQuery = '';
  statusFilter = '';
  programFilter = '';

  programs: ProgramChoice[] = ['B.Tech', 'MBA', 'MCA', 'M.Tech', 'BBA'];

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService
      .getApplications({
        status: this.statusFilter || undefined,
        program: this.programFilter || undefined,
        search: this.searchQuery.trim() || undefined,
        page,
        limit: 10
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.applications = res.data.applications;
          this.pagination = res.data.pagination;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to load applications list.';
        }
      });
  }

  applyFilters(): void {
    this.loadApplications(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.programFilter = '';
    this.loadApplications(1);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.pagination.totalPages) {
      this.loadApplications(newPage);
    }
  }
}

