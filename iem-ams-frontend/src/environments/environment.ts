/**
 * src/environments/environment.ts
 *
 * Development environment configuration.
 * The API base URL points to the Angular dev-server proxy (/api),
 * which forwards requests to Express on port 5000.
 * This avoids CORS issues during local development.
 *
 * Production values are in environment.prod.ts.
 */
export const environment = {
  production: false,
  apiUrl: '/api/v1',
};

