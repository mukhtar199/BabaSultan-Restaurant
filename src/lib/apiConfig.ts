/**
 * Production API Configuration
 * 
 * Manages dynamic routing between local/Cloud Run environments and external deployments (e.g. Vercel).
 * When running on Vercel or external static hosting, routes trusted backend operations directly to Cloud Run
 * where Google Cloud Application Default Credentials (ADC) and Firebase Admin SDK are initialized.
 */

const CLOUD_RUN_BACKEND_URL = 'https://ais-dev-tjm76cbv2lre7keectex27-452893419298.europe-west2.run.app';

export function getApiBaseUrl(): string {
  // 1. Explicit environment variable
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Browser runtime detection: if running on Vercel, route to Cloud Run
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('vercel.app') || host === 'baba-sultan-restaurant.vercel.app') {
      return CLOUD_RUN_BACKEND_URL;
    }
  }

  // 3. Default to relative paths for local development or direct Cloud Run hosting
  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}
