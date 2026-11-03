/**
 * src/app/features/admin/dashboard/dashboard.component.ts
 *
 * Administrator dashboard overview:
 * - Fetches real-time aggregate stats from /api/v1/admin/stats
 * - Displays KPI cards for application lifecycle stages
 * - Displays program-wise application breakdown
 * - Provides direct navigation to applicant queues
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, AdminStats } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  adminService = inject(AdminService);

  stats: AdminStats | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.stats = res.data;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getCountByStatus(status: string): number {
    if (!this.stats?.byStatus) return 0;
    const found = this.stats.byStatus.find(s => s._id === status);
    return found ? found.count : 0;
  }

  getTotalCount(): number {
    if (!this.stats?.byStatus) return 0;
    return this.stats.byStatus.reduce((acc, curr) => acc + curr.count, 0);
  }
}
