/**
 * src/app/shared/components/status-badge/status-badge.component.ts
 *
 * Reusable visual pill component for application statuses:
 * - draft: Grey
 * - submitted: Blue
 * - under_review: Orange
 * - accepted: Green
 * - rejected: Red
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStatus } from '../../models/application.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge py-1 px-2 text-uppercase fw-semibold" [ngClass]="badgeClass">
      <span class="me-1">{{ icon }}</span>
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: ApplicationStatus | string = 'draft';

  get badgeClass(): string {
    switch (this.status) {
      case 'draft':
        return 'bg-secondary text-white';
      case 'submitted':
        return 'bg-primary text-white';
      case 'under_review':
        return 'bg-warning text-dark';
      case 'accepted':
        return 'bg-success text-white';
      case 'rejected':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'accepted':
        return 'Accepted / Selected';
      case 'rejected':
        return 'Rejected';
      default:
        return this.status;
    }
  }

  get icon(): string {
    switch (this.status) {
      case 'draft':
        return '✏️';
      case 'submitted':
        return '📨';
      case 'under_review':
        return '⏳';
      case 'accepted':
        return '🎉';
      case 'rejected':
        return '❌';
      default:
        return 'ℹ️';
    }
  }
}

