/**
 * src/app/shared/components/navbar/navbar.component.ts
 *
 * Top navigation bar component.
 * Displays IEM branding, role-specific navigation links, current user name/role badge,
 * interactive notification bell dropdown, and sign-out button.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  showNotifications = false;
  notifications: AppNotification[] = [];
  isLoadingNotifs = false;

  ngOnInit(): void {
    // If user is logged in, fetch notifications
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.notifService.getMyNotifications().subscribe({
          next: (res) => {
            this.notifications = res.data?.notifications || [];
          }
        });
      } else {
        this.notifications = [];
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.refreshNotifications();
    }
  }

  refreshNotifications(): void {
    this.isLoadingNotifs = true;
    this.notifService.getMyNotifications().subscribe({
      next: (res) => {
        this.isLoadingNotifs = false;
        this.notifications = res.data?.notifications || [];
      },
      error: () => {
        this.isLoadingNotifs = false;
      }
    });
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.isRead = true));
      }
    });
  }

  logout(): void {
    this.showNotifications = false;
    this.authService.logout();
  }
}
