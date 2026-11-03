/**
 * src/app/core/services/notification.service.ts
 *
 * Angular service managing user notifications.
 * - Polls or fetches unread notification counts
 * - Emits real-time unreadCount$ for the navbar bell badge
 * - Allows marking individual or all notifications as read
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/user.model';
import { AppNotification, NotificationFeed } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  /**
   * Fetch latest notifications feed and refresh unread badge
   */
  getMyNotifications(): Observable<ApiResponse<NotificationFeed>> {
    return this.http.get<ApiResponse<NotificationFeed>>(`${this.baseUrl}/my`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.unreadCountSubject.next(res.data.unreadCount);
        }
      })
    );
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(id: string): Observable<ApiResponse<AppNotification>> {
    return this.http.patch<ApiResponse<AppNotification>>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) {
          this.unreadCountSubject.next(current - 1);
        }
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
      })
    );
  }
}

