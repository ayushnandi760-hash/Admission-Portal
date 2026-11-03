/**
 * src/app/features/auth/login/login.component.ts
 *
 * Handles student and administrator sign-in.
 * Validates inputs using Reactive Forms.
 * Provides handy demo auto-fill buttons to simplify lab testing/evaluation.
 * Redirects user to role-appropriate dashboard upon success.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  ngOnInit(): void {
    // If already logged in, redirect straight to appropriate dashboard
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.redirectByRole(currentUser.role);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectByRole(res.data.user.role);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Login failed. Please check your credentials and try again.';
      }
    });
  }

  /**
   * Helper for quick lab testing: fills Admin credentials
   */
  fillAdminDemo(): void {
    this.loginForm.patchValue({
      email: 'admin@iem.edu.in',
      password: 'SecureAdminPass@123'
    });
  }

  /**
   * Helper for quick lab testing: fills Student credentials
   */
  fillStudentDemo(): void {
    this.loginForm.patchValue({
      email: 'student@example.com',
      password: 'Password123'
    });
  }

  private redirectByRole(role: string): void {
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/student/dashboard']);
    }
  }
}

