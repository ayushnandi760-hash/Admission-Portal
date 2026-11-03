/**
 * src/app/core/services/auth.service.ts
 *
 * Central service for user authentication and state management.
 * - Stores JWT token and user info in localStorage
 * - Maintains a BehaviorSubject (currentUser$) so all components reactively know the auth state
 * - Provides helper methods: isLoggedIn(), isAdmin(), isStudent(), logout()
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginPayload, RegisterPayload, ApiResponse } from '../../shared/models/user.model';

const TOKEN_KEY = 'iem_ams_token';
const USER_KEY = 'iem_ams_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    // If a token exists, verify validity by calling /auth/me in the background
    if (this.getToken()) {
      this.fetchCurrentUser().subscribe();
    }
  }

  /**
   * Current value of logged in user (synchronous snapshot)
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Log in user with email & password
   */
  public login(credentials: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setSession(response.data.token, response.data.user);
        }
      })
    );
  }

  /**
   * Register a new student account
   */
  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setSession(response.data.token, response.data.user);
        }
      })
    );
  }

  /**
   * Fetches the current user profile from the server using the stored token
   */
  public fetchCurrentUser(): Observable<ApiResponse<User> | null> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.saveUser(res.data);
          this.currentUserSubject.next(res.data);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Clears session and redirects to login
   */
  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Returns true if user is logged in
   */
  public isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  /**
   * Checks if current user has the admin role
   */
  public isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  /**
   * Checks if current user has the student role
   */
  public isStudent(): boolean {
    return this.currentUserValue?.role === 'student';
  }

  /**
   * Retrieve stored raw JWT
   */
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.saveUser(user);
    this.currentUserSubject.next(user);
  }

  private saveUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

