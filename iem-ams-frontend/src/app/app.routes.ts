/**
 * src/app/app.routes.ts
 *
 * Defines the application routing table.
 * Applies authGuard and roleGuard to protected features.
 */

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { StudentDashboardComponent } from './features/student/dashboard/dashboard.component';
import { ApplyComponent } from './features/student/apply/apply.component';
import { UploadDocumentsComponent } from './features/student/upload-documents/upload-documents.component';
import { ViewApplicationComponent } from './features/student/view-application/view-application.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ApplicationsListComponent } from './features/admin/applications-list/applications-list.component';
import { ApplicationDetailComponent } from './features/admin/application-detail/application-detail.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Student routes (requires authentication + student role)
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'apply', component: ApplyComponent },
      { path: 'view', component: ViewApplicationComponent },
      { path: 'view/:id', component: ViewApplicationComponent },
      { path: 'documents', component: UploadDocumentsComponent },
      { path: 'documents/:applicationId', component: UploadDocumentsComponent },
      { path: 'application/documents/:applicationId', component: UploadDocumentsComponent }
    ]
  },
  // Dedicated top-level alias route requested in specification
  {
    path: 'application/documents/:applicationId',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    component: UploadDocumentsComponent
  },
  {
    path: 'application/view',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    component: ViewApplicationComponent
  },
  {
    path: 'application/view/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    component: ViewApplicationComponent
  },

  // Admin routes (requires authentication + admin role)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'applications', component: ApplicationsListComponent },
      { path: 'applications/:id', component: ApplicationDetailComponent }
    ]
  },

  // Wildcard fallback
  { path: '**', redirectTo: '/login' }
];
